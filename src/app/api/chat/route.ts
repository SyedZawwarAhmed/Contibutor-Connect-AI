// src/app/api/chat/route.ts (Enhanced Version)
import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { streamText } from "ai"
import { google } from "@ai-sdk/google"
import { prisma } from "@/lib/prisma"
import { llmService } from "@/lib/llm"
import { withRemoteMCPClient } from "@/lib/mcp-client-remote"
import { qlooClient } from "@/lib/qloo/qloo-client"
import { mapTechToCulture } from "@/lib/qloo/qloo-mapper"
import { extractAndValidateGitHubUrls } from "@/lib/github-validation"
// Configure Google model
const getModel = () => {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not configured")
  }
  return google("gemini-2.0-flash")
}

// Enhanced system context with MCP and Qloo capabilities
const createEnhancedSystemPrompt = (
  userProfile: any,
  mcpContext?: string,
  qlooContext?: string
) => `
You are ContributorConnect AI, an intelligent assistant powered by real-time GitHub data AND cultural intelligence that helps developers discover open-source projects perfect for their skills, interests, and personality.

${mcpContext ? `REAL-TIME GITHUB CONTEXT:\n${mcpContext}\n` : ""}

${
  qlooContext
    ? `CULTURAL INTELLIGENCE CONTEXT (via Qloo):\n${qlooContext}\n`
    : ""
}

User Profile Context:
${userProfile?.githubUsername ? `- GitHub: @${userProfile.githubUsername}` : ""}
${userProfile?.bio ? `- Bio: ${userProfile.bio}` : ""}
${userProfile?.company ? `- Company: ${userProfile.company}` : ""}
${userProfile?.location ? `- Location: ${userProfile.location}` : ""}
${
  userProfile?.publicRepos
    ? `- Public Repositories: ${userProfile.publicRepos}`
    : ""
}
${userProfile?.followers ? `- Followers: ${userProfile.followers}` : ""}
${
  userProfile?.githubCreatedAt
    ? `- GitHub Member Since: ${userProfile.githubCreatedAt}`
    : ""
}

Your capabilities include:
1. **Live GitHub Data Access**: I can search real GitHub repositories and analyze user profiles in real-time
2. **Cultural Intelligence**: I use Qloo's taste AI to understand your interests beyond coding and find projects that align with your personality
3. **Smart Project Discovery**: I find active projects that match your technical skills AND cultural preferences  
4. **Community Analysis**: I evaluate project health, beginner-friendliness, and community cultural fit
5. **Demographic Matching**: I consider demographic alignment to ensure you'll fit in with project communities
6. **Contribution Guidance**: I provide specific advice on how to get started with contributions

When users ask about finding projects or contributions, I'll:
- Search live GitHub data for relevant repositories
- Apply cultural intelligence to understand personality fit beyond technical skills
- Analyze project health and contribution opportunities
- Consider user experience level, preferences, AND cultural alignment
- Match with communities that share similar demographics and interests
- Provide specific repository recommendations with actionable next steps
- **ALWAYS include full GitHub URLs (https://github.com/owner/repo) for every project I recommend**
- **CRITICAL: All GitHub URLs MUST be valid and accessible (no 404 errors)**

IMPORTANT: When recommending projects, you MUST include:
1. The project name in owner/repo format
2. The complete GitHub URL (https://github.com/owner/repo) - this is REQUIRED for every recommendation
3. A brief description of the project
4. Why it's technically a good match
5. How it aligns with their cultural interests and personality
6. Why the community would be a good cultural fit

VALIDATION REQUIREMENTS:
- Only recommend repositories that actually exist and are publicly accessible
- Double-check that all GitHub URLs are correct and don't return 404 errors
- Use well-known, established projects with active maintenance
- Verify repository names and owners are accurate

I'm encouraging, helpful, and focus on building confidence in open-source contribution. I use conversational tone while being informative and specific. I go beyond just technical matching to find projects where developers will truly thrive culturally and socially.
`

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messages, structured = false } = await req.json()
    const lastMessage = messages[messages.length - 1]?.content || ""

    // Get user's GitHub profile data for context
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        githubUsername: true,
        bio: true,
        location: true,
        company: true,
        publicRepos: true,
        followers: true,
        following: true,
        githubCreatedAt: true,
      },
    })

    // Analyze user intent to determine response type
    const intent = await llmService.analyzeUserIntent(lastMessage)

    // Enhanced MCP context gathering for project-related queries
    let mcpContext = ""
    let mcpData: any = null
    if (intent.intent === "project_search" && user?.githubUsername) {
      try {
        mcpData = await withRemoteMCPClient(async client => {
          // Get user analysis with error handling
          let userAnalysis = null
          try {
            userAnalysis = await client.analyzeUserGitHubProfile(
              user.githubUsername!
            )
          } catch (error) {
            console.warn("User analysis failed:", error)
          }

          // Get relevant repositories based on query with error handling
          let searchResults: any = { total_found: 0, repositories: [] }
          try {
            searchResults = await client.searchRepositories({
              query: lastMessage,
              language: intent.technologies[0],
              difficulty:
                intent.difficultyLevel === "any"
                  ? undefined
                  : intent.difficultyLevel,
              has_good_first_issues: intent.difficultyLevel === "beginner",
              active_recently: true,
            })
          } catch (error) {
            console.warn("Repository search failed:", error)
          }

          // Get trending repos for additional context with error handling
          let trendingRepos = null
          try {
            if (intent.technologies[0]) {
              trendingRepos = await client.getTrendingRepositories({
                language: intent.technologies[0],
                since: "weekly",
                limit: 3,
              })
            }
          } catch (error) {
            console.warn("Trending repos failed:", error)
          }

          return { userAnalysis, searchResults, trendingRepos }
        })

        console.log("MCP Data retrieved successfully:", {
          hasUserAnalysis: !!mcpData.userAnalysis,
          reposFound: mcpData.searchResults?.total_found || 0,
          hasTrending: !!mcpData.trendingRepos,
        })

        // Format MCP context for Claude with safe property access
        let contextParts = ["LIVE GITHUB DATA ANALYSIS:\n"]

        // User analysis section
        if (
          mcpData.userAnalysis &&
          mcpData.userAnalysis.experience_indicators
        ) {
          contextParts.push("User GitHub Analysis:")
          contextParts.push(
            `- Experience Level: ${
              mcpData.userAnalysis.experience_indicators.experience_level ||
              "Unknown"
            }`
          )

          if (mcpData.userAnalysis.technical_profile?.primary_languages) {
            const languages = Object.keys(
              mcpData.userAnalysis.technical_profile.primary_languages
            ).slice(0, 3)
            if (languages.length > 0) {
              contextParts.push(`- Primary Languages: ${languages.join(", ")}`)
            }
          }

          if (
            mcpData.userAnalysis.recommendations?.suggested_contribution_types
          ) {
            contextParts.push(
              `- Contribution Types: ${mcpData.userAnalysis.recommendations.suggested_contribution_types.join(
                ", "
              )}`
            )
          }
        } else {
          contextParts.push(
            "User GitHub Analysis: Profile analysis unavailable"
          )
        }

        // Repository search results
        contextParts.push(
          `\nRelevant Repositories Found (${
            mcpData.searchResults?.total_found || 0
          } total):`
        )

        if (
          mcpData.searchResults?.repositories &&
          mcpData.searchResults.repositories.length > 0
        ) {
          mcpData.searchResults.repositories
            .slice(0, 5)
            .forEach((repo: any, i: number) => {
              contextParts.push(`${i + 1}. ${repo.name || "Unknown"}`)
              contextParts.push(`   ${repo.description || "No description"}`)
              contextParts.push(
                `   Languages: ${repo.language || "Mixed"} | Stars: ${
                  repo.stars || 0
                } | Topics: ${repo.topics?.slice(0, 3).join(", ") || "None"}`
              )
              contextParts.push(`   URL: ${repo.url || ""}`)

              if (repo.contributionMetrics?.hasGoodFirstIssues) {
                contextParts.push(`   Good First Issues: Yes`)
              }
              contextParts.push("")
            })
        } else {
          contextParts.push("No repositories found matching the criteria")
        }

        // Trending repositories
        if (
          mcpData.trendingRepos?.trending_repositories &&
          mcpData.trendingRepos.trending_repositories.length > 0
        ) {
          contextParts.push(
            `\nTrending ${intent.technologies[0] || "All"} Projects:`
          )
          mcpData.trendingRepos.trending_repositories
            .slice(0, 3)
            .forEach((repo: any, i: number) => {
              contextParts.push(
                `${i + 1}. ${repo.name || "Unknown"} (${
                  repo.stars || 0
                } stars) - ${repo.description || "No description"}`
              )
            })
        }

        contextParts.push(
          "\nUse this real data to provide specific, actionable recommendations."
        )
        mcpContext = contextParts.join("\n")
      } catch (mcpError) {
        console.error("MCP context gathering failed:", mcpError)
        mcpContext =
          "Note: Live GitHub data temporarily unavailable, providing recommendations based on general knowledge and user profile."
      }
    }

    // Enhanced Qloo cultural intelligence context gathering
    let qlooContext = ""
    if (
      intent.intent === "project_search" &&
      user?.githubUsername &&
      process.env.QLOO_API_KEY
    ) {
      try {
        console.log("Gathering Qloo cultural insights...")

        // Extract technical interests from user query and profile
        const queryTechTerms = extractTechFromQuery(lastMessage)
        const userLanguages = mcpData?.userAnalysis?.technical_profile
          ?.primary_languages
          ? Object.keys(
              mcpData.userAnalysis.technical_profile.primary_languages
            )
          : []

        // Map to cultural tags
        const culturalTags = mapTechToCulture([
          ...queryTechTerms,
          ...userLanguages,
        ])

        // Get cultural insights
        const [demographics, tasteAnalysis] = await Promise.allSettled([
          qlooClient.getDemographics(culturalTags),
          qlooClient.getTasteAnalysis(culturalTags),
        ])

        // Build cultural context
        let contextParts = ["CULTURAL INTELLIGENCE ANALYSIS:"]

        // Add mapped cultural interests
        if (culturalTags.length > 0) {
          contextParts.push(
            `Identified Cultural Interests: ${culturalTags
              .slice(0, 8)
              .join(", ")}`
          )
        }

        // Add demographic insights
        if (
          demographics.status === "fulfilled" &&
          demographics.value.demographics &&
          demographics.value.demographics.length > 0
        ) {
          const topDemo = demographics.value.demographics[0]
          contextParts.push(
            `Primary Demographic Match: ${topDemo.age_group} ${
              topDemo.gender
            } (${(topDemo.affinity_score * 100).toFixed(1)}% affinity)`
          )

          // Add top 3 demographics
          const topDemos = demographics.value.demographics.slice(0, 3)
          contextParts.push(
            `Demographic Profile: ${topDemos
              .map(
                d =>
                  `${d.age_group} ${d.gender} (${(
                    d.affinity_score * 100
                  ).toFixed(0)}%)`
              )
              .join(", ")}`
          )
        }

        // Add taste connections
        if (
          tasteAnalysis.status === "fulfilled" &&
          tasteAnalysis.value.tags &&
          tasteAnalysis.value.tags.length > 0
        ) {
          const relatedInterests = tasteAnalysis.value.tags
            .slice(0, 6)
            .map(t => t.name)
          contextParts.push(
            `Related Cultural Interests: ${relatedInterests.join(", ")}`
          )
        }

        // Add location insights if available
        if (user.location) {
          contextParts.push(
            `Location Context: Based in ${user.location} - consider timezone and regional tech communities`
          )
        }

        contextParts.push(
          "\nThis cultural analysis helps identify projects where the developer will fit in socially and culturally, not just technically."
        )

        qlooContext = contextParts.join("\n")

        console.log("Qloo cultural insights gathered successfully")
      } catch (qlooError) {
        console.error("Qloo context gathering failed:", qlooError)
        qlooContext =
          "Note: Cultural intelligence temporarily unavailable, focusing on technical matching."
      }
    }

    // If user is asking for project recommendations and structured mode requested
    if (intent.intent === "project_search" && structured) {
      try {
        // Use the enhanced MCP recommendations endpoint
        const response = await fetch(
          `${req.nextUrl.origin}/api/recommendations/mcp`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: lastMessage,
              technologies: intent.technologies,
              difficulty: intent.difficultyLevel,
              use_user_profile: true,
            }),
          }
        )

        if (response.ok) {
          const recommendations = await response.json()
          return NextResponse.json({
            type: "structured",
            data: recommendations.data,
            metadata: recommendations.metadata,
          })
        }
      } catch (error) {
        console.error(
          "Structured generation failed, falling back to streaming:",
          error
        )
      }
    }

    // Build enhanced system prompt with MCP and Qloo context
    const systemPrompt = createEnhancedSystemPrompt(
      user,
      mcpContext,
      qlooContext
    )

    // Create the AI stream with enhanced context
    const result = await streamText({
      model: getModel(),
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.7,
      maxTokens: 1500,
      onFinish: async (completion) => {
        // Validate GitHub URLs in the final response
        try {
          const { invalidUrls, validationResults } = await extractAndValidateGitHubUrls(completion.text)
          
          if (invalidUrls.length > 0) {
            console.warn("⚠️ Invalid GitHub URLs detected in response:", {
              invalidUrls,
              validationDetails: validationResults.filter(r => !r.exists)
            })
          } else {
            console.log("✅ All GitHub URLs validated successfully")
          }
        } catch (error) {
          console.error("GitHub URL validation failed:", error)
        }
      }
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Enhanced Chat API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Helper function to extract technical terms from query
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
    "nextjs",
    "express",
    "tensorflow",
    "pytorch",
    "mongodb",
    "postgresql",
  ]

  const queryLower = query.toLowerCase()
  return techKeywords.filter(keyword => queryLower.includes(keyword))
}
