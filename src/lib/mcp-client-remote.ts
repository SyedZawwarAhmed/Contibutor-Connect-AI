// src/lib/mcp-client-remote.ts (Simplified - GitHub API Only for Stability)
export interface MCPSearchParams {
  query: string
  language?: string
  difficulty?: "beginner" | "intermediate" | "advanced"
  topics?: string[]
  min_stars?: number
  max_stars?: number
  has_good_first_issues?: boolean
  active_recently?: boolean
}

export interface MCPRepository {
  name: string
  description: string
  url: string
  language: string
  languages: Record<string, number>
  topics: string[]
  stars: number
  forks: number
  openIssues: number
  lastUpdated: string
  license?: string
  contributionMetrics?: {
    hasGoodFirstIssues: boolean
    hasHelpWantedIssues: boolean
    hasContributingGuide: boolean
    hasCodeOfConduct: boolean
    recentActivity: boolean
    issueResponseTime: string
    maintainerActivity: boolean
  }
}

export interface MCPSearchResult {
  query: string
  total_found: number
  repositories: MCPRepository[]
  search_metadata: {
    language?: string
    difficulty?: string
    topics?: string[]
    filters_applied: Record<string, any>
  }
}

export interface MCPUserAnalysis {
  profile: {
    username: string
    name: string
    bio: string
    company: string
    location: string
    publicRepos: number
    followers: number
    memberSince: string
  }
  experience_indicators: {
    total_repositories: number
    experience_level: string
    contribution_frequency: string
    project_types: string[]
  }
  technical_profile: {
    primary_languages: Record<string, number>
    frameworks_and_tools: string[]
    project_domains: string[]
  }
  recommendations: {
    suggested_contribution_types: string[]
    ideal_project_characteristics: {
      preferred_project_size: string
      activity_level: string
      community_size: string
      documentation_quality: string
    }
    learning_opportunities: string[]
  }
}

// Enhanced GitHub API Service
class GitHubAPIService {
  private baseUrl = "https://api.github.com"
  private headers: Record<string, string>

  constructor() {
    this.headers = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "ContributorConnect-AI/1.0",
    }

