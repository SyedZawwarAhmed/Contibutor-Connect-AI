// src/app/api/recommendations/mcp/route.ts (Enhanced Version)
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { anthropic } from "@ai-sdk/anthropic"
import { generateObject, generateText } from "ai"
import { z } from "zod"
import { withRemoteMCPClient } from "@/lib/mcp-client-remote"

// Simplified schema that Claude can follow more easily
const MCPProjectRecommendationSchema = z.object({
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      githubUrl: z.string(),
      languages: z.array(z.string()),
      topics: z.array(z.string()),
      stars: z.number().optional(),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]),
      explanation: z.string(),
      contributionTypes: z.array(z.string()),
      contributionScore: z.number().min(0).max(100).optional(),
      recommendationReason: z.string().optional(),
    })
  ),
  reasoning: z.string(),
  user_analysis: z.object({
    experience_level: z.string(),
    primary_languages: z.array(z.string()),
    suggested_focus_areas: z.array(z.string()),
  }),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      query,
      technologies = [],
      difficulty = "any",
      contributionTypes = [],
      use_user_profile = true,
    } = await req.json()

    // Get user's GitHub profile data
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

    if (!user?.githubUsername) {
      return NextResponse.json(
        { error: "GitHub username not found in profile" },
        { status: 400 }
      )
    }

    // Use MCP to get real GitHub data (will fallback to GitHub API if MCP fails)
    const mcpResults = await withRemoteMCPClient(async client => {
      try {
        // Get user analysis
        const userAnalysis = use_user_profile
          ? await client.analyzeUserGitHubProfile(user.githubUsername!)
          : null

        // Search for repositories
        const searchParams = {
          query: technologies[0] || "open source",
          language: technologies[0],
          difficulty: difficulty as "beginner" | "intermediate" | "advanced",
          topics: technologies.slice(1),
          has_good_first_issues: difficulty === "beginner",
          active_recently: true,
        }

        const searchResults = await client.searchRepositories(searchParams)

        // Get beginner-friendly repos if needed
        let beginnerRepos = null
        if (
          userAnalysis?.experience_indicators?.experience_level ===
            "beginner" ||
          difficulty === "beginner"
        ) {
          try {
            beginnerRepos = await client.findBeginnerFriendlyRepos({
              language: technologies[0],
              user_experience_level: "some_experience",
            })
          } catch (error) {
            console.warn("Beginner repos search failed:", error)
          }
        }

        return {
          userAnalysis,
          searchResults,
          beginnerRepos,
          error: null,
        }
      } catch (error) {
        console.error("MCP operations failed:", error)
        return {
          userAnalysis: null,
          searchResults: { total_found: 0, repositories: [] },
          beginnerRepos: null,
          error:
            error instanceof Error ? error.message : "MCP service unavailable",
        }
      }
    })

    // Prepare data for Claude with better formatting
    const repoData = mcpResults.searchResults?.repositories?.slice(0, 8) || []
    const beginnerData =
      mcpResults.beginnerRepos?.repositories?.slice(0, 3) || []

    // Enhanced prompt with clearer instructions
    const claudePrompt = `You are ContributorConnect AI. Analyze the provided GitHub data and recommend the BEST projects for this user.

USER PROFILE:
- GitHub: @${user.githubUsername}
- Bio: ${user.bio || "Not provided"}
- Company: ${user.company || "Not provided"}
- Public Repos: ${user.publicRepos || 0}
- Query: "${query}"
- Technologies: ${technologies.join(", ") || "Any"}
- Difficulty: ${difficulty}

${
  mcpResults.userAnalysis
    ? `
USER ANALYSIS (from GitHub):
- Experience: ${
        mcpResults.userAnalysis.experience_indicators?.experience_level ||
        "Unknown"
      }
- Languages: ${Object.keys(
        mcpResults.userAnalysis.technical_profile?.primary_languages || {}
      )
        .slice(0, 3)
        .join(", ")}
- Contribution Types: ${
        mcpResults.userAnalysis.recommendations?.suggested_contribution_types?.join(
          ", "
        ) || "General"
      }
`
    : ""
}

AVAILABLE REPOSITORIES (${repoData.length} found):
${
  repoData
    .map(
      (repo, i) => `
${i + 1}. ${repo.name}
   Description: ${repo.description || "No description"}
   Language: ${repo.language || "Mixed"}
   Stars: ${repo.stars || 0}
   Topics: ${repo.topics?.slice(0, 4).join(", ") || "None"}
   URL: ${repo.url}
