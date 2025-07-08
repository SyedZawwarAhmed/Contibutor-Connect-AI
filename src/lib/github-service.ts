// src/lib/github-service.ts
export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  clone_url: string
  homepage: string | null
  language: string | null
  languages_url: string
  topics: string[]
  stargazers_count: number
  watchers_count: number
  forks_count: number
  open_issues_count: number
  created_at: string
  updated_at: string
  pushed_at: string
  size: number
  default_branch: string
  has_issues: boolean
  has_projects: boolean
  has_wiki: boolean
  has_pages: boolean
  archived: boolean
  disabled: boolean
  license: {
    key: string
    name: string
    spdx_id: string
  } | null
  owner: {
    login: string
    id: number
    avatar_url: string
    html_url: string
    type: string
  }
}

export interface GitHubSearchResult {
  total_count: number
  incomplete_results: boolean
  items: GitHubRepository[]
}

export interface GitHubUser {
  login: string
  id: number
  avatar_url: string
  html_url: string
  name: string | null
  company: string | null
  blog: string | null
  location: string | null
  email: string | null
  bio: string | null
  public_repos: number
  public_gists: number
  followers: number
  following: number
  created_at: string
  updated_at: string
}

export interface RepositoryLanguages {
  [language: string]: number
}

export interface ContributionMetrics {
  hasGoodFirstIssues: boolean
  hasHelpWantedIssues: boolean
  hasContributingGuide: boolean
  hasCodeOfConduct: boolean
  recentActivity: boolean
  issueResponseTime: "fast" | "medium" | "slow" | "unknown"
  maintainerActivity: boolean
}

export class GitHubService {
  private readonly baseURL = "https://api.github.com"
  private readonly token: string | undefined

  constructor() {
    this.token = process.env.GITHUB_TOKEN || process.env.GITHUB_API_TOKEN
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "ContributorConnect-AI/1.0",
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

  // Search repositories with advanced filters
  async searchRepositories(params: {
    query: string
    language?: string
    sort?: "stars" | "forks" | "help-wanted-issues" | "updated"
    order?: "desc" | "asc"
    per_page?: number
    page?: number
  }): Promise<GitHubSearchResult> {
    const {
      query,
      language,
      sort = "stars",
      order = "desc",
      per_page = 30,
      page = 1,
    } = params

    let searchQuery = query

    // Add language filter
    if (language) {
      searchQuery += ` language:${language}`
    }

    // Add common filters for good open source projects
    searchQuery += " is:public archived:false"

    const queryParams = new URLSearchParams({
      q: searchQuery,
      sort,
      order,
      per_page: per_page.toString(),
      page: page.toString(),
    })

    return this.makeRequest<GitHubSearchResult>(
      `/search/repositories?${queryParams}`
    )
  }

  // Search for beginner-friendly repositories
  async searchBeginnerFriendlyRepos(params: {
    language?: string
    topic?: string
    per_page?: number
  }): Promise<GitHubSearchResult> {
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

  // Get detailed repository information
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    return this.makeRequest<GitHubRepository>(`/repos/${owner}/${repo}`)
  }

  // Get repository languages
  async getRepositoryLanguages(
    owner: string,
    repo: string
  ): Promise<RepositoryLanguages> {
    return this.makeRequest<RepositoryLanguages>(
      `/repos/${owner}/${repo}/languages`
    )
  }

  // Get repository topics
  async getRepositoryTopics(
    owner: string,
    repo: string
  ): Promise<{ names: string[] }> {
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

  // Analyze repository for contribution friendliness
  async analyzeContributionMetrics(
    owner: string,
    repo: string
  ): Promise<ContributionMetrics> {
    try {
      const [repoData, issues, contents, releases] = await Promise.allSettled([
        this.getRepository(owner, repo),
        this.makeRequest(
          `/repos/${owner}/${repo}/issues?labels=good%20first%20issue,help%20wanted&state=open&per_page=10`
        ),
        this.makeRequest(`/repos/${owner}/${repo}/contents`),
        this.makeRequest(`/repos/${owner}/${repo}/releases?per_page=5`),
      ])

      const repo_data = repoData.status === "fulfilled" ? repoData.value : null
      const issue_data = issues.status === "fulfilled" ? issues.value : []
      const content_data = contents.status === "fulfilled" ? contents.value : []

      // Check for beginner-friendly labels
      const hasGoodFirstIssues =
        Array.isArray(issue_data) &&
        issue_data.some((issue: any) =>
          issue.labels?.some(
            (label: any) =>
              label.name.toLowerCase().includes("good first issue") ||
              label.name.toLowerCase().includes("good-first-issue")
          )
        )

      const hasHelpWantedIssues =
        Array.isArray(issue_data) &&
        issue_data.some((issue: any) =>
          issue.labels?.some(
            (label: any) =>
              label.name.toLowerCase().includes("help wanted") ||
              label.name.toLowerCase().includes("help-wanted")
          )
        )

      // Check for contribution guides
      const hasContributingGuide =
        Array.isArray(content_data) &&
        content_data.some(
          (file: any) =>
            file.name?.toLowerCase().includes("contributing") ||
            file.name?.toLowerCase() === "contributing.md"
        )

      const hasCodeOfConduct =
        Array.isArray(content_data) &&
        content_data.some(
          (file: any) =>
            file.name?.toLowerCase().includes("code_of_conduct") ||
            file.name?.toLowerCase().includes("code-of-conduct")
        )

      // Check recent activity (updated within last 30 days)
      const recentActivity = repo_data
        ? new Date(repo_data.pushed_at) >
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        : false

      return {
        hasGoodFirstIssues,
        hasHelpWantedIssues,
        hasContributingGuide,
        hasCodeOfConduct,
        recentActivity,
        issueResponseTime: "unknown", // Would need more complex analysis
        maintainerActivity: recentActivity,
      }
    } catch (error) {
      console.error("Error analyzing contribution metrics:", error)
      return {
        hasGoodFirstIssues: false,
        hasHelpWantedIssues: false,
        hasContributingGuide: false,
        hasCodeOfConduct: false,
        recentActivity: false,
        issueResponseTime: "unknown",
        maintainerActivity: false,
      }
    }
  }

  // Get user's repositories
  async getUserRepositories(
    username: string,
    per_page = 30
  ): Promise<GitHubRepository[]> {
    return this.makeRequest<GitHubRepository[]>(
      `/users/${username}/repos?sort=updated&per_page=${per_page}`
    )
  }

  // Get user profile
  async getUser(username: string): Promise<GitHubUser> {
    return this.makeRequest<GitHubUser>(`/users/${username}`)
  }

  // Get user's primary languages based on repositories
  async getUserLanguages(username: string): Promise<Record<string, number>> {
    try {
      const repos = await this.getUserRepositories(username, 100)
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

  // Get trending repositories
  async getTrendingRepositories(
    params: {
      language?: string
      since?: "daily" | "weekly" | "monthly"
      per_page?: number
    } = {}
  ): Promise<GitHubSearchResult> {
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

// Export singleton instance
export const githubService = new GitHubService()
