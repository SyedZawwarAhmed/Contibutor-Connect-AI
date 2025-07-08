// src/mcp/github-mcp-server.ts (FIXED VERSION)
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js"

// Embedded GitHub service to avoid import issues
class EmbeddedGitHubService {
  private readonly baseURL = "https://api.github.com"
  private readonly token: string | undefined

  constructor() {
    this.token = process.env.GITHUB_TOKEN || process.env.GITHUB_API_TOKEN
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "ContributorConnect-MCP/1.0",
    }

    if (this.token) {
      headers["Authorization"] = `token ${this.token}`
    }

    return headers
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`
      )
    }

    return response.json()
  }

  async searchRepositories(params: {
    query: string
    language?: string
    sort?: string
    per_page?: number
  }) {
    const { query, language, sort = "stars", per_page = 30 } = params
    let searchQuery = query

    if (language) {
      searchQuery += ` language:${language}`
    }
    searchQuery += " is:public archived:false"

    const queryParams = new URLSearchParams({
      q: searchQuery,
      sort,
      order: "desc",
      per_page: per_page.toString(),
    })

    return this.makeRequest<{
      total_count: number
      items: any[]
    }>(`/search/repositories?${queryParams}`)
  }

  async getRepository(owner: string, repo: string) {
    return this.makeRequest(`/repos/${owner}/${repo}`)
  }

  async getRepositoryLanguages(owner: string, repo: string) {
    return this.makeRequest(`/repos/${owner}/${repo}/languages`)
  }

  async getRepositoryTopics(owner: string, repo: string) {
    const headers = {
      ...this.getHeaders(),
      Accept: "application/vnd.github.mercy-preview+json",
    }

    const response = await fetch(
      `${this.baseURL}/repos/${owner}/${repo}/topics`,
      {
        headers,
      }
    )

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    return response.json()
  }

  async analyzeContributionMetrics(owner: string, repo: string) {
    try {
      const [issues, contents] = await Promise.allSettled([
        this.makeRequest(
          `/repos/${owner}/${repo}/issues?labels=good%20first%20issue,help%20wanted&state=open&per_page=10`
        ),
        this.makeRequest(`/repos/${owner}/${repo}/contents`),
      ])

      const issue_data = issues.status === "fulfilled" ? issues.value : []
      const content_data = contents.status === "fulfilled" ? contents.value : []

      const hasGoodFirstIssues =
        Array.isArray(issue_data) &&
        issue_data.some((issue: any) =>
          issue.labels?.some((label: any) =>
            label.name.toLowerCase().includes("good first issue")
          )
        )

      const hasHelpWantedIssues =
        Array.isArray(issue_data) &&
        issue_data.some((issue: any) =>
          issue.labels?.some((label: any) =>
            label.name.toLowerCase().includes("help wanted")
          )
        )

      const hasContributingGuide =
        Array.isArray(content_data) &&
        content_data.some((file: any) =>
          file.name?.toLowerCase().includes("contributing")
        )

      return {
        hasGoodFirstIssues,
        hasHelpWantedIssues,
        hasContributingGuide,
        hasCodeOfConduct: false,
        recentActivity: true,
        issueResponseTime: "unknown" as const,
        maintainerActivity: true,
      }
    } catch (error) {
      return {
        hasGoodFirstIssues: false,
        hasHelpWantedIssues: false,
        hasContributingGuide: false,
        hasCodeOfConduct: false,
        recentActivity: false,
        issueResponseTime: "unknown" as const,
        maintainerActivity: false,
      }
    }
  }

  async getUser(username: string) {
    return this.makeRequest(`/users/${username}`)
  }

  async getUserRepositories(username: string, per_page = 30) {
    return this.makeRequest(
      `/users/${username}/repos?sort=updated&per_page=${per_page}`
    )
  }

  async getUserLanguages(username: string): Promise<Record<string, number>> {
    try {
      const repos: any[] = await this.getUserRepositories(username, 100)
      const languageStats: Record<string, number> = {}

      for (const repo of repos) {
        if (repo.language) {
          languageStats[repo.language] = (languageStats[repo.language] || 0) + 1
        }
      }

      return languageStats
    } catch (error) {
      console.error("Error getting user languages:", error)
      return {}
    }
  }

  async searchBeginnerFriendlyRepos(params: {
    language?: string
    topic?: string
    per_page?: number
  }) {
    const { language, topic, per_page = 20 } = params

    let query = "good-first-issues:>5 help-wanted-issues:>3 stars:>100"

    if (language) {
      query += ` language:${language}`
    }

    if (topic) {
      query += ` topic:${topic}`
    }

    return this.searchRepositories({
      query,
      sort: "help-wanted-issues",
      per_page,
    })
  }

  async getTrendingRepositories(
    params: {
      language?: string
      since?: string
      per_page?: number
    } = {}
  ) {
    const { language, since = "weekly", per_page = 20 } = params

    const date = new Date()
    if (since === "daily") {
      date.setDate(date.getDate() - 1)
    } else if (since === "weekly") {
      date.setDate(date.getDate() - 7)
    } else {
      date.setMonth(date.getMonth() - 1)
    }

    let query = `created:>${date.toISOString().split("T")[0]} stars:>10`

    if (language) {
      query += ` language:${language}`
    }

    return this.searchRepositories({
      query,
      sort: "stars",
      per_page,
    })
  }
}

const githubService = new EmbeddedGitHubService()

// GitHub MCP Server - Provides GitHub repository context to LLMs
class GitHubMCPServer {
  private server: Server

  constructor() {
    this.server = new Server(
      {
        name: "github-contributor-connect",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    )

    this.setupToolHandlers()
    this.setupRequestHandlers()
  }

  private setupToolHandlers() {
    // Define available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "search_repositories",
            description:
              "Search GitHub repositories with advanced filters for contribution opportunities",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search query for repositories",
                },
                language: {
                  type: "string",
                  description:
                    "Programming language filter (e.g., 'typescript', 'python')",
                },
                difficulty: {
                  type: "string",
                  enum: ["beginner", "intermediate", "advanced"],
                  description: "Difficulty level for contributors",
                },
              },
              required: ["query"],
            },
          },
          {
            name: "analyze_user_github_profile",
            description:
              "Analyze a user's GitHub profile to understand their interests and experience",
            inputSchema: {
              type: "object",
              properties: {
                username: {
                  type: "string",
                  description: "GitHub username to analyze",
                },
              },
              required: ["username"],
            },
          },
        ] as Tool[],
      }
    })

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const { name, arguments: args } = request.params

      try {
        switch (name) {
          case "search_repositories":
            return await this.searchRepositories(args)
          case "analyze_user_github_profile":
            return await this.analyzeUserGitHubProfile(args)
          default:
            throw new Error(`Unknown tool: ${name}`)
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing ${name}: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
          isError: true,
        }
      }
    })
  }

  private async searchRepositories(args: any) {
    const { query, language, difficulty } = args

    let searchQuery = query

    // Add difficulty-based filters
    if (difficulty === "beginner") {
      searchQuery += " good-first-issues:>1 help-wanted-issues:>1"
    } else if (difficulty === "advanced") {
      searchQuery += " stars:>1000"
    }

    const results = await githubService.searchRepositories({
      query: searchQuery,
      language,
      sort: difficulty === "beginner" ? "help-wanted-issues" : "stars",
      per_page: 10,
    })

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              query: searchQuery,
              total_found: results.total_count,
              repositories: results.items.slice(0, 5).map((repo: any) => ({
                name: repo.full_name,
                description: repo.description,
                url: repo.html_url,
                language: repo.language,
                stars: repo.stargazers_count,
                topics: repo.topics || [],
              })),
            },
            null,
            2
          ),
        },
      ],
    }
  }

  private async analyzeUserGitHubProfile(args: any) {
    const { username } = args

    const [user, repos, languages] = await Promise.allSettled([
      githubService.getUser(username),
      githubService.getUserRepositories(username, 20),
      githubService.getUserLanguages(username),
    ])

    const userData = user.status === "fulfilled" ? user.value : null
    if (!userData) {
      throw new Error(`User ${username} not found`)
    }

    const userRepos = repos.status === "fulfilled" ? repos.value : []
    const userLanguages =
      languages.status === "fulfilled" ? languages.value : {}

    const analysis = {
      profile: {
        username: userData.login,
        name: userData.name,
        bio: userData.bio,
        publicRepos: userData.public_repos,
        followers: userData.followers,
      },
      technical_profile: {
        primary_languages: userLanguages,
        total_repositories: userRepos.length,
      },
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(analysis, null, 2),
        },
      ],
    }
  }

  private setupRequestHandlers() {
    // Error handling
    this.server.onerror = error => {
      console.error("[MCP GitHub Server Error]", error)
    }

    process.on("SIGINT", async () => {
      await this.server.close()
      process.exit(0)
    })
  }

  async run() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.error("GitHub MCP Server running on stdio")
  }
}

// Start the server (removed import.meta check that causes issues)
const server = new GitHubMCPServer()
server.run().catch(console.error)

export { GitHubMCPServer }

// // src/mcp/github-mcp-server.ts
// import { Server } from "@modelcontextprotocol/sdk/server/index.js"
// import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
// import {
//   CallToolRequestSchema,
//   ListToolsRequestSchema,
//   Tool,
// } from "@modelcontextprotocol/sdk/types.js"

// import { githubService } from "@/lib/github-service.ts"
// // import type { GitHubRepository, GitHubUser } from "@/lib/github-service.js"

// // GitHub MCP Server - Provides GitHub repository context to LLMs
// class GitHubMCPServer {
//   private server: Server

//   constructor() {
//     this.server = new Server(
//       {
//         name: "github-contributor-connect",
//         version: "1.0.0",
//       },
//       {
//         capabilities: {
//           tools: {},
//         },
//       }
//     )

//     this.setupToolHandlers()
//     this.setupRequestHandlers()
//   }

//   private setupToolHandlers() {
//     // Define available tools
//     this.server.setRequestHandler(ListToolsRequestSchema, async () => {
//       return {
//         tools: [
//           {
//             name: "search_repositories",
//             description:
//               "Search GitHub repositories with advanced filters for contribution opportunities",
//             inputSchema: {
//               type: "object",
//               properties: {
//                 query: {
//                   type: "string",
//                   description: "Search query for repositories",
//                 },
//                 language: {
//                   type: "string",
//                   description:
//                     "Programming language filter (e.g., 'typescript', 'python')",
//                 },
//                 difficulty: {
//                   type: "string",
//                   enum: ["beginner", "intermediate", "advanced"],
//                   description: "Difficulty level for contributors",
//                 },
//                 topics: {
//                   type: "array",
//                   items: { type: "string" },
//                   description: "Topics/tags to filter by",
//                 },
//                 min_stars: {
//                   type: "number",
//                   description: "Minimum number of stars",
//                 },
//                 max_stars: {
//                   type: "number",
//                   description: "Maximum number of stars",
//                 },
//                 has_good_first_issues: {
//                   type: "boolean",
//                   description: "Filter for repositories with good first issues",
//                 },
//                 active_recently: {
//                   type: "boolean",
//                   description: "Filter for recently active repositories",
//                 },
//               },
//               required: ["query"],
//             },
//           },
//           {
//             name: "get_repository_details",
//             description:
//               "Get detailed information about a specific repository including contribution metrics",
//             inputSchema: {
//               type: "object",
//               properties: {
//                 owner: {
//                   type: "string",
//                   description: "Repository owner username",
//                 },
//                 repo: {
//                   type: "string",
//                   description: "Repository name",
//                 },
//                 include_contribution_analysis: {
//                   type: "boolean",
//                   default: true,
//                   description: "Include beginner-friendliness analysis",
//                 },
//               },
//               required: ["owner", "repo"],
//             },
//           },
//           {
//             name: "find_beginner_friendly_repos",
//             description:
//               "Find repositories specifically curated for new contributors",
//             inputSchema: {
//               type: "object",
//               properties: {
//                 language: {
//                   type: "string",
//                   description: "Programming language preference",
//                 },
//                 topic: {
//                   type: "string",
//                   description: "Topic/domain of interest",
//                 },
//                 user_experience_level: {
//                   type: "string",
//                   enum: [
//                     "complete_beginner",
//                     "some_experience",
//                     "intermediate",
//                   ],
//                   description: "User's experience level in open source",
//                 },
//               },
//             },
//           },
//           {
//             name: "analyze_user_github_profile",
//             description:
//               "Analyze a user's GitHub profile to understand their interests and experience",
//             inputSchema: {
//               type: "object",
//               properties: {
//                 username: {
//                   type: "string",
//                   description: "GitHub username to analyze",
//                 },
//                 include_repositories: {
//                   type: "boolean",
//                   default: true,
//                   description: "Include analysis of user's repositories",
//                 },
//                 include_languages: {
//                   type: "boolean",
//                   default: true,
//                   description: "Include programming languages analysis",
//                 },
//               },
//               required: ["username"],
//             },
//           },
//           {
//             name: "get_trending_repositories",
//             description: "Get currently trending repositories",
//             inputSchema: {
//               type: "object",
//               properties: {
//                 language: {
//                   type: "string",
//                   description: "Filter by programming language",
//                 },
//                 since: {
//                   type: "string",
//                   enum: ["daily", "weekly", "monthly"],
//                   default: "weekly",
//                   description: "Trending timeframe",
//                 },
//                 limit: {
//                   type: "number",
//                   default: 10,
//                   description: "Number of repositories to return",
//                 },
//               },
//             },
//           },
//           {
//             name: "find_similar_repositories",
//             description: "Find repositories similar to a given repository",
//             inputSchema: {
//               type: "object",
//               properties: {
//                 owner: {
//                   type: "string",
//                   description: "Reference repository owner",
//                 },
//                 repo: {
//                   type: "string",
//                   description: "Reference repository name",
//                 },
//                 similarity_criteria: {
//                   type: "array",
//                   items: {
//                     type: "string",
//                     enum: ["language", "topics", "size", "activity"],
//                   },
//                   default: ["language", "topics"],
//                   description: "Criteria for similarity matching",
//                 },
//               },
//               required: ["owner", "repo"],
//             },
//           },
//         ] as Tool[],
//       }
//     })

//     // Handle tool calls
//     this.server.setRequestHandler(CallToolRequestSchema, async request => {
//       const { name, arguments: args } = request.params

//       try {
//         switch (name) {
//           case "search_repositories":
//             return await this.searchRepositories(args)

//           case "get_repository_details":
//             return await this.getRepositoryDetails(args)

//           case "find_beginner_friendly_repos":
//             return await this.findBeginnerFriendlyRepos(args)

//           case "analyze_user_github_profile":
//             return await this.analyzeUserGitHubProfile(args)

//           case "get_trending_repositories":
//             return await this.getTrendingRepositories(args)

//           case "find_similar_repositories":
//             return await this.findSimilarRepositories(args)

//           default:
//             throw new Error(`Unknown tool: ${name}`)
//         }
//       } catch (error) {
//         return {
//           content: [
//             {
//               type: "text",
//               text: `Error executing ${name}: ${
//                 error instanceof Error ? error.message : "Unknown error"
//               }`,
//             },
//           ],
//           isError: true,
//         }
//       }
//     })
//   }

//   private async searchRepositories(args: any) {
//     const {
//       query,
//       language,
//       difficulty,
//       topics = [],
//       min_stars,
//       max_stars,
//       has_good_first_issues,
//       active_recently,
//     } = args

//     let searchQuery = query

//     // Add difficulty-based filters
//     if (difficulty === "beginner") {
//       searchQuery += " good-first-issues:>1 help-wanted-issues:>1"
//     } else if (difficulty === "advanced") {
//       searchQuery += " stars:>1000"
//     }

//     // Add star filters
//     if (min_stars) {
//       searchQuery += ` stars:>${min_stars}`
//     }
//     if (max_stars) {
//       searchQuery += ` stars:<${max_stars}`
//     }

//     // Add good first issues filter
//     if (has_good_first_issues) {
//       searchQuery += " good-first-issues:>0"
//     }

//     // Add recent activity filter
//     if (active_recently) {
//       const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
//       searchQuery += ` pushed:>${thirtyDaysAgo.toISOString().split("T")[0]}`
//     }

//     // Add topics
//     topics.forEach((topic: string) => {
//       searchQuery += ` topic:${topic}`
//     })

//     const results = await githubService.searchRepositories({
//       query: searchQuery,
//       language,
//       sort: difficulty === "beginner" ? "help-wanted-issues" : "stars",
//       per_page: 20,
//     })

//     // Enrich with contribution metrics for top results
//     const enrichedRepos = await Promise.allSettled(
//       results.items.slice(0, 10).map(async repo => {
//         const [languages, metrics] = await Promise.allSettled([
//           githubService.getRepositoryLanguages(repo.owner.login, repo.name),
//           githubService.analyzeContributionMetrics(repo.owner.login, repo.name),
//         ])

//         return {
//           name: repo.full_name,
//           description: repo.description,
//           url: repo.html_url,
//           language: repo.language,
//           languages: languages.status === "fulfilled" ? languages.value : {},
//           topics: repo.topics,
//           stars: repo.stargazers_count,
//           forks: repo.forks_count,
//           openIssues: repo.open_issues_count,
//           lastUpdated: repo.updated_at,
//           license: repo.license?.name,
//           contributionMetrics:
//             metrics.status === "fulfilled" ? metrics.value : null,
//         }
//       })
//     )

//     const successfulRepos = enrichedRepos
//       .filter(result => result.status === "fulfilled")
//       .map(result => (result as PromiseFulfilledResult<any>).value)

//     return {
//       content: [
//         {
//           type: "text",
//           text: JSON.stringify(
//             {
//               query: searchQuery,
//               total_found: results.total_count,
//               repositories: successfulRepos,
//               search_metadata: {
//                 language,
//                 difficulty,
//                 topics,
//                 filters_applied: {
//                   min_stars,
//                   max_stars,
//                   has_good_first_issues,
//                   active_recently,
//                 },
//               },
//             },
//             null,
//             2
//           ),
//         },
//       ],
//     }
//   }

//   private async getRepositoryDetails(args: any) {
//     const { owner, repo, include_contribution_analysis = true } = args

//     const [repoData, languages, topics, metrics] = await Promise.allSettled([
//       githubService.getRepository(owner, repo),
//       githubService.getRepositoryLanguages(owner, repo),
//       githubService.getRepositoryTopics(owner, repo),
//       include_contribution_analysis
//         ? githubService.analyzeContributionMetrics(owner, repo)
//         : Promise.resolve(null),
//     ])

//     const repository = repoData.status === "fulfilled" ? repoData.value : null
//     if (!repository) {
//       throw new Error(`Repository ${owner}/${repo} not found`)
//     }

//     const result = {
//       name: repository.full_name,
//       description: repository.description,
//       url: repository.html_url,
//       homepage: repository.homepage,
//       language: repository.language,
//       languages: languages.status === "fulfilled" ? languages.value : {},
//       topics:
//         topics.status === "fulfilled" ? topics.value.names : repository.topics,
//       stars: repository.stargazers_count,
//       forks: repository.forks_count,
//       watchers: repository.watchers_count,
//       openIssues: repository.open_issues_count,
//       size: repository.size,
//       defaultBranch: repository.default_branch,
//       createdAt: repository.created_at,
//       lastUpdated: repository.updated_at,
//       lastPush: repository.pushed_at,
//       license: repository.license,
//       owner: {
//         login: repository.owner.login,
//         type: repository.owner.type,
//         avatar_url: repository.owner.avatar_url,
//         url: repository.owner.html_url,
//       },
//       features: {
//         hasIssues: repository.has_issues,
//         hasProjects: repository.has_projects,
//         hasWiki: repository.has_wiki,
//         hasPages: repository.has_pages,
//       },
//       contributionMetrics:
//         metrics.status === "fulfilled" ? metrics.value : null,
//     }

//     return {
//       content: [
//         {
//           type: "text",
//           text: JSON.stringify(result, null, 2),
//         },
//       ],
//     }
//   }

//   private async findBeginnerFriendlyRepos(args: any) {
//     const { language, topic, user_experience_level } = args

//     const results = await githubService.searchBeginnerFriendlyRepos({
//       language,
//       topic,
//       per_page: 15,
//     })

//     // Filter based on experience level
//     let filteredRepos = results.items
//     if (user_experience_level === "complete_beginner") {
//       filteredRepos = results.items.filter(
//         repo => repo.stargazers_count < 5000 && repo.open_issues_count > 5
//       )
//     } else if (user_experience_level === "intermediate") {
//       filteredRepos = results.items.filter(repo => repo.stargazers_count > 500)
//     }

//     const enrichedRepos = filteredRepos.slice(0, 10).map(repo => ({
//       name: repo.full_name,
//       description: repo.description,
//       url: repo.html_url,
//       language: repo.language,
//       topics: repo.topics,
//       stars: repo.stargazers_count,
//       forks: repo.forks_count,
//       openIssues: repo.open_issues_count,
//       lastUpdated: repo.updated_at,
//       beginnerFriendlyScore: this.calculateBeginnerScore(repo),
//       recommendedFor: user_experience_level || "all_levels",
//     }))

//     return {
//       content: [
//         {
//           type: "text",
//           text: JSON.stringify(
//             {
//               criteria: { language, topic, user_experience_level },
//               total_found: filteredRepos.length,
//               repositories: enrichedRepos,
//             },
//             null,
//             2
//           ),
//         },
//       ],
//     }
//   }

//   private async analyzeUserGitHubProfile(args: any) {
//     const {
//       username,
//       include_repositories = true,
//       include_languages = true,
//     } = args

//     const [user, repos, languages] = await Promise.allSettled([
//       githubService.getUser(username),
//       include_repositories
//         ? githubService.getUserRepositories(username, 50)
//         : Promise.resolve([]),
//       include_languages
//         ? githubService.getUserLanguages(username)
//         : Promise.resolve({}),
//     ])

//     const userData = user.status === "fulfilled" ? user.value : null
//     if (!userData) {
//       throw new Error(`User ${username} not found`)
//     }

//     const userRepos = repos.status === "fulfilled" ? repos.value : []
//     const userLanguages =
//       languages.status === "fulfilled" ? languages.value : {}

//     // Analyze user's experience and interests
//     const analysis = {
//       profile: {
//         username: userData.login,
//         name: userData.name,
//         bio: userData.bio,
//         company: userData.company,
//         location: userData.location,
//         blog: userData.blog,
//         publicRepos: userData.public_repos,
//         publicGists: userData.public_gists,
//         followers: userData.followers,
//         following: userData.following,
//         memberSince: userData.created_at,
//         lastActive: userData.updated_at,
//       },
//       experience_indicators: {
//         total_repositories: userData.public_repos,
//         experience_level: this.determineExperienceLevel(userData, userRepos),
//         contribution_frequency: this.analyzeContributionFrequency(userRepos),
//         project_types: this.analyzeProjectTypes(userRepos),
//       },
//       technical_profile: {
//         primary_languages: userLanguages,
//         frameworks_and_tools: this.extractFrameworksFromRepos(userRepos),
//         project_domains: this.extractDomainsFromRepos(userRepos),
//       },
//       recommendations: {
//         suggested_contribution_types: this.suggestContributionTypes(
//           userData,
//           userRepos
//         ),
//         ideal_project_characteristics:
//           this.determineIdealProjectCharacteristics(userData, userRepos),
//         learning_opportunities: this.identifyLearningOpportunities(
//           userLanguages,
//           userRepos
//         ),
//       },
//     }

//     return {
//       content: [
//         {
//           type: "text",
//           text: JSON.stringify(analysis, null, 2),
//         },
//       ],
//     }
//   }

//   private async getTrendingRepositories(args: any) {
//     const { language, since = "weekly", limit = 10 } = args

//     const results = await githubService.getTrendingRepositories({
//       language,
//       since,
//       per_page: limit,
//     })

//     const trendingRepos = results.items.map(repo => ({
//       name: repo.full_name,
//       description: repo.description,
//       url: repo.html_url,
//       language: repo.language,
//       topics: repo.topics,
//       stars: repo.stargazers_count,
//       forks: repo.forks_count,
//       openIssues: repo.open_issues_count,
//       createdAt: repo.created_at,
//       trendingScore: this.calculateTrendingScore(repo, since),
//     }))

//     return {
//       content: [
//         {
//           type: "text",
//           text: JSON.stringify(
//             {
//               timeframe: since,
//               language: language || "all",
//               total_found: results.total_count,
//               trending_repositories: trendingRepos,
//             },
//             null,
//             2
//           ),
//         },
//       ],
//     }
//   }

//   private async findSimilarRepositories(args: any) {
//     const { owner, repo, similarity_criteria = ["language", "topics"] } = args

//     // Get reference repository
//     const refRepo = await githubService.getRepository(owner, repo)
//     const refTopics = await githubService.getRepositoryTopics(owner, repo)

//     let searchQuery = ""

//     // Build search based on similarity criteria
//     if (similarity_criteria.includes("language") && refRepo.language) {
//       searchQuery += ` language:${refRepo.language}`
//     }

//     if (similarity_criteria.includes("topics") && refTopics.names.length > 0) {
//       // Use top 3 topics
//       refTopics.names.slice(0, 3).forEach(topic => {
//         searchQuery += ` topic:${topic}`
//       })
//     }

//     if (similarity_criteria.includes("size")) {
//       const sizeCategory = this.categorizeSizeRange(refRepo.stargazers_count)
//       searchQuery += ` ${sizeCategory}`
//     }

//     // Search for similar repositories
//     const results = await githubService.searchRepositories({
//       query: searchQuery.trim() || refRepo.language || "popular",
//       sort: "stars",
//       per_page: 15,
//     })

//     // Filter out the reference repository itself
//     const similarRepos = results.items
//       .filter(item => item.full_name !== refRepo.full_name)
//       .slice(0, 10)
//       .map(item => ({
//         name: item.full_name,
//         description: item.description,
//         url: item.html_url,
//         language: item.language,
//         topics: item.topics,
//         stars: item.stargazers_count,
//         forks: item.forks_count,
//         similarityScore: this.calculateSimilarityScore(
//           refRepo,
//           item,
//           similarity_criteria
//         ),
//       }))

//     return {
//       content: [
//         {
//           type: "text",
//           text: JSON.stringify(
//             {
//               reference_repository: refRepo.full_name,
//               similarity_criteria,
//               similar_repositories: similarRepos,
//             },
//             null,
//             2
//           ),
//         },
//       ],
//     }
//   }

//   private setupRequestHandlers() {
//     // Error handling
//     this.server.onerror = error => {
//       console.error("[MCP GitHub Server Error]", error)
//     }

//     process.on("SIGINT", async () => {
//       await this.server.close()
//       process.exit(0)
//     })
//   }

//   // Helper methods for analysis
//   private calculateBeginnerScore(repo: any): number {
//     let score = 0
//     if (repo.open_issues_count > 10) score += 20
//     if (repo.stargazers_count > 100 && repo.stargazers_count < 5000) score += 30
//     if (repo.topics?.includes("good-first-issue")) score += 25
//     if (repo.topics?.includes("help-wanted")) score += 25
//     return Math.min(score, 100)
//   }

//   private determineExperienceLevel(user: any, repos: any[]): string {
//     const repoCount = user.public_repos
//     const followerCount = user.followers
//     const accountAge =
//       (Date.now() - new Date(user.created_at).getTime()) /
//       (1000 * 60 * 60 * 24 * 365)

//     if (repoCount > 50 || followerCount > 100 || accountAge > 3) {
//       return "experienced"
//     } else if (repoCount > 10 || followerCount > 20 || accountAge > 1) {
//       return "intermediate"
//     } else {
//       return "beginner"
//     }
//   }

//   private analyzeContributionFrequency(repos: any[]): string {
//     if (repos.length === 0) return "inactive"

//     const recentRepos = repos.filter(
//       repo =>
//         new Date(repo.updated_at) >
//         new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
//     )

//     if (recentRepos.length > 5) return "very_active"
//     if (recentRepos.length > 2) return "active"
//     if (recentRepos.length > 0) return "moderate"
//     return "low"
//   }

//   private analyzeProjectTypes(repos: any[]): string[] {
//     const types = new Set<string>()

//     repos.forEach(repo => {
//       if (repo.fork) types.add("contributor")
//       if (repo.stargazers_count > 10) types.add("creator")
//       if (
//         repo.topics?.some(
//           (t: string) => t.includes("tutorial") || t.includes("example")
//         )
//       ) {
//         types.add("educator")
//       }
//     })

//     return Array.from(types)
//   }

//   private extractFrameworksFromRepos(repos: any[]): string[] {
//     const frameworks = new Set<string>()

//     repos.forEach(repo => {
//       repo.topics?.forEach((topic: string) => {
//         const knownFrameworks = [
//           "react",
//           "vue",
//           "angular",
//           "express",
//           "django",
//           "flask",
//           "spring",
//           "rails",
//         ]
//         if (knownFrameworks.includes(topic.toLowerCase())) {
//           frameworks.add(topic)
//         }
//       })
//     })

//     return Array.from(frameworks)
//   }

//   private extractDomainsFromRepos(repos: any[]): string[] {
//     const domains = new Set<string>()

//     repos.forEach(repo => {
//       repo.topics?.forEach((topic: string) => {
//         const knownDomains = [
//           "web",
//           "mobile",
//           "ai",
//           "ml",
//           "blockchain",
//           "iot",
//           "game",
//           "cli",
//         ]
//         if (knownDomains.includes(topic.toLowerCase())) {
//           domains.add(topic)
//         }
//       })
//     })

//     return Array.from(domains)
//   }

//   private suggestContributionTypes(user: any, repos: any[]): string[] {
//     const suggestions = ["code"]

//     if (user.bio?.toLowerCase().includes("design")) {
//       suggestions.push("design", "ui/ux")
//     }

//     if (
//       repos.some(
//         (r: any) =>
//           r.name.includes("doc") || r.description?.includes("documentation")
//       )
//     ) {
//       suggestions.push("documentation")
//     }

//     suggestions.push("testing", "bug-fixes")

//     return suggestions
//   }

//   private determineIdealProjectCharacteristics(user: any, repos: any[]): any {
//     const avgStars =
//       repos.reduce((sum, repo) => sum + repo.stargazers_count, 0) /
//         repos.length || 0

//     return {
//       preferred_project_size:
//         avgStars > 1000 ? "large" : avgStars > 100 ? "medium" : "small",
//       activity_level: "active",
//       community_size: "welcoming",
//       documentation_quality: "good",
//     }
//   }

//   private identifyLearningOpportunities(
//     languages: any,
//     repos: any[]
//   ): string[] {
//     const currentLanguages = Object.keys(languages)
//     const opportunities = []

//     const popularLanguages = [
//       "javascript",
//       "typescript",
//       "python",
//       "rust",
//       "go",
//     ]

//     popularLanguages.forEach(lang => {
//       if (!currentLanguages.map(l => l.toLowerCase()).includes(lang)) {
//         opportunities.push(lang)
//       }
//     })

//     return opportunities.slice(0, 3)
//   }

//   private calculateTrendingScore(repo: any, timeframe: string): number {
//     const ageWeight =
//       timeframe === "daily" ? 0.5 : timeframe === "weekly" ? 0.3 : 0.1
//     const starsWeight = 0.4
//     const activityWeight = 0.5

//     const daysSinceCreated =
//       (Date.now() - new Date(repo.created_at).getTime()) / (1000 * 60 * 60 * 24)
//     const ageScore = Math.max(0, 100 - daysSinceCreated * ageWeight)
//     const starsScore = Math.min(100, Math.log10(repo.stargazers_count + 1) * 20)
//     const activityScore = Math.min(100, repo.open_issues_count * 2)

//     return Math.round(ageScore * 0.3 + starsScore * 0.4 + activityScore * 0.3)
//   }

//   private categorizeSizeRange(stars: number): string {
//     if (stars > 10000) return "stars:>10000"
//     if (stars > 1000) return "stars:1000..10000"
//     if (stars > 100) return "stars:100..1000"
//     return "stars:10..100"
//   }

//   private calculateSimilarityScore(
//     refRepo: any,
//     compareRepo: any,
//     criteria: string[]
//   ): number {
//     let score = 0
//     let maxScore = 0

//     if (criteria.includes("language")) {
//       maxScore += 30
//       if (refRepo.language === compareRepo.language) score += 30
//     }

//     if (criteria.includes("topics")) {
//       maxScore += 40
//       const commonTopics =
//         refRepo.topics?.filter((topic: string) =>
//           compareRepo.topics?.includes(topic)
//         ).length || 0
//       score += Math.min(40, commonTopics * 10)
//     }

//     if (criteria.includes("size")) {
//       maxScore += 30
//       const sizeDiff = Math.abs(
//         Math.log10(refRepo.stargazers_count + 1) -
//           Math.log10(compareRepo.stargazers_count + 1)
//       )
//       score += Math.max(0, 30 - sizeDiff * 10)
//     }

//     return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
//   }

//   async run() {
//     const transport = new StdioServerTransport()
//     await this.server.connect(transport)
//     console.error("GitHub MCP Server running on stdio")
//   }
// }

// // Start the server
// if (import.meta.url === `file://${process.argv[1]}`) {
//   const server = new GitHubMCPServer()
//   server.run().catch(console.error)
// }

// export { GitHubMCPServer }
