// src/app/api/chat/route.ts (Enhanced Version)
import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { streamText } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { prisma } from "@/lib/prisma"
import { llmService } from "@/lib/llm"
import { withRemoteMCPClient } from "@/lib/mcp-client-remote"
// Configure Claude model
const getModel = () => {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured")
  }
  return anthropic("claude-4-sonnet-20250514")
}

// Enhanced system context with MCP capabilities
const createEnhancedSystemPrompt = (userProfile: any, mcpContext?: string) => `
You are ContributorConnect AI, an intelligent assistant powered by real-time GitHub data that helps developers discover open-source projects perfect for their skills and interests.

${mcpContext ? `REAL-TIME GITHUB CONTEXT:\n${mcpContext}\n` : ""}

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
2. **Smart Project Discovery**: I find active projects that match your skills and contribution preferences
3. **Community Analysis**: I evaluate project health, beginner-friendliness, and maintainer activity
4. **Contribution Guidance**: I provide specific advice on how to get started with contributions

When users ask about finding projects or contributions, I'll:
- Search live GitHub data for relevant repositories
- Analyze project health and contribution opportunities
- Consider user experience level and preferences
- Provide specific repository recommendations with actionable next steps

I'm encouraging, helpful, and focus on building confidence in open-source contribution. I use conversational tone while being informative and specific.
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
    if (intent.intent === "project_search" && user?.githubUsername) {
      try {
        const mcpData = await withRemoteMCPClient(async client => {
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
          mcpData.searchResults.repositories.slice(0, 5).forEach((repo, i) => {
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
            .forEach((repo, i) => {
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

    // Build enhanced system prompt with MCP context
    const systemPrompt = createEnhancedSystemPrompt(user, mcpContext)

    // Create the AI stream with enhanced context
    const result = await streamText({
      model: getModel(),
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.7,
      maxTokens: 1500,
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

// export async function POST(req: NextRequest) {
//   try {
//     // Check authentication
//     const session = await auth()
//     if (!session?.user?.id) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     const { messages, structured = false } = await req.json()
//     const lastMessage = messages[messages.length - 1]?.content || ""

//     // Get user's GitHub profile data for context
//     const user = await prisma.user.findUnique({
//       where: { id: session.user.id },
//       select: {
//         githubUsername: true,
//         bio: true,
//         location: true,
//         company: true,
//         publicRepos: true,
//         followers: true,
//         following: true,
//         githubCreatedAt: true,
//       },
//     })

//     // Analyze user intent to determine response type
//     const intent = await llmService.analyzeUserIntent(lastMessage)

//     // If user is asking for project recommendations, use structured generation
//     if (intent.intent === "project_search" && structured) {
//       try {
//         const recommendations = await llmService.generateProjectRecommendations(
//           lastMessage,
//           user
//         )

//         return NextResponse.json({
//           type: "structured",
//           data: recommendations,
//         })
//       } catch (error) {
//         console.error(
//           "Structured generation failed, falling back to streaming:",
//           error
//         )
//         // Fall back to normal streaming
//       }
//     }

//     // Build system prompt with user context
//     const systemPrompt = `You are ContributorConnect AI, an intelligent assistant that helps developers discover open-source projects perfect for their skills and interests.

// User Profile Context:
// ${user?.githubUsername ? `- GitHub: @${user.githubUsername}` : ""}
// ${user?.bio ? `- Bio: ${user.bio}` : ""}
// ${user?.company ? `- Company: ${user.company}` : ""}
// ${user?.location ? `- Location: ${user.location}` : ""}
// ${user?.publicRepos ? `- Public Repositories: ${user.publicRepos}` : ""}
// ${user?.followers ? `- Followers: ${user.followers}` : ""}
// ${user?.githubCreatedAt ? `- GitHub Member Since: ${user.githubCreatedAt}` : ""}

// Detected Intent: ${intent.intent}
// Technologies of Interest: ${intent.technologies.join(", ") || "None specified"}
// Preferred Difficulty: ${intent.difficultyLevel}

// Your main responsibilities:
// 1. **Project Discovery**: Help users find open-source projects that match their skills, interests, and contribution preferences
// 2. **Skill Assessment**: Analyze user requests to understand their technical background and learning goals
// 3. **Community Matching**: Recommend projects with welcoming communities that actively support new contributors
// 4. **Contribution Guidance**: Provide specific advice on how to get started with contributions

// When recommending projects, always provide:
// - Specific project names in owner/repo format (e.g., facebook/react)
// - Clear descriptions of what each project does
// - Programming languages and technologies used
// - Why each project is a good match for the user
// - Suggested ways to start contributing
// - Difficulty level for new contributors

// Be encouraging, helpful, and focus on building confidence in open-source contribution. Use a conversational tone while being informative.`

//     // Create the AI stream
//     const result = await streamText({
//       model: getModel(),
//       messages: [{ role: "system", content: systemPrompt }, ...messages],
//       temperature: 0.7,
//       maxTokens: 1000,
//     })

//     // Return the streaming response
//     // return result.toAIStreamResponse()
//     return result.toDataStreamResponse()
//   } catch (error) {
//     console.error("Chat API error:", error)
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     )
//   }
// }
