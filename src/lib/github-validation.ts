// src/lib/github-validation.ts
export interface GitHubUrlValidation {
  isValid: boolean
  exists: boolean
  owner?: string
  repo?: string
  error?: string
}

/**
 * Validates GitHub repository URL format and checks if repository exists
 */
export async function validateGitHubUrl(url: string): Promise<GitHubUrlValidation> {
  try {
    // Validate URL format
    const githubRegex = /^https:\/\/github\.com\/([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)\/?$/
    const match = url.match(githubRegex)
    
    if (!match) {
      return {
        isValid: false,
        exists: false,
        error: "Invalid GitHub URL format. Expected: https://github.com/owner/repo"
      }
    }

    const [, owner, repo] = match
    
    // Check if repository exists using GitHub API
    const exists = await checkRepositoryExists(owner, repo)
    
    return {
      isValid: true,
      exists,
      owner,
      repo,
      error: exists ? undefined : "Repository not found or private"
    }
  } catch (error) {
    return {
      isValid: false,
      exists: false,
      error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Checks if a GitHub repository exists and is publicly accessible
 */
async function checkRepositoryExists(owner: string, repo: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      method: 'HEAD',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ContributorConnect-AI'
      }
    })
    
    return response.status === 200
  } catch (error) {
    console.warn(`GitHub validation failed for ${owner}/${repo}:`, error)
    return false
  }
}

/**
 * Validates multiple GitHub URLs in parallel
 */
export async function validateGitHubUrls(urls: string[]): Promise<GitHubUrlValidation[]> {
  const validationPromises = urls.map(url => validateGitHubUrl(url))
  return Promise.all(validationPromises)
}

/**
 * Extracts and validates GitHub URLs from text content
 */
export async function extractAndValidateGitHubUrls(text: string): Promise<{
  validUrls: string[]
  invalidUrls: string[]
  validationResults: GitHubUrlValidation[]
}> {
  // Extract all GitHub URLs from text
  const githubUrlRegex = /https:\/\/github\.com\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+/g
  const urls = text.match(githubUrlRegex) || []
  
  if (urls.length === 0) {
    return {
      validUrls: [],
      invalidUrls: [],
      validationResults: []
    }
  }

  // Remove duplicates
  const uniqueUrls = [...new Set(urls)]
  
  // Validate all URLs
  const validationResults = await validateGitHubUrls(uniqueUrls)
  
  const validUrls: string[] = []
  const invalidUrls: string[] = []
  
  validationResults.forEach((result, index) => {
    if (result.isValid && result.exists) {
      validUrls.push(uniqueUrls[index])
    } else {
      invalidUrls.push(uniqueUrls[index])
    }
  })
  
  return {
    validUrls,
    invalidUrls,
    validationResults
  }
}