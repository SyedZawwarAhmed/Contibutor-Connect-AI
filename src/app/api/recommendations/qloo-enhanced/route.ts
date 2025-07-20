// src/app/api/recommendations/qloo-enhanced/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { llmService } from "@/lib/llm"
import { qlooClient } from "@/lib/qloo/qloo-client"
import { withRemoteMCPClient } from "@/lib/mcp-client-remote"
import { mapTechToCulture, extractQlooUrns } from "@/lib/qloo/qloo-mapper"

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { query, use_qloo = true } = await req.json()

    // Get user's GitHub profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        githubUsername: true,
        bio: true,
        location: true,
        company: true,
        publicRepos: true,
        followers: true,
      },
    })

    if (!user?.githubUsername) {
      return NextResponse.json(
        { error: "GitHub profile not found" },
        { status: 400 }
      )
    }

    // Step 1: Get GitHub data using MCP
    let githubData: any = null
    let userLanguages: string[] = []
    let userTopics: string[] = []

    try {
      githubData = await withRemoteMCPClient(async client => {
        const userAnalysis = await client.analyzeUserGitHubProfile(
          user.githubUsername!
        )

        // Extract languages and topics from user's repositories
        const userRepos = await client.searchRepositories({
          query: `user:${user.githubUsername}`,
        })

        return { userAnalysis, userRepos }
      })

      // Extract languages and topics
      if (githubData.userAnalysis?.technical_profile?.primary_languages) {
        userLanguages = Object.keys(
          githubData.userAnalysis.technical_profile.primary_languages
        )
      }

      if (githubData.userRepos?.repositories) {
        githubData.userRepos.repositories.forEach((repo: any) => {
          if (repo.topics) {
            userTopics.push(...repo.topics)
          }
        })
      }
    } catch (error) {
      console.error("Failed to get GitHub data:", error)
    }

    // Step 2: Enhance with Qloo insights if enabled
    let qlooInsights: any = null
    let culturalProfile: any = null

    if (use_qloo && process.env.QLOO_API_KEY) {
      try {
        // Enhance user profile with Qloo
        culturalProfile = await qlooClient.enhanceUserProfile({
          username: user.githubUsername,
          languages: userLanguages,
          topics: [...new Set(userTopics)],
          bio: user.bio || undefined,
          location: user.location || undefined,
          followers: user.followers || undefined,
          publicRepos: user.publicRepos || undefined,
        })

        // Get demographic insights using URN tags
        const culturalTags = mapTechToCulture([
          ...userLanguages,
          ...extractTechFromQuery(query),
        ])
        
        // Extract Qloo-compatible URN tags for API calls
        const qlooUrns = extractQlooUrns([
          ...userLanguages,
          ...extractTechFromQuery(query),
        ])

        const demographics = await qlooClient.getDemographics(qlooUrns)

        // Get taste analysis
        const tasteAnalysis = await qlooClient.getTasteAnalysis(qlooUrns)

        qlooInsights = {
          culturalProfile,
          demographics: demographics.results?.demographics || [],
          relatedInterests: tasteAnalysis.results?.tags || [],
          culturalTags,
          qlooUrns,
        }
      } catch (error) {
        console.error("Failed to get Qloo insights:", error)
      }
    }

    // Step 3: Search for projects with cultural awareness
    let projectSearchResults: any = null

    try {
      projectSearchResults = await withRemoteMCPClient(async client => {
        const searchResults = await client.searchRepositories({
          query: query,
          language: userLanguages[0],
          has_good_first_issues: true,
          active_recently: true,
        })

        return searchResults
      })
    } catch (error) {
      console.error("Failed to search projects:", error)
    }

    // Step 4: Apply cultural scoring if Qloo insights available
    let culturallyEnhancedProjects = projectSearchResults?.repositories || []

    if (qlooInsights && culturallyEnhancedProjects.length > 0) {
      culturallyEnhancedProjects =
        await qlooClient.findCulturallySimilarProjects(
          qlooInsights.culturalTags,
          culturallyEnhancedProjects.map((repo: any) => ({
            name: repo.name,
            topics: repo.topics || [],
            language: repo.language || "unknown",
          }))
        )
    }

    // Step 5: Generate recommendations with enhanced context
    const enhancedPrompt = createQlooEnhancedPrompt(
      query,
      user,
      githubData,
      qlooInsights,
      culturallyEnhancedProjects
    )

    const recommendations = await llmService.generateProjectRecommendations(
      enhancedPrompt,
      user
    )

    // Add Qloo metadata to response
    return NextResponse.json({
      success: true,
      data: recommendations,
      metadata: {
        qloo_insights_used: !!qlooInsights,
        cultural_tags_identified: qlooInsights?.culturalTags?.length || 0,
        demographics_analyzed: !!qlooInsights?.demographics?.length,
        cultural_scoring_applied:
          !!qlooInsights && culturallyEnhancedProjects.length > 0,
        total_projects_analyzed: projectSearchResults?.total_found || 0,
      },
      qloo_insights: qlooInsights,
    })
  } catch (error) {
    console.error("Qloo-enhanced recommendations error:", error)
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    )
  }
}