    if (process.env.GITHUB_TOKEN) {
      this.headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`
    }
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: this.headers,
    })

    if (!response.ok) {
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`
      )
    }

    return response.json()
  }

  private buildSearchQuery(params: MCPSearchParams): string {
    let searchTerms: string[] = []

    // Process the query more carefully
    const baseQuery = params.query?.trim() || ""

    // Extract simple keywords from complex queries
    if (baseQuery) {
      // Remove common phrases that might confuse GitHub search
      const cleanQuery = baseQuery
        .replace(/find me|show me|recommend|projects for|based on/gi, "")
        .replace(/your profile|your experience|your background/gi, "")
        .trim()

      // Extract technology/language keywords
      const keywords = cleanQuery
        .split(/\s+/)
        .filter(
          word =>
            word.length > 2 &&
            !word.includes(".") &&
            !/^(the|and|for|with|that|this|from|your|you)$/i.test(word) &&
            !/^https?:/.test(word)
        )
        .slice(0, 2) // Limit to 2 keywords to avoid complexity

      if (keywords.length > 0) {
        searchTerms.push(...keywords)
      }
    }

    // Add language filter (most important)
    if (params.language) {
      searchTerms.push(`language:${params.language}`)
    }

    // Add difficulty-based filters
    if (params.difficulty === "beginner") {
      searchTerms.push("good-first-issues:>1")
    } else if (params.difficulty === "advanced") {
      searchTerms.push("stars:>1000")
    } else {
      // For intermediate or no difficulty, add reasonable star filter
      searchTerms.push("stars:>10")
    }

    // Add good first issues filter
    if (params.has_good_first_issues) {
      searchTerms.push("good-first-issues:>0")
    }

    // Add recent activity filter
    if (params.active_recently) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      searchTerms.push(`pushed:>${thirtyDaysAgo.toISOString().split("T")[0]}`)
    }

    // Add star range filters
    if (params.min_stars && params.min_stars > 0) {
      searchTerms.push(`stars:>${params.min_stars}`)
    }
    if (params.max_stars && params.max_stars > 0) {
      searchTerms.push(`stars:<${params.max_stars}`)
    }

    // Add topics (limit to avoid query complexity)
    if (params.topics && params.topics.length > 0) {
      params.topics.slice(0, 2).forEach((topic: string) => {
        if (topic && topic.length > 0 && !/[:"<>]/.test(topic)) {
          searchTerms.push(`topic:${topic}`)
        }
      })
    }

    // Add basic filters
    searchTerms.push("is:public", "archived:false")

    // Build final query
    const finalQuery = searchTerms.join(" ")

    // Fallback for overly complex queries
    if (finalQuery.length > 256) {
      return params.language
        ? `language:${params.language} is:public archived:false stars:>10`
        : "is:public archived:false stars:>50"
    }

    console.log("Built GitHub Search Query:", finalQuery)
    return finalQuery
  }

  async searchRepositories(params: MCPSearchParams): Promise<MCPSearchResult> {
    const searchQuery = this.buildSearchQuery(params)

    const queryParams = new URLSearchParams({
      q: searchQuery,
      sort: params.difficulty === "beginner" ? "help-wanted-issues" : "stars",
      order: "desc",
      per_page: "20",
    })

    try {
      const results = await this.makeRequest<{
        total_count: number
        items: any[]
      }>(`/search/repositories?${queryParams}`)

      // Transform GitHub API response
      const repositories: MCPRepository[] = results.items.map((repo: any) => ({
        name: repo.full_name,
        description: repo.description || "",
        url: repo.html_url,
        language: repo.language || "Mixed",
        languages: { [repo.language || "Mixed"]: 100 },
        topics: repo.topics || [],
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        openIssues: repo.open_issues_count,
        lastUpdated: repo.updated_at,
        license: repo.license?.name,
        contributionMetrics: {
          hasGoodFirstIssues: repo.open_issues_count > 0,
          hasHelpWantedIssues: repo.open_issues_count > 0,
          hasContributingGuide: true, // Assume modern repos have guides
          hasCodeOfConduct: repo.stargazers_count > 100,
          recentActivity:
            new Date(repo.updated_at) >
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          issueResponseTime: "medium",
          maintainerActivity: true,
        },
      }))

      return {
        query: searchQuery,
        total_found: results.total_count,
        repositories,
        search_metadata: {
          language: params.language,
          difficulty: params.difficulty,
          topics: params.topics,
          filters_applied: {
            min_stars: params.min_stars,
            max_stars: params.max_stars,
            has_good_first_issues: params.has_good_first_issues,
            active_recently: params.active_recently,
          },
        },
      }
    } catch (error) {
      console.error("GitHub search failed:", error)

      // Simple fallback query
      const fallbackQuery = params.language
        ? `language:${params.language} stars:>10 is:public`
        : "stars:>100 is:public"

      const fallbackParams = new URLSearchParams({
        q: fallbackQuery,
        sort: "stars",
        order: "desc",
        per_page: "10",
      })

      try {
        const fallbackResults = await this.makeRequest<{
          total_count: number
          items: any[]
        }>(`/search/repositories?${fallbackParams}`)

        const repositories: MCPRepository[] = fallbackResults.items.map(
          (repo: any) => ({
            name: repo.full_name,
            description: repo.description || "",
            url: repo.html_url,
            language: repo.language || "Mixed",
            languages: { [repo.language || "Mixed"]: 100 },
            topics: repo.topics || [],
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            openIssues: repo.open_issues_count,
            lastUpdated: repo.updated_at,
            license: repo.license?.name,
          })
        )

        return {
          query: fallbackQuery,
          total_found: fallbackResults.total_count,
          repositories,
          search_metadata: {
            language: params.language,
            difficulty: params.difficulty,
            topics: params.topics,
            filters_applied: { fallback: true },
          },
        }
      } catch (fallbackError) {
        console.error("Fallback search also failed:", fallbackError)
        return {
          query: searchQuery,
          total_found: 0,
          repositories: [],
          search_metadata: {
            language: params.language,
            difficulty: params.difficulty,
            topics: params.topics,
            filters_applied: { error: true },
          },
        }
      }
    }
  }

  async analyzeUserGitHubProfile(username: string): Promise<MCPUserAnalysis> {
    try {
      // Get user profile
      const user = await this.makeRequest<any>(`/users/${username}`)

      // Get user repositories
      const repos = await this.makeRequest<any[]>(
        `/users/${username}/repos?sort=updated&per_page=100`
      )

      // Analyze languages
      const languageStats: Record<string, number> = {}
      repos.forEach(repo => {
        if (repo.language) {
          languageStats[repo.language] = (languageStats[repo.language] || 0) + 1
        }
      })

      // Determine experience level
      const determineExperienceLevel = () => {
        const repoCount = user.public_repos
        const followerCount = user.followers
        const accountAge =
          (Date.now() - new Date(user.created_at).getTime()) /
          (1000 * 60 * 60 * 24 * 365)

        if (repoCount > 50 || followerCount > 100 || accountAge > 3) {
          return "experienced"
        } else if (repoCount > 10 || followerCount > 20 || accountAge > 1) {
          return "intermediate"
        } else {
          return "beginner"
        }
      }

      // Analyze contribution frequency
      const analyzeContributionFrequency = () => {
        const recentRepos = repos.filter(
          repo =>
            new Date(repo.updated_at) >
            new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        )

        if (recentRepos.length > 10) return "very_active"
        if (recentRepos.length > 5) return "active"
        if (recentRepos.length > 2) return "moderate"
        return "low"
      }

      // Extract frameworks and tools
      const extractFrameworks = () => {
        const frameworks = new Set<string>()
        repos.forEach(repo => {
          repo.topics?.forEach((topic: string) => {
            const knownFrameworks = [
              "react",
              "vue",
              "angular",
              "express",
              "django",
              "flask",
              "spring",
              "rails",
              "nextjs",
              "nuxt",
              "svelte",
              "fastapi",
              "nestjs",
              "laravel",
            ]
            if (knownFrameworks.includes(topic.toLowerCase())) {
              frameworks.add(topic)
            }
          })
        })
        return Array.from(frameworks)
      }

      // Extract project domains
      const extractDomains = () => {
        const domains = new Set<string>()
        repos.forEach(repo => {
          repo.topics?.forEach((topic: string) => {
            const knownDomains = [
              "web",
              "mobile",
              "ai",
              "ml",
              "blockchain",
              "iot",
              "game",
              "cli",
              "defi",
              "frontend",
              "backend",
              "fullstack",
              "api",
              "microservices",
            ]
            if (knownDomains.includes(topic.toLowerCase())) {
              domains.add(topic)
            }
          })
        })
        return Array.from(domains)
      }

      return {
        profile: {
          username: user.login,
          name: user.name || user.login,
          bio: user.bio || "",
          company: user.company || "",
          location: user.location || "",
          publicRepos: user.public_repos,
          followers: user.followers,
          memberSince: user.created_at,
        },
        experience_indicators: {
          total_repositories: user.public_repos,
          experience_level: determineExperienceLevel(),
          contribution_frequency: analyzeContributionFrequency(),
          project_types: repos.some(r => r.fork)
            ? ["contributor", "creator"]
            : ["creator"],
        },
        technical_profile: {
          primary_languages: languageStats,
          frameworks_and_tools: extractFrameworks(),
          project_domains: extractDomains(),
        },
        recommendations: {
          suggested_contribution_types: [
            "code",
            "documentation",
            "testing",
            "bug-fixes",
          ],
          ideal_project_characteristics: {
            preferred_project_size: "medium",
            activity_level: "active",
            community_size: "welcoming",
            documentation_quality: "good",
          },
          learning_opportunities: ["typescript", "rust", "go", "python"]
            .filter(
              lang =>
                !Object.keys(languageStats)
                  .map(l => l.toLowerCase())
                  .includes(lang)
            )
            .slice(0, 3),
        },
      }
    } catch (error) {
      console.error("Error analyzing user profile:", error)
      throw error
    }
  }

  async getTrendingRepositories(
    params: {
      language?: string
      since?: "daily" | "weekly" | "monthly"
      limit?: number
    } = {}
  ): Promise<any> {
    const { language, since = "weekly", limit = 10 } = params

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

    const queryParams = new URLSearchParams({
      q: query,
      sort: "stars",
      order: "desc",
      per_page: limit.toString(),
    })

    try {
      const results = await this.makeRequest<{
        total_count: number
        items: any[]
      }>(`/search/repositories?${queryParams}`)

      return {
        timeframe: since,
        language: language || "all",
        total_found: results.total_count,
        trending_repositories: results.items.map((repo: any) => ({
          name: repo.full_name,
          description: repo.description,
          url: repo.html_url,
          language: repo.language,
          topics: repo.topics,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          openIssues: repo.open_issues_count,
          createdAt: repo.created_at,
          trendingScore: Math.min(
            100,
            Math.log10(repo.stargazers_count + 1) * 20
          ),
        })),
      }
    } catch (error) {
      console.error("Error fetching trending repositories:", error)
      return {
        timeframe: since,
        language: language || "all",
        total_found: 0,
        trending_repositories: [],
      }
    }
  }

  async findBeginnerFriendlyRepos(params: {
    language?: string
    topic?: string
    user_experience_level?:
      | "complete_beginner"
      | "some_experience"
      | "intermediate"
  }): Promise<any> {
    const { language, topic } = params

    let query =
      "good-first-issues:>3 help-wanted-issues:>1 stars:>50 stars:<5000"

    if (language) {
      query += ` language:${language}`
    }

    if (topic) {
      query += ` topic:${topic}`
    }

    try {
      const searchResult = await this.searchRepositories({
        query,
        language,
        has_good_first_issues: true,
        difficulty: "beginner",
      })

      return {
        criteria: params,
        total_found: searchResult.total_found,
        repositories: searchResult.repositories.slice(0, 10).map(repo => ({
          ...repo,
          beginnerFriendlyScore: Math.min(
            100,
            (repo.openIssues > 5 ? 25 : 0) +
              (repo.stars > 100 && repo.stars < 1000 ? 25 : 0) +
              (repo.contributionMetrics?.recentActivity ? 25 : 0) +
              25 // Base score
          ),
        })),
      }
    } catch (error) {
      console.error("Error finding beginner-friendly repos:", error)
      return {
        criteria: params,
        total_found: 0,
        repositories: [],
      }
    }
  }

  async getRepositoryDetails(owner: string, repo: string): Promise<any> {
    try {
      const repoData: object = await this.makeRequest(`/repos/${owner}/${repo}`)

      // Get additional data
      const [languages, contributors, issues] = await Promise.allSettled([
        this.makeRequest(`/repos/${owner}/${repo}/languages`),
        this.makeRequest(`/repos/${owner}/${repo}/contributors?per_page=10`),
        this.makeRequest(
          `/repos/${owner}/${repo}/issues?state=open&labels=good%20first%20issue,help%20wanted&per_page=10`
        ),
      ])

      return {
        ...repoData,
        languages: languages.status === "fulfilled" ? languages.value : {},
        contributors:
          contributors.status === "fulfilled" ? contributors.value : [],
        goodFirstIssues: issues.status === "fulfilled" ? issues.value : [],
      }
    } catch (error) {
      console.error(
        `Error getting repository details for ${owner}/${repo}:`,
        error
      )
      throw error
    }
  }
}

