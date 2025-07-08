// src/app/api/test-mcp/route.ts (Updated with better testing)
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { withRemoteMCPClient, testMCPConnection } from "@/lib/mcp-client-remote"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const testType = url.searchParams.get("test") || "connection"
    const username = url.searchParams.get("username") || "octocat"
    const language = url.searchParams.get("language") || "typescript"

    console.log(`🧪 Testing MCP integration: ${testType}`)

    if (testType === "connection") {
      const connectionTest = await testMCPConnection()
      return NextResponse.json({
        success: connectionTest.success,
        test_type: "connection",
        service: connectionTest.service,
        data: connectionTest.details,
        timestamp: new Date().toISOString(),
      })
    }

    const results = await withRemoteMCPClient(async client => {
      switch (testType) {
        case "search":
          return await client.searchRepositories({
            query: `${language} open source`,
            language,
            has_good_first_issues: true,
            active_recently: true,
          })

        case "profile":
          return await client.analyzeUserGitHubProfile(username)

        case "trending":
          return await client.getTrendingRepositories({
            language,
            since: "weekly",
            limit: 5,
          })

        case "beginner":
          return await client.findBeginnerFriendlyRepos({
            language,
            user_experience_level: "some_experience",
          })

        case "details":
          const owner = url.searchParams.get("owner") || "facebook"
          const repo = url.searchParams.get("repo") || "react"
          return await client.getRepositoryDetails(owner, repo)

        default:
          throw new Error(`Unknown test type: ${testType}`)
      }
    })

    return NextResponse.json({
      success: true,
      test_type: testType,
      data: results,
      metadata: {
        timestamp: new Date().toISOString(),
        parameters: { username, language },
        data_source: "GitHub API",
      },
    })
  } catch (error) {
    console.error("MCP test failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        test_type: req.nextUrl.searchParams.get("test") || "search",
        metadata: {
          timestamp: new Date().toISOString(),
          github_token_available: !!process.env.GITHUB_TOKEN,
          data_source: "GitHub API",
        },
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      query,
      language = "typescript",
      difficulty = "any",
      username,
    } = await req.json()

    console.log("🧪 Testing MCP search with custom query:", query)

    const results = await withRemoteMCPClient(async client => {
      const searchResult = await client.searchRepositories({
        query,
        language,
        difficulty: difficulty === "any" ? undefined : difficulty,
        has_good_first_issues: difficulty === "beginner",
        active_recently: true,
      })

      // Also test profile analysis if username provided
      let profileAnalysis = null
      if (username) {
        try {
          profileAnalysis = await client.analyzeUserGitHubProfile(username)
        } catch (error) {
          console.warn("Profile analysis failed:", error)
        }
      }

      return {
        search: searchResult,
        profile: profileAnalysis,
      }
    })

    return NextResponse.json({
      success: true,
      query,
      data: results,
      metadata: {
        timestamp: new Date().toISOString(),
        search_total_found: results.search.total_found,
        repositories_returned: results.search.repositories?.length || 0,
        profile_analyzed: !!results.profile,
        data_source: "GitHub API",
      },
    })
  } catch (error) {
    console.error("MCP POST test failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          timestamp: new Date().toISOString(),
          github_token_available: !!process.env.GITHUB_TOKEN,
          data_source: "GitHub API",
        },
      },
      { status: 500 }
    )
  }
}