`
    )
    .join("") || "No repositories found in search results"
}

${
  beginnerData.length > 0
    ? `
BEGINNER-FRIENDLY OPTIONS:
${beginnerData
  .map(
    (repo: any, i: number) => `
${i + 1}. ${repo.name} (${repo.stars || 0} stars)
   ${repo.description || "No description"}
   URL: ${repo.url}
`
  )
  .join("")}
`
    : ""
}

TASK: Select 3-5 BEST projects from the above data. You must:
1. Only recommend projects listed above
2. Match user's experience and interests
3. Provide contribution scores (0-100)
4. Explain why each project fits

If no suitable projects found in the data, recommend exploring broader search terms.

Respond with a valid JSON object matching this structure:
{
  "projects": [
    {
      "name": "exact-repo-name-from-above",
      "description": "description",
      "githubUrl": "url-from-above",
      "languages": ["language1"],
      "topics": ["topic1", "topic2"],
      "stars": number,
      "difficulty": "beginner|intermediate|advanced",
      "explanation": "why this project suits the user",
      "contributionTypes": ["code", "documentation"],
      "contributionScore": 85,
      "recommendationReason": "specific reasoning"
    }
  ],
  "reasoning": "overall analysis and selection rationale",
  "user_analysis": {
    "experience_level": "${
      mcpResults.userAnalysis?.experience_indicators?.experience_level ||
      "intermediate"
    }",
    "primary_languages": ${JSON.stringify(
      Object.keys(
        mcpResults.userAnalysis?.technical_profile?.primary_languages || {}
      ).slice(0, 3)
    )},
    "suggested_focus_areas": ["area1", "area2"]
  }
}`

    try {
      // Try structured generation first
      const result = await generateObject({
        model: anthropic("claude-4-sonnet-20250514"),
        prompt: claudePrompt,
        schema: MCPProjectRecommendationSchema,
        temperature: 0.3, // Lower temperature for more consistent structure
      })

      return NextResponse.json({
        success: true,
        data: result.object,
        metadata: {
          query,
          technologies,
          difficulty,
          user_analysis_used: !!mcpResults.userAnalysis,
          mcp_search_total: mcpResults.searchResults?.total_found || 0,
          beginner_repos_found:
            mcpResults.beginnerRepos?.repositories?.length || 0,
          mcp_error: mcpResults.error,
          timestamp: new Date().toISOString(),
        },
      })
    } catch (structuredError) {
      console.error("Structured generation failed:", structuredError)

      // Fallback to text generation and manual parsing
      try {
        const textResult = await generateText({
          model: anthropic("claude-4-sonnet-20250514"),
          prompt:
            claudePrompt +
            "\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no explanation text.",
          temperature: 0.3,
          maxTokens: 2000,
        })

        // Try to parse the text response as JSON
        const cleanedText = textResult.text
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim()

        const parsedResult = JSON.parse(cleanedText)

        // Validate the parsed result
        const validatedResult =
          MCPProjectRecommendationSchema.parse(parsedResult)

        return NextResponse.json({
          success: true,
          data: validatedResult,
          metadata: {
            query,
            technologies,
            difficulty,
            user_analysis_used: !!mcpResults.userAnalysis,
            mcp_search_total: mcpResults.searchResults?.total_found || 0,
            beginner_repos_found:
              mcpResults.beginnerRepos?.repositories?.length || 0,
            mcp_error: mcpResults.error,
            fallback_used: "text_generation",
            timestamp: new Date().toISOString(),
          },
        })
      } catch (fallbackError) {
        console.error("Fallback generation also failed:", fallbackError)

        // Return a basic structure with available data
        const fallbackProjects = repoData.slice(0, 3).map((repo, index) => ({
          name: repo.name,
          description: repo.description || "No description available",
          githubUrl: repo.url,
          languages: [repo.language || "Mixed"],
          topics: repo.topics?.slice(0, 3) || [],
          stars: repo.stars || 0,
          difficulty: difficulty === "any" ? "intermediate" : difficulty,
          explanation: `This project matches your query and uses ${
            repo.language || "relevant"
          } technology.`,
          contributionTypes: ["code", "documentation"],
          contributionScore: 70 + index * 5,
          recommendationReason:
            "Selected based on your search criteria and available repository data.",
        })) as any[]

        return NextResponse.json({
          success: true,
          data: {
            projects: fallbackProjects,
            reasoning: mcpResults.error
              ? `Due to service limitations (${mcpResults.error}), recommendations are based on available repository data. These projects match your search criteria and technology preferences.`
              : "Recommendations based on repository search results matching your criteria.",
            user_analysis: {
              experience_level:
                mcpResults.userAnalysis?.experience_indicators
                  ?.experience_level || "intermediate",
              primary_languages: Object.keys(
                mcpResults.userAnalysis?.technical_profile?.primary_languages ||
                  {}
              ).slice(0, 3),
              suggested_focus_areas:
                technologies.length > 0
                  ? technologies
                  : ["general-development"],
            },
          },
          metadata: {
            query,
            technologies,
            difficulty,
            user_analysis_used: !!mcpResults.userAnalysis,
            mcp_search_total: mcpResults.searchResults?.total_found || 0,
            beginner_repos_found:
              mcpResults.beginnerRepos?.repositories?.length || 0,
            mcp_error: mcpResults.error,
            fallback_used: "basic_structure",
            timestamp: new Date().toISOString(),
          },
        })
      }
    }
  } catch (error) {
    console.error("MCP Recommendations API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate MCP-enhanced recommendations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// GET endpoint for quick MCP-powered recommendations
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const language = url.searchParams.get("language")
    const difficulty =
      (url.searchParams.get("difficulty") as
        | "beginner"
        | "intermediate"
        | "advanced") || "any"

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { githubUsername: true },
    })

    if (!user?.githubUsername) {
      return NextResponse.json(
        { error: "GitHub username not found" },
        { status: 400 }
      )
    }

    // Get user-specific recommendations using Remote MCP
    const recommendations = await withRemoteMCPClient(async client => {
      try {
        const userAnalysis = await client.analyzeUserGitHubProfile(
          user.githubUsername!
        )

        // Use user's primary language if no language specified
        const searchLanguage =
          language ||
          Object.keys(
            userAnalysis.technical_profile?.primary_languages || {}
          )[0] ||
          "javascript"

        const searchResults = await client.searchRepositories({
          query: `${searchLanguage} contributions`,
          language: searchLanguage,
          difficulty: (difficulty as string) === "any" ? undefined : difficulty,
          has_good_first_issues: difficulty === "beginner",
          active_recently: true,
        })

        return {
          userAnalysis,
          repositories: searchResults.repositories?.slice(0, 5) || [],
          error: null,
        }
      } catch (mcpError) {
        console.error("MCP GET operation failed:", mcpError)
        return {
          userAnalysis: null,
          repositories: [],
          error:
            mcpError instanceof Error
              ? mcpError.message
              : "MCP service unavailable",
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: recommendations,
      metadata: {
        type: "profile-based-mcp",
        language,
        difficulty,
        user_experience:
          recommendations.userAnalysis?.experience_indicators
            ?.experience_level || "unknown",
        error: recommendations.error || null,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("GET MCP Recommendations error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get MCP recommendations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
// // src/app/api/recommendations/mcp/route.ts
// import { NextRequest, NextResponse } from "next/server"
// import { auth } from "@/lib/auth"
// import { prisma } from "@/lib/prisma"
// import { anthropic } from "@ai-sdk/anthropic"
// import { generateObject } from "ai"
// import { z } from "zod"
// // import { withMCPClient } from "@/lib/mcp-client"
// import { withRemoteMCPClient } from "@/lib/mcp-client-remote"

// // Enhanced schema for MCP-powered recommendations
// const MCPProjectRecommendationSchema = z.object({
//   projects: z.array(
//     z.object({
//       name: z.string(),
//       description: z.string(),
//       githubUrl: z.string(),
//       languages: z.array(z.string()),
//       topics: z.array(z.string()),
//       stars: z.number(),
//       difficulty: z.enum(["beginner", "intermediate", "advanced"]),
//       explanation: z.string(),
//       contributionTypes: z.array(z.string()),
//       contributionScore: z.number().min(0).max(100),
//       recommendationReason: z.string(),
//     })
//   ),
//   reasoning: z.string(),
//   user_analysis: z.object({
//     experience_level: z.string(),
//     primary_languages: z.array(z.string()),
//     suggested_focus_areas: z.array(z.string()),
//   }),
// })

// export async function POST(req: NextRequest) {
//   try {
//     const session = await auth()
//     if (!session?.user?.id) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     const {
//       query,
//       technologies = [],
//       difficulty = "any",
//       contributionTypes = [],
//       use_user_profile = true,
//     } = await req.json()

//     // Get user's GitHub profile data
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

//     if (!user?.githubUsername) {
//       return NextResponse.json(
//         {
//           error: "GitHub username not found in profile",
//         },
//         { status: 400 }
//       )
//     }

//     // Use MCP to get real GitHub data and analysis
//     const mcpResults = await withMCPClient(async client => {
//       // Analyze user's GitHub profile using MCP
//       const userAnalysis = use_user_profile
//         ? await client.analyzeUserGitHubProfile(user.githubUsername!)
//         : null

//       // Search for repositories using MCP with advanced filtering
//       const searchParams = {
//         query,
//         language: technologies[0],
//         difficulty: difficulty as "beginner" | "intermediate" | "advanced",
//         topics: technologies.slice(1), // Use additional technologies as topics
//         has_good_first_issues: difficulty === "beginner",
//         active_recently: true,
//       }

//       const searchResults = await client.searchRepositories(searchParams)

//       // Get beginner-friendly repos if user is a beginner
//       let beginnerRepos = null
//       if (
//         userAnalysis?.experience_indicators?.experience_level === "beginner" ||
//         difficulty === "beginner"
//       ) {
//         beginnerRepos = await client.findBeginnerFriendlyRepos({
//           language: technologies[0],
//           user_experience_level: "some_experience",
//         })
//       }

//       return {
//         userAnalysis,
//         searchResults,
//         beginnerRepos,
//       }
//     })

//     // Generate Claude recommendations using MCP data
//     const claudePrompt = `You are ContributorConnect AI, an expert at matching developers with perfect open-source projects.

// User Query: "${query}"

// User Profile:
// - GitHub: @${user.githubUsername}
// - Bio: ${user.bio || "Not provided"}
// - Company: ${user.company || "Not provided"}
// - Location: ${user.location || "Not provided"}
// - Public Repos: ${user.publicRepos || 0}
// - Followers: ${user.followers || 0}

// ${
//   mcpResults.userAnalysis
//     ? `
// DETAILED USER ANALYSIS (from MCP GitHub Analysis):
// - Experience Level: ${
//         mcpResults.userAnalysis.experience_indicators.experience_level
//       }
// - Contribution Frequency: ${
//         mcpResults.userAnalysis.experience_indicators.contribution_frequency
//       }
// - Primary Languages: ${Object.keys(
//         mcpResults.userAnalysis.technical_profile.primary_languages
//       ).join(", ")}
// - Frameworks/Tools: ${mcpResults.userAnalysis.technical_profile.frameworks_and_tools.join(
//         ", "
//       )}
// - Project Domains: ${mcpResults.userAnalysis.technical_profile.project_domains.join(
//         ", "
//       )}
// - Suggested Contribution Types: ${mcpResults.userAnalysis.recommendations.suggested_contribution_types.join(
//         ", "
//       )}
// - Ideal Project Size: ${
//         mcpResults.userAnalysis.recommendations.ideal_project_characteristics
//           .preferred_project_size
//       }
// `
//     : ""
// }

// REAL REPOSITORIES FOUND (via MCP GitHub Search):
// Total Found: ${mcpResults.searchResults.total_found}

// ${mcpResults.searchResults.repositories
//   .map(
//     (repo, index) => `
// ${index + 1}. ${repo.name}
//    Description: ${repo.description || "No description"}
//    Language: ${repo.language || "Mixed"}
//    Topics: ${repo.topics.join(", ")}
//    Stars: ${repo.stars}
//    Open Issues: ${repo.openIssues}
//    Last Updated: ${repo.lastUpdated}
//    Contribution Metrics:
//    - Good First Issues: ${
//      repo.contributionMetrics?.hasGoodFirstIssues ? "Yes" : "No"
//    }
//    - Help Wanted Issues: ${
//      repo.contributionMetrics?.hasHelpWantedIssues ? "Yes" : "No"
//    }
//    - Contributing Guide: ${
//      repo.contributionMetrics?.hasContributingGuide ? "Yes" : "No"
//    }
//    - Recent Activity: ${repo.contributionMetrics?.recentActivity ? "Yes" : "No"}
//    URL: ${repo.url}
// `
//   )
//   .join("\n")}

// ${
//   mcpResults.beginnerRepos
//     ? `
// BEGINNER-FRIENDLY REPOSITORIES:
// ${mcpResults.beginnerRepos.repositories
//   .map(
//     (repo: any, index: number) => `
// ${index + 1}. ${repo.name}
//    Description: ${repo.description || "No description"}
//    Language: ${repo.language}
//    Stars: ${repo.stars}
//    Beginner Score: ${repo.beginnerFriendlyScore}
//    URL: ${repo.url}
// `
//   )
//   .join("\n")}
// `
//     : ""
// }

// TASK: Select the BEST 3-5 repositories from the above REAL data that perfectly match:
// 1. The user's query and interests
// 2. Their experience level and technical background
// 3. Their preferred contribution types
// 4. Projects with good contribution opportunities

// For each selected project:
// - Use EXACT repository names and URLs from the provided data
// - Calculate a contribution score (0-100) based on:
//   * Match with user's skills (30 points)
//   * Beginner-friendliness if applicable (25 points)
//   * Activity level and community health (25 points)
//   * Learning opportunity potential (20 points)
// - Provide specific, actionable recommendation reasons
// - Suggest realistic contribution types based on the repository's actual metrics

// Only recommend repositories from the provided MCP data above.`

//     const result = await generateObject({
//       model: anthropic("claude-4-sonnet-20250514"),
//       prompt: claudePrompt,
//       schema: MCPProjectRecommendationSchema,
//       temperature: 0.7,
//     })

//     return NextResponse.json({
//       success: true,
//       data: result.object,
//       metadata: {
//         query,
//         technologies,
//         difficulty,
//         user_analysis_used: !!mcpResults.userAnalysis,
//         mcp_search_total: mcpResults.searchResults.total_found,
//         beginner_repos_found:
//           mcpResults.beginnerRepos?.repositories?.length || 0,
//         timestamp: new Date().toISOString(),
//       },
//     })
//   } catch (error) {
//     console.error("MCP Recommendations API error:", error)
//     return NextResponse.json(
//       {
//         success: false,
//         error: "Failed to generate MCP-enhanced recommendations",
//         details: error instanceof Error ? error.message : "Unknown error",
//       },
//       { status: 500 }
//     )
//   }
// }

// // GET endpoint for quick MCP-powered recommendations
// export async function GET(req: NextRequest) {
//   try {
//     const session = await auth()
//     if (!session?.user?.id) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     const url = new URL(req.url)
//     const language = url.searchParams.get("language")
//     const difficulty =
//       (url.searchParams.get("difficulty") as
//         | "beginner"
//         | "intermediate"
//         | "advanced") || "any"

//     const user = await prisma.user.findUnique({
//       where: { id: session.user.id },
//       select: { githubUsername: true },
//     })

//     if (!user?.githubUsername) {
//       return NextResponse.json(
//         {
//           error: "GitHub username not found",
//         },
//         { status: 400 }
//       )
//     }

//     // Get user-specific recommendations using MCP
//     const recommendations = await withMCPClient(async client => {
//       const userAnalysis = await client.analyzeUserGitHubProfile(
//         user.githubUsername!
//       )

//       // Use user's primary language if no language specified
//       const searchLanguage =
//         language ||
//         Object.keys(userAnalysis.technical_profile.primary_languages)[0] ||
//         "javascript"

//       const searchResults = await client.searchRepositories({
//         query: `${searchLanguage} contributions`,
//         language: searchLanguage,
//         difficulty:
//           difficulty === "any"
//             ? (userAnalysis.experience_indicators.experience_level as any)
//             : difficulty,
//         has_good_first_issues:
//           userAnalysis.experience_indicators.experience_level === "beginner",
//         active_recently: true,
//       })

//       return {
//         userAnalysis,
//         repositories: searchResults.repositories.slice(0, 5),
//       }
//     })

//     return NextResponse.json({
//       success: true,
//       data: recommendations,
//       metadata: {
//         type: "profile-based-mcp",
//         language,
//         difficulty,
//         user_experience:
//           recommendations.userAnalysis.experience_indicators.experience_level,
//         timestamp: new Date().toISOString(),
//       },
//     })
//   } catch (error) {
//     console.error("GET MCP Recommendations error:", error)
//     return NextResponse.json(
//       {
//         success: false,
//         error: "Failed to get MCP recommendations",
//         details: error instanceof Error ? error.message : "Unknown error",
//       },
//       { status: 500 }
//     )
//   }
// }