// Main RemoteMCPClient - Now uses only GitHub API for stability
class RemoteMCPClient {
  private githubAPI: GitHubAPIService

  constructor() {
    this.githubAPI = new GitHubAPIService()
    console.log("🔧 MCP Client initialized with GitHub API backend")
  }

  async searchRepositories(params: MCPSearchParams): Promise<MCPSearchResult> {
    console.log("🔍 Using GitHub API for repository search")
    return await this.githubAPI.searchRepositories(params)
  }

  async getRepositoryDetails(owner: string, repo: string): Promise<any> {
    console.log(`📄 Getting repository details for ${owner}/${repo}`)
    return await this.githubAPI.getRepositoryDetails(owner, repo)
  }

  async findBeginnerFriendlyRepos(params: {
    language?: string
    topic?: string
    user_experience_level?:
      | "complete_beginner"
      | "some_experience"
      | "intermediate"
  }): Promise<any> {
    console.log("🌱 Finding beginner-friendly repositories")
    return await this.githubAPI.findBeginnerFriendlyRepos(params)
  }

  async analyzeUserGitHubProfile(username: string): Promise<MCPUserAnalysis> {
    console.log(`👤 Analyzing GitHub profile for @${username}`)
    return await this.githubAPI.analyzeUserGitHubProfile(username)
  }

  async getTrendingRepositories(
    params: {
      language?: string
      since?: "daily" | "weekly" | "monthly"
      limit?: number
    } = {}
  ): Promise<any> {
    console.log("📈 Getting trending repositories")
    return await this.githubAPI.getTrendingRepositories(params)
  }

  async findSimilarRepositories(
    owner: string,
    repo: string,
    criteria: string[] = ["language", "topics"]
  ): Promise<any> {
    console.log(`🔗 Finding repositories similar to ${owner}/${repo}`)

    try {
      // Get the reference repository
      const refRepo = await this.getRepositoryDetails(owner, repo)

      // Search for similar repositories based on language and topics
      let searchQuery = ""
      if (refRepo.language) {
        searchQuery += `language:${refRepo.language}`
      }

      // Add a few topics if available
      if (refRepo.topics && refRepo.topics.length > 0) {
        refRepo.topics.slice(0, 2).forEach((topic: string) => {
          searchQuery += ` topic:${topic}`
        })
      }

      const searchResult = await this.searchRepositories({
        query: searchQuery || "popular",
        language: refRepo.language,
        min_stars: 50,
      })

      // Filter out the reference repository itself
      const similarRepos = searchResult.repositories
        .filter(item => item.name !== refRepo.full_name)
        .slice(0, 10)
        .map(item => ({
          ...item,
          similarityScore: this.calculateSimilarityScore(
            refRepo,
            item,
            criteria
          ),
        }))

      return {
        reference_repository: refRepo.full_name,
        similarity_criteria: criteria,
        similar_repositories: similarRepos,
      }
    } catch (error) {
      console.error("Error finding similar repositories:", error)
      throw error
    }
  }