// Helper function to create Qloo-enhanced prompt
function createQlooEnhancedPrompt(
  query: string,
  user: any,
  githubData: any,
  qlooInsights: any,
  projects: any[]
) {
  let prompt = `Generate project recommendations based on the following enhanced analysis:\n\n`

  prompt += `USER QUERY: "${query}"\n\n`

  // Add GitHub profile info
  prompt += `GITHUB PROFILE:\n`
  prompt += `- Username: @${user.githubUsername}\n`
  prompt += `- Public Repos: ${user.publicRepos || 0}\n`
  prompt += `- Followers: ${user.followers || 0}\n`
  if (user.bio) prompt += `- Bio: ${user.bio}\n`
  if (user.location) prompt += `- Location: ${user.location}\n`
  prompt += `\n`

  // Add technical profile
  if (githubData?.userAnalysis) {
    prompt += `TECHNICAL ANALYSIS:\n`
    const tech = githubData.userAnalysis.technical_profile
    if (tech?.primary_languages) {
      prompt += `- Primary Languages: ${Object.keys(
        tech.primary_languages
      ).join(", ")}\n`
    }
    if (githubData.userAnalysis.experience_indicators) {
      prompt += `- Experience Level: ${githubData.userAnalysis.experience_indicators.experience_level}\n`
    }
    prompt += `\n`
  }

  // Add Qloo cultural insights
  if (qlooInsights) {
    prompt += `CULTURAL INTELLIGENCE INSIGHTS (via Qloo):\n`

    if (qlooInsights.culturalTags?.length > 0) {
      prompt += `- Cultural Interests: ${qlooInsights.culturalTags
        .slice(0, 10)
        .join(", ")}\n`
    }

    if (qlooInsights.relatedInterests?.length > 0) {
      prompt += `- Related Interests: ${qlooInsights.relatedInterests
        .slice(0, 5)
        .map((t: any) => t.name)
        .join(", ")}\n`
    }

    if (qlooInsights.demographics?.length > 0) {
      const topDemo = qlooInsights.demographics[0]
      prompt += `- Primary Demographic: ${topDemo.age_group} ${
        topDemo.gender
      } (${(topDemo.affinity_score * 100).toFixed(1)}% affinity)\n`
    }

    prompt += `\nThese cultural insights suggest the user would be interested in projects that align with their broader interests beyond just technical skills.\n\n`
  }

  // Add culturally scored projects
  if (projects.length > 0) {
    prompt += `CULTURALLY ALIGNED PROJECTS (scored by cultural fit):\n`
    projects.slice(0, 10).forEach((project: any, index: number) => {
      prompt += `${index + 1}. ${project.name}`
      if (project.culturalScore) {
        prompt += ` (Cultural Alignment: ${(
          project.culturalScore * 100
        ).toFixed(0)}%)`
      }
      if (project.matchedTags?.length > 0) {
        prompt += ` - Matched Interests: ${project.matchedTags
          .slice(0, 3)
          .join(", ")}`
      }
      prompt += `\n`
    })
    prompt += `\n`
  }

  prompt += `Based on this comprehensive analysis combining technical skills with cultural interests, recommend 3-5 projects that would be PERFECT matches. Consider both technical fit AND cultural alignment. Projects should resonate with the user's broader interests and values, not just their coding skills.\n\n`

  prompt += `For each recommendation, explain:\n`
  prompt += `1. Why it's technically suitable\n`
  prompt += `2. How it aligns with their cultural interests\n`
  prompt += `3. Why the community would be a good fit\n`

  return prompt
}

// Extract technical terms from query
function extractTechFromQuery(query: string): string[] {
  const techKeywords = [
    "javascript",
    "typescript",
    "python",
    "java",
    "go",
    "rust",
    "react",
    "vue",
    "angular",
    "node",
    "django",
    "flask",
    "spring",
    "kubernetes",
    "docker",
    "aws",
    "azure",
    "gcp",
    "ml",
    "ai",
    "blockchain",
    "web3",
    "mobile",
    "ios",
    "android",
    "frontend",
    "backend",
    "fullstack",
    "devops",
    "database",
    "api",
  ]

  const queryLower = query.toLowerCase()
  return techKeywords.filter(keyword => queryLower.includes(keyword))
}
