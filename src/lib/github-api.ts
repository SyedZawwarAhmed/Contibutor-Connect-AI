// lib/github-api.ts
export interface GitHubUser {
  login: string
  id: number
  avatar_url: string
  name: string
  company: string
  blog: string
  location: string
  email: string
  bio: string
  public_repos: number
  public_gists: number
  followers: number
  following: number
  created_at: string
  updated_at: string
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string
  html_url: string
  language: string
  stargazers_count: number
  forks_count: number
  topics: string[]
  created_at: string
  updated_at: string
  pushed_at: string
}

export async function fetchGitHubUser(
  username: string
): Promise<GitHubUser | null> {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        // Add GitHub token for higher rate limits if needed
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
      },
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching GitHub user:", error)
    return null
  }
}

export async function fetchGitHubRepos(
  username: string,
  page = 1,
  per_page = 10
): Promise<GitHubRepo[]> {
  try {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?page=${page}&per_page=${per_page}&sort=updated`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",

          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching GitHub repos:", error)
    return []
  }
}

export async function fetchGitHubUserLanguages(
  username: string
): Promise<Record<string, number>> {
  try {
    const repos = await fetchGitHubRepos(username, 1, 100)
    const languageStats: Record<string, number> = {}

    for (const repo of repos) {
      if (repo.language) {
        languageStats[repo.language] = (languageStats[repo.language] || 0) + 1
      }
    }

    return languageStats
  } catch (error) {
    console.error("Error fetching GitHub user languages:", error)
    return {}
  }
}