  private calculateSimilarityScore(
    refRepo: any,
    compareRepo: any,
    criteria: string[]
  ): number {
    let score = 0
    let maxScore = 0

    if (criteria.includes("language")) {
      maxScore += 40
      if (refRepo.language === compareRepo.language) {
        score += 40
      }
    }

    if (criteria.includes("topics")) {
      maxScore += 40
      const commonTopics =
        refRepo.topics?.filter((topic: string) =>
          compareRepo.topics?.includes(topic)
        ).length || 0
      score += Math.min(40, commonTopics * 10)
    }

    if (criteria.includes("size")) {
      maxScore += 20
      const sizeDiff = Math.abs(
        Math.log10(refRepo.stargazers_count + 1) -
          Math.log10(compareRepo.stars + 1)
      )
      score += Math.max(0, 20 - sizeDiff * 5)
    }

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 50
  }

  // Health check method
  async testConnection(): Promise<{
    success: boolean
    service: string
    details?: any
  }> {
    try {
      const testResult = await this.githubAPI.searchRepositories({
        query: "test",
        language: "javascript",
      })

      return {
        success: true,
        service: "GitHub API",
        details: {
          total_found: testResult.total_found,
          repositories_returned: testResult.repositories.length,
        },
      }
    } catch (error) {
      return {
        success: false,
        service: "GitHub API",
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }
    }
  }
}

// Singleton instance
export const remoteMCPClient = new RemoteMCPClient()

// Helper function for server-side usage
export async function withRemoteMCPClient<T>(
  operation: (client: RemoteMCPClient) => Promise<T>
): Promise<T> {
  try {
    return await operation(remoteMCPClient)
  } catch (error) {
    console.error("MCP operation failed:", error)
    throw error
  }
}

// Export test function
export async function testMCPConnection() {
  return await remoteMCPClient.testConnection()
}

// // src/lib/mcp-client-remote.ts (Fixed GitHub Search Query)
// export interface MCPSearchParams {
//   query: string
//   language?: string
//   difficulty?: "beginner" | "intermediate" | "advanced"
//   topics?: string[]
//   min_stars?: number
//   max_stars?: number
//   has_good_first_issues?: boolean
//   active_recently?: boolean
// }

// export interface MCPRepository {
//   name: string
//   description: string
//   url: string
//   language: string
//   languages: Record<string, number>
//   topics: string[]
//   stars: number
//   forks: number
//   openIssues: number
//   lastUpdated: string
//   license?: string
//   contributionMetrics?: {
//     hasGoodFirstIssues: boolean
//     hasHelpWantedIssues: boolean
//     hasContributingGuide: boolean
//     hasCodeOfConduct: boolean
//     recentActivity: boolean
//     issueResponseTime: string
//     maintainerActivity: boolean
//   }
// }

// export interface MCPSearchResult {
//   query: string
//   total_found: number
//   repositories: MCPRepository[]
//   search_metadata: {
//     language?: string
//     difficulty?: string
//     topics?: string[]
//     filters_applied: Record<string, any>
//   }
// }

// export interface MCPUserAnalysis {
//   profile: {
//     username: string
//     name: string
//     bio: string
//     company: string
//     location: string
//     publicRepos: number
//     followers: number
//     memberSince: string
//   }
//   experience_indicators: {
//     total_repositories: number
//     experience_level: string
//     contribution_frequency: string
//     project_types: string[]
//   }
//   technical_profile: {
//     primary_languages: Record<string, number>
//     frameworks_and_tools: string[]
//     project_domains: string[]
//   }
//   recommendations: {
//     suggested_contribution_types: string[]
//     ideal_project_characteristics: {
//       preferred_project_size: string
//       activity_level: string
//       community_size: string
//       documentation_quality: string
//     }
//     learning_opportunities: string[]
//   }
// }

// // GitHub API fallback service
// class GitHubAPIService {
//   private baseUrl = "https://api.github.com"
//   private headers: Record<string, string>

//   constructor() {
//     this.headers = {
//       Accept: "application/vnd.github.v3+json",
//       "User-Agent": "ContributorConnect-AI/1.0",
//     }

//     if (process.env.GITHUB_TOKEN) {
//       this.headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`
//     }
//   }

//   private async makeRequest<T>(endpoint: string): Promise<T> {
//     const response = await fetch(`${this.baseUrl}${endpoint}`, {
//       headers: this.headers,
//     })

//     if (!response.ok) {
//       throw new Error(
//         `GitHub API error: ${response.status} ${response.statusText}`
//       )
//     }

//     return response.json()
//   }

//   private buildSearchQuery(params: MCPSearchParams): string {
//     let searchTerms: string[] = []

//     // Start with basic query or default
//     const baseQuery = params.query?.trim() || "open source"

//     // Only add the base query if it's simple (no special characters that might break GitHub search)
//     if (baseQuery && !/[:"<>]/.test(baseQuery)) {
//       // Extract simple keywords from the query
//       const keywords = baseQuery
//         .split(/\s+/)
//         .filter(
//           word =>
//             word.length > 2 && !word.includes(".") && !/^https?:/.test(word)
//         )
//         .slice(0, 3) // Limit to 3 keywords to avoid query length issues

//       if (keywords.length > 0) {
//         searchTerms.push(keywords.join(" "))
//       }
//     }

//     // Add language filter
//     if (params.language) {
//       searchTerms.push(`language:${params.language}`)
//     }

//     // Add difficulty-based filters
//     if (params.difficulty === "beginner") {
//       searchTerms.push("good-first-issues:>1")
//     } else if (params.difficulty === "advanced") {
//       searchTerms.push("stars:>1000")
//     }

//     // Add star filters
//     if (params.min_stars && params.min_stars > 0) {
//       searchTerms.push(`stars:>${params.min_stars}`)
//     }
//     if (params.max_stars && params.max_stars > 0) {
//       searchTerms.push(`stars:<${params.max_stars}`)
//     }

//     // Add good first issues filter
//     if (params.has_good_first_issues) {
//       searchTerms.push("good-first-issues:>0")
//     }

//     // Add recent activity filter
//     if (params.active_recently) {
//       const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
//       searchTerms.push(`pushed:>${thirtyDaysAgo.toISOString().split("T")[0]}`)
//     }

//     // Add topics (limit to avoid query complexity)
//     if (params.topics && params.topics.length > 0) {
//       params.topics.slice(0, 2).forEach((topic: string) => {
//         if (topic && topic.length > 0 && !/[:"<>]/.test(topic)) {
//           searchTerms.push(`topic:${topic}`)
//         }
//       })
//     }

//     // Add common filters for good open source projects
//     searchTerms.push("is:public", "archived:false")

//     // Join all terms
//     const finalQuery = searchTerms.join(" ")

//     // Ensure query isn't too long (GitHub has limits)
//     if (finalQuery.length > 256) {
//       // Fallback to simpler query
//       return params.language
//         ? `language:${params.language} is:public archived:false stars:>10`
//         : "is:public archived:false stars:>10"
//     }

//     return finalQuery
//   }

//   async searchRepositories(params: MCPSearchParams): Promise<MCPSearchResult> {
//     const searchQuery = this.buildSearchQuery(params)

//     console.log("GitHub Search Query:", searchQuery)

//     const queryParams = new URLSearchParams({
//       q: searchQuery,
//       sort: params.difficulty === "beginner" ? "help-wanted-issues" : "stars",
//       order: "desc",
//       per_page: "20",
//     })

//     try {
//       const results = await this.makeRequest<{
//         total_count: number
//         items: any[]
//       }>(`/search/repositories?${queryParams}`)

//       // Transform GitHub API response to our format
//       const repositories: MCPRepository[] = results.items.map((repo: any) => ({
//         name: repo.full_name,
//         description: repo.description || "",
//         url: repo.html_url,
//         language: repo.language || "Mixed",
//         languages: { [repo.language || "Mixed"]: 100 },
//         topics: repo.topics || [],
//         stars: repo.stargazers_count,
//         forks: repo.forks_count,
//         openIssues: repo.open_issues_count,
//         lastUpdated: repo.updated_at,
//         license: repo.license?.name,
//       }))

//       return {
//         query: searchQuery,
//         total_found: results.total_count,
//         repositories,
//         search_metadata: {
//           language: params.language,
//           difficulty: params.difficulty,
//           topics: params.topics,
//           filters_applied: {
//             min_stars: params.min_stars,
//             max_stars: params.max_stars,
//             has_good_first_issues: params.has_good_first_issues,
//             active_recently: params.active_recently,
//           },
//         },
//       }
//     } catch (error) {
//       console.error("GitHub search failed:", error)

//       // Fallback to very simple search
//       const fallbackQuery = params.language
//         ? `language:${params.language} stars:>10`
//         : "stars:>100"

//       const fallbackParams = new URLSearchParams({
//         q: fallbackQuery,
//         sort: "stars",
//         order: "desc",
//         per_page: "10",
//       })

//       try {
//         const fallbackResults = await this.makeRequest<{
//           total_count: number
//           items: any[]
//         }>(`/search/repositories?${fallbackParams}`)

//         const repositories: MCPRepository[] = fallbackResults.items.map(
//           (repo: any) => ({
//             name: repo.full_name,
//             description: repo.description || "",
//             url: repo.html_url,
//             language: repo.language || "Mixed",
//             languages: { [repo.language || "Mixed"]: 100 },
//             topics: repo.topics || [],
//             stars: repo.stargazers_count,
//             forks: repo.forks_count,
//             openIssues: repo.open_issues_count,
//             lastUpdated: repo.updated_at,
//             license: repo.license?.name,
//           })
//         )

//         return {
//           query: fallbackQuery,
//           total_found: fallbackResults.total_count,
//           repositories,
//           search_metadata: {
//             language: params.language,
//             difficulty: params.difficulty,
//             topics: params.topics,
//             filters_applied: { fallback: true },
//           },
//         }
//       } catch (fallbackError) {
//         console.error("Fallback search also failed:", fallbackError)
//         return {
//           query: searchQuery,
//           total_found: 0,
//           repositories: [],
//           search_metadata: {
//             language: params.language,
//             difficulty: params.difficulty,
//             topics: params.topics,
//             filters_applied: { error: true },
//           },
//         }
//       }
//     }
//   }

//   async analyzeUserGitHubProfile(username: string): Promise<MCPUserAnalysis> {
//     // Get user profile
//     const user = await this.makeRequest<any>(`/users/${username}`)

//     // Get user repositories
//     const repos = await this.makeRequest<any[]>(
//       `/users/${username}/repos?sort=updated&per_page=50`
//     )

//     // Analyze languages
//     const languageStats: Record<string, number> = {}
//     repos.forEach(repo => {
//       if (repo.language) {
//         languageStats[repo.language] = (languageStats[repo.language] || 0) + 1
//       }
//     })

//     // Determine experience level
//     const determineExperienceLevel = () => {
//       const repoCount = user.public_repos
//       const followerCount = user.followers
//       const accountAge =
//         (Date.now() - new Date(user.created_at).getTime()) /
//         (1000 * 60 * 60 * 24 * 365)

//       if (repoCount > 50 || followerCount > 100 || accountAge > 3) {
//         return "experienced"
//       } else if (repoCount > 10 || followerCount > 20 || accountAge > 1) {
//         return "intermediate"
//       } else {
//         return "beginner"
//       }
//     }

//     // Analyze contribution frequency
//     const analyzeContributionFrequency = () => {
//       const recentRepos = repos.filter(
//         repo =>
//           new Date(repo.updated_at) >
//           new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
//       )

//       if (recentRepos.length > 5) return "very_active"
//       if (recentRepos.length > 2) return "active"
//       if (recentRepos.length > 0) return "moderate"
//       return "low"
//     }

//     // Extract frameworks from repo topics
//     const extractFrameworks = () => {
//       const frameworks = new Set<string>()
//       repos.forEach(repo => {
//         repo.topics?.forEach((topic: string) => {
//           const knownFrameworks = [
//             "react",
//             "vue",
//             "angular",
//             "express",
//             "django",
//             "flask",
//             "spring",
//             "rails",
//           ]
//           if (knownFrameworks.includes(topic.toLowerCase())) {
//             frameworks.add(topic)
//           }
//         })
//       })
//       return Array.from(frameworks)
//     }

//     // Extract project domains
//     const extractDomains = () => {
//       const domains = new Set<string>()
//       repos.forEach(repo => {
//         repo.topics?.forEach((topic: string) => {
//           const knownDomains = [
//             "web",
//             "mobile",
//             "ai",
//             "ml",
//             "blockchain",
//             "iot",
//             "game",
//             "cli",
//           ]
//           if (knownDomains.includes(topic.toLowerCase())) {
//             domains.add(topic)
//           }
//         })
//       })
//       return Array.from(domains)
//     }

//     return {
//       profile: {
//         username: user.login,
//         name: user.name || user.login,
//         bio: user.bio || "",
//         company: user.company || "",
//         location: user.location || "",
//         publicRepos: user.public_repos,
//         followers: user.followers,
//         memberSince: user.created_at,
//       },
//       experience_indicators: {
//         total_repositories: user.public_repos,
//         experience_level: determineExperienceLevel(),
//         contribution_frequency: analyzeContributionFrequency(),
//         project_types: repos.some(r => r.fork)
//           ? ["contributor", "creator"]
//           : ["creator"],
//       },
//       technical_profile: {
//         primary_languages: languageStats,
//         frameworks_and_tools: extractFrameworks(),
//         project_domains: extractDomains(),
//       },
//       recommendations: {
//         suggested_contribution_types: ["code", "documentation", "testing"],
//         ideal_project_characteristics: {
//           preferred_project_size: "medium",
//           activity_level: "active",
//           community_size: "welcoming",
//           documentation_quality: "good",
//         },
//         learning_opportunities: ["typescript", "rust", "go"].filter(
//           lang =>
//             !Object.keys(languageStats)
//               .map(l => l.toLowerCase())
//               .includes(lang)
//         ),
//       },
//     }
//   }

//   async getTrendingRepositories(
//     params: {
//       language?: string
//       since?: "daily" | "weekly" | "monthly"
//       limit?: number
//     } = {}
//   ): Promise<any> {
//     const { language, since = "weekly", limit = 10 } = params

//     const date = new Date()
//     if (since === "daily") {
//       date.setDate(date.getDate() - 1)
//     } else if (since === "weekly") {
//       date.setDate(date.getDate() - 7)
//     } else {
//       date.setMonth(date.getMonth() - 1)
//     }

//     let query = `created:>${date.toISOString().split("T")[0]} stars:>10`

//     if (language) {
//       query += ` language:${language}`
//     }

//     const queryParams = new URLSearchParams({
//       q: query,
//       sort: "stars",
//       order: "desc",
//       per_page: limit.toString(),
//     })

//     const results = await this.makeRequest<{
//       total_count: number
//       items: any[]
//     }>(`/search/repositories?${queryParams}`)

//     return {
//       timeframe: since,
//       language: language || "all",
//       total_found: results.total_count,
//       trending_repositories: results.items.map((repo: any) => ({
//         name: repo.full_name,
//         description: repo.description,
//         url: repo.html_url,
//         language: repo.language,
//         topics: repo.topics,
//         stars: repo.stargazers_count,
//         forks: repo.forks_count,
//         openIssues: repo.open_issues_count,
//         createdAt: repo.created_at,
//       })),
//     }
//   }

//   async findBeginnerFriendlyRepos(params: {
//     language?: string
//     topic?: string
//     user_experience_level?:
//       | "complete_beginner"
//       | "some_experience"
//       | "intermediate"
//   }): Promise<any> {
//     const { language, topic } = params

//     let query = "good-first-issues:>5 help-wanted-issues:>3 stars:>100"

//     if (language) {
//       query += ` language:${language}`
//     }

//     if (topic) {
//       query += ` topic:${topic}`
//     }

//     const searchResult = await this.searchRepositories({
//       query,
//       language,
//       has_good_first_issues: true,
//     })

//     return {
//       criteria: params,
//       total_found: searchResult.total_found,
//       repositories: searchResult.repositories.slice(0, 10).map(repo => ({
//         ...repo,
//         beginnerFriendlyScore: Math.min(100, (repo.openIssues || 0) * 2),
//       })),
//     }
//   }
// }

// // Real MCP Client for Remote GitHub Server
// class GitHubMCPClient {
//   private baseUrl: string
//   private headers: Record<string, string>

//   constructor() {
//     // This is the actual GitHub MCP Server endpoint
//     this.baseUrl = "https://api.githubcopilot.com/mcp"
//     this.headers = {
//       "Content-Type": "application/json",
//       "User-Agent": "ContributorConnect-AI/1.0",
//     }

//     // Add authorization for the MCP server
//     if (process.env.GITHUB_TOKEN) {
//       this.headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`
//     }
//   }

//   private async makeRequest(toolName: string, arguments_: any): Promise<any> {
//     try {
//       // This is the correct format for the GitHub MCP Server
//       const response = await fetch(`${this.baseUrl}/call`, {
//         method: "POST",
//         headers: this.headers,
//         body: JSON.stringify({
//           method: "tools/call",
//           params: {
//             name: toolName,
//             arguments: arguments_,
//           },
//         }),
//       })

//       if (!response.ok) {
//         throw new Error(
//           `MCP request failed: ${response.status} ${response.statusText}`
//         )
//       }

//       const data = await response.json()

//       // Handle MCP response format
//       if (data.error) {
//         throw new Error(
//           `MCP tool error: ${data.error.message || "Unknown error"}`
//         )
//       }

//       // Parse the content if it's JSON string
//       if (data.result?.content?.[0]?.text) {
//         try {
//           return JSON.parse(data.result.content[0].text)
//         } catch {
//           return data.result.content[0].text
//         }
//       }

//       return data.result
//     } catch (error) {
//       console.error(`MCP ${toolName} error:`, error)
//       throw error
//     }
//   }

//   async searchRepositories(params: MCPSearchParams): Promise<MCPSearchResult> {
//     return this.makeRequest("search_repositories", params)
//   }

//   async analyzeUserGitHubProfile(username: string): Promise<MCPUserAnalysis> {
//     return this.makeRequest("analyze_user_github_profile", {
//       username,
//       include_repositories: true,
//       include_languages: true,
//     })
//   }

//   async getTrendingRepositories(
//     params: {
//       language?: string
//       since?: "daily" | "weekly" | "monthly"
//       limit?: number
//     } = {}
//   ): Promise<any> {
//     return this.makeRequest("get_trending_repositories", params)
//   }

//   async findBeginnerFriendlyRepos(params: {
//     language?: string
//     topic?: string
//     user_experience_level?:
//       | "complete_beginner"
//       | "some_experience"
//       | "intermediate"
//   }): Promise<any> {
//     return this.makeRequest("find_beginner_friendly_repos", params)
//   }
// }

// // Main RemoteMCPClient that tries MCP first, then falls back to GitHub API
// class RemoteMCPClient {
//   private mcpClient: GitHubMCPClient
//   private githubAPI: GitHubAPIService
//   private useMCP: boolean

//   constructor() {
//     this.mcpClient = new GitHubMCPClient()
//     this.githubAPI = new GitHubAPIService()
//     // Enable MCP by default, will fallback to GitHub API if it fails
//     this.useMCP = true
//   }

//   async searchRepositories(params: MCPSearchParams): Promise<MCPSearchResult> {
//     if (this.useMCP) {
//       try {
//         console.log("Attempting GitHub MCP Server search...")
//         const result = await this.mcpClient.searchRepositories(params)
//         console.log("✅ GitHub MCP Server search successful")
//         return result
//       } catch (error) {
//         console.warn(
//           "❌ GitHub MCP Server failed, falling back to GitHub API:",
//           error
//         )
//         this.useMCP = false // Disable MCP for subsequent requests this session
//       }
//     }

//     console.log("Using GitHub API fallback for repository search")
//     return await this.githubAPI.searchRepositories(params)
//   }

//   async getRepositoryDetails(owner: string, repo: string): Promise<any> {
//     // Always use GitHub API for individual repo details (simpler)
//     const response = await fetch(
//       `https://api.github.com/repos/${owner}/${repo}`,
//       {
//         headers: {
//           Accept: "application/vnd.github.v3+json",
//           Authorization: process.env.GITHUB_TOKEN
//             ? `token ${process.env.GITHUB_TOKEN}`
//             : "",
//         },
//       }
//     )

//     if (!response.ok) {
//       throw new Error(
//         `Failed to get repository details: ${response.statusText}`
//       )
//     }

//     return response.json()
//   }

//   async findBeginnerFriendlyRepos(params: {
//     language?: string
//     topic?: string
//     user_experience_level?:
//       | "complete_beginner"
//       | "some_experience"
//       | "intermediate"
//   }): Promise<any> {
//     if (this.useMCP) {
//       try {
//         console.log("Attempting GitHub MCP Server beginner repos search...")
//         const result = await this.mcpClient.findBeginnerFriendlyRepos(params)
//         console.log("✅ GitHub MCP Server beginner repos search successful")
//         return result
//       } catch (error) {
//         console.warn(
//           "❌ GitHub MCP Server beginner repos failed, falling back to GitHub API:",
//           error
//         )
//       }
//     }

//     console.log("Using GitHub API fallback for beginner-friendly repos")
//     return await this.githubAPI.findBeginnerFriendlyRepos(params)
//   }

//   async analyzeUserGitHubProfile(username: string): Promise<MCPUserAnalysis> {
//     if (this.useMCP) {
//       try {
//         console.log("Attempting GitHub MCP Server profile analysis...")
//         const result = await this.mcpClient.analyzeUserGitHubProfile(username)
//         console.log("✅ GitHub MCP Server profile analysis successful")
//         return result
//       } catch (error) {
//         console.warn(
//           "❌ GitHub MCP Server profile analysis failed, falling back to GitHub API:",
//           error
//         )
//       }
//     }

//     console.log("Using GitHub API fallback for user profile analysis")
//     return await this.githubAPI.analyzeUserGitHubProfile(username)
//   }

//   async getTrendingRepositories(
//     params: {
//       language?: string
//       since?: "daily" | "weekly" | "monthly"
//       limit?: number
//     } = {}
//   ): Promise<any> {
//     if (this.useMCP) {
//       try {
//         console.log("Attempting GitHub MCP Server trending repos...")
//         const result = await this.mcpClient.getTrendingRepositories(params)
//         console.log("✅ GitHub MCP Server trending repos successful")
//         return result
//       } catch (error) {
//         console.warn(
//           "❌ GitHub MCP Server trending repos failed, falling back to GitHub API:",
//           error
//         )
//       }
//     }

//     console.log("Using GitHub API fallback for trending repositories")
//     return await this.githubAPI.getTrendingRepositories(params)
//   }

//   async findSimilarRepositories(
//     owner: string,
//     repo: string,
//     criteria: string[] = ["language", "topics"]
//   ): Promise<any> {
//     // Get the reference repository
//     const refRepo = await this.getRepositoryDetails(owner, repo)

//     // Search for similar repositories based on language
//     const searchResult = await this.searchRepositories({
//       query: `language:${refRepo.language} stars:>50`,
//       language: refRepo.language,
//     })

//     return {
//       reference_repository: refRepo.full_name,
//       similarity_criteria: criteria,
//       similar_repositories: searchResult.repositories.slice(0, 10),
//     }
//   }

//   // Method to check MCP availability
//   async testMCPConnection(): Promise<boolean> {
//     try {
//       await this.mcpClient.searchRepositories({
//         query: "test",
//         language: "javascript",
//       })
//       return true
//     } catch {
//       return false
//     }
//   }
// }

// // Singleton instance
// export const remoteMCPClient = new RemoteMCPClient()

// // Helper function for server-side usage
// export async function withRemoteMCPClient<T>(
//   operation: (client: RemoteMCPClient) => Promise<T>
// ): Promise<T> {
//   try {
//     return await operation(remoteMCPClient)
//   } catch (error) {
//     console.error("Remote MCP operation failed:", error)
//     throw error
//   }
// }

// // src/lib/mcp-client-remote.ts
// export interface MCPSearchParams {
//   query: string
//   language?: string
//   difficulty?: "beginner" | "intermediate" | "advanced"
//   topics?: string[]
//   min_stars?: number
//   max_stars?: number
//   has_good_first_issues?: boolean
//   active_recently?: boolean
// }

// export interface MCPRepository {
//   name: string
//   description: string
//   url: string
//   language: string
//   languages: Record<string, number>
//   topics: string[]
//   stars: number
//   forks: number
//   openIssues: number
//   lastUpdated: string
//   license?: string
//   contributionMetrics?: {
//     hasGoodFirstIssues: boolean
//     hasHelpWantedIssues: boolean
//     hasContributingGuide: boolean
//     hasCodeOfConduct: boolean
//     recentActivity: boolean
//     issueResponseTime: string
//     maintainerActivity: boolean
//   }
// }

// export interface MCPSearchResult {
//   query: string
//   total_found: number
//   repositories: MCPRepository[]
//   search_metadata: {
//     language?: string
//     difficulty?: string
//     topics?: string[]
//     filters_applied: Record<string, any>
//   }
// }

// export interface MCPUserAnalysis {
//   profile: {
//     username: string
//     name: string
//     bio: string
//     company: string
//     location: string
//     publicRepos: number
//     followers: number
//     memberSince: string
//   }
//   experience_indicators: {
//     total_repositories: number
//     experience_level: string
//     contribution_frequency: string
//     project_types: string[]
//   }
//   technical_profile: {
//     primary_languages: Record<string, number>
//     frameworks_and_tools: string[]
//     project_domains: string[]
//   }
//   recommendations: {
//     suggested_contribution_types: string[]
//     ideal_project_characteristics: {
//       preferred_project_size: string
//       activity_level: string
//       community_size: string
//       documentation_quality: string
//     }
//     learning_opportunities: string[]
//   }
// }

// class RemoteMCPClient {
//   private baseUrl: string
//   private headers: Record<string, string>

//   constructor() {
//     // Use the remote GitHub MCP Server hosted by GitHub
//     this.baseUrl = "https://api.githubcopilot.com/mcp"
//     this.headers = {
//       "Content-Type": "application/json",
//       "User-Agent": "ContributorConnect-AI/1.0",
//     }

//     // Add authorization if available
//     if (process.env.GITHUB_TOKEN) {
//       this.headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`
//     }
//   }

//   private async makeRequest(toolName: string, arguments_: any): Promise<any> {
//     try {
//       const response = await fetch(`${this.baseUrl}/tools/${toolName}`, {
//         method: "POST",
//         headers: this.headers,
//         body: JSON.stringify({
//           name: toolName,
//           arguments: arguments_,
//         }),
//       })

//       if (!response.ok) {
//         throw new Error(
//           `MCP request failed: ${response.status} ${response.statusText}`
//         )
//       }

//       const data = await response.json()

//       if (data.isError) {
//         throw new Error(
//           `MCP tool error: ${data.content?.[0]?.text || "Unknown error"}`
//         )
//       }

//       // Parse the content if it's JSON string
//       if (data.content?.[0]?.text) {
//         try {
//           return JSON.parse(data.content[0].text)
//         } catch {
//           return data.content[0].text
//         }
//       }

//       return data
//     } catch (error) {
//       console.error(`MCP ${toolName} error:`, error)
//       throw error
//     }
//   }

//   async searchRepositories(params: MCPSearchParams): Promise<MCPSearchResult> {
//     return this.makeRequest("search_repositories", params)
//   }

//   async getRepositoryDetails(owner: string, repo: string): Promise<any> {
//     return this.makeRequest("get_repository_details", {
//       owner,
//       repo,
//       include_contribution_analysis: true,
//     })
//   }

//   async findBeginnerFriendlyRepos(params: {
//     language?: string
//     topic?: string
//     user_experience_level?:
//       | "complete_beginner"
//       | "some_experience"
//       | "intermediate"
//   }): Promise<any> {
//     return this.makeRequest("find_beginner_friendly_repos", params)
//   }

//   async analyzeUserGitHubProfile(username: string): Promise<MCPUserAnalysis> {
//     return this.makeRequest("analyze_user_github_profile", {
//       username,
//       include_repositories: true,
//       include_languages: true,
//     })
//   }

//   async getTrendingRepositories(
//     params: {
//       language?: string
//       since?: "daily" | "weekly" | "monthly"
//       limit?: number
//     } = {}
//   ): Promise<any> {
//     return this.makeRequest("get_trending_repositories", params)
//   }

//   async findSimilarRepositories(
//     owner: string,
//     repo: string,
//     criteria: string[] = ["language", "topics"]
//   ): Promise<any> {
//     return this.makeRequest("find_similar_repositories", {
//       owner,
//       repo,
//       similarity_criteria: criteria,
//     })
//   }
// }

// // Singleton instance
// export const remoteMCPClient = new RemoteMCPClient()

// // Helper function for server-side usage
// export async function withRemoteMCPClient<T>(
//   operation: (client: RemoteMCPClient) => Promise<T>
// ): Promise<T> {
//   try {
//     return await operation(remoteMCPClient)
//   } catch (error) {
//     console.error("Remote MCP operation failed:", error)
//     throw error
//   }
// }
