// src/lib/qloo/qloo-client.ts

import {
  QlooInsightsResponse,
  QlooHeatmapResponse,
  QlooBasicInsightsParams,
  QlooDemographicsParams,
  QlooTasteAnalysisParams,
  EnhancedUserProfile,
} from "./qloo-types"
import { mapTechToCulture, createCulturalProfile } from "./qloo-mapper"

export class QlooClient {
  private apiKey: string
  private baseUrl: string = "https://hackathon.api.qloo.com/v2"

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.QLOO_API_KEY || ""
    if (!this.apiKey) {
      console.warn("Qloo API key not configured - make sure QLOO_API_KEY environment variable is set")
    }
    console.log("Qloo API initialized with base URL:", this.baseUrl)
    console.log("API key configured:", !!this.apiKey)
  }

  private async request<T>(
    endpoint: string,
    params: Record<string, string>
  ): Promise<T> {
    try {
      const queryParams = new URLSearchParams()

      // Add all non-empty parameters to the query string
      Object.entries(params).forEach(([key, value]) => {
        if (value && value.trim() !== "") {
          queryParams.append(key, value)
        }
      })

      const url = `${this.baseUrl}/${endpoint}?${queryParams.toString()}`

      console.log("Making Qloo API request to:", url)
      console.log("Headers:", {
        "X-Api-Key": this.apiKey.substring(0, 10) + "...",
        "Content-Type": "application/json"
      })

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": this.apiKey,
        },
      })

      console.log("Qloo API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Qloo API error response:", errorText)
        throw new Error(
          `Qloo API error: ${response.status} ${response.statusText} - ${errorText}`
        )
      }

      const responseData = await response.json()
      console.log("Qloo API response received successfully")
      return responseData
    } catch (error) {
      console.error("Qloo API request failed:", error)
      throw error
    }
  }

  // Get basic insights based on interests
  async getBasicInsights(
    params: QlooBasicInsightsParams
  ): Promise<QlooInsightsResponse> {
    // Convert object params to string params
    const stringParams: Record<string, string> = {}
    
    if (params.filter?.type) stringParams["filter.type"] = params.filter.type
    if (params.filter?.parent_types) stringParams["filter.parent_types"] = Array.isArray(params.filter.parent_types) ? params.filter.parent_types.join(",") : params.filter.parent_types
    if (params.signal?.interests?.tags) stringParams["signal.interests.tags"] = Array.isArray(params.signal.interests.tags) ? params.signal.interests.tags.join(",") : params.signal.interests.tags
    if (params.limit) stringParams.take = String(params.limit)
    
    return this.request<QlooInsightsResponse>("insights", stringParams)
  }

  // Get demographic insights for interests
  async getDemographics(interests: string[]): Promise<QlooInsightsResponse> {
    const stringParams: Record<string, string> = {
      "filter.type": "urn:demographics",
      "signal.interests.tags": interests.join(",")
    }
    return this.request<QlooInsightsResponse>("insights", stringParams)
  }

  // Get taste analysis for user preferences
  async getTasteAnalysis(interests: string[]): Promise<QlooInsightsResponse> {
    const stringParams: Record<string, string> = {
      "filter.type": "urn:tag",
      "filter.tag.types": "technology,lifestyle,entertainment",
      "signal.interests.tags": interests.join(","),
      "take": "20"
    }
    return this.request<QlooInsightsResponse>("insights", stringParams)
  }

  // Get geographic heatmap for interests
  async getHeatmap(
    interests: string[],
    location?: {
      country?: string
      state?: string
    }
  ): Promise<QlooHeatmapResponse> {
    const stringParams: Record<string, string> = {
      "filter.type": "urn:heatmap",
      "signal.interests.tags": interests.join(",")
    }
    
    if (location?.country) {
      stringParams["filter.location.query"] = location.country
    }
    
    return this.request<QlooHeatmapResponse>("insights", stringParams)
  }

  // Enhanced user profiling with Qloo insights
  async enhanceUserProfile(githubData: {
    username: string
    languages: string[]
    topics: string[]
    bio?: string
    location?: string
    followers?: number
    publicRepos?: number
  }): Promise<EnhancedUserProfile> {
    try {
      // Create cultural profile from GitHub data
      const culturalProfile = createCulturalProfile({
        languages: githubData.languages,
        topics: githubData.topics,
        bio: githubData.bio,
        location: githubData.location,
      })

      // Get taste analysis
      const tasteAnalysis = await this.getTasteAnalysis(culturalProfile.tags)

      // Get demographic insights
      const demographics = await this.getDemographics(culturalProfile.tags)

      // Get related interests/affinities
      const affinities = await this.getBasicInsights({
        filter: {
          type: "urn:tag",
          parent_types: culturalProfile.entityTypes,
        },
        signal: {
          interests: {
            tags: culturalProfile.tags.slice(0, 10), // Limit to top 10 tags
          },
        },
        limit: 15,
      })

      return {
        technicalInterests: {
          languages: githubData.languages,
          frameworks: extractFrameworks(githubData.topics),
          domains: extractDomains(githubData.topics),
        },
        culturalProfile: {
          tags: tasteAnalysis.tags || [],
          demographics: demographics.demographics || [],
          affinities: affinities.entities || [],
        },
      }
    } catch (error) {
      console.error("Failed to enhance user profile with Qloo:", error)
      // Return basic profile without enhancements
      return {
        technicalInterests: {
          languages: githubData.languages,
          frameworks: extractFrameworks(githubData.topics),
          domains: extractDomains(githubData.topics),
        },
      }
    }
  }

  // Find culturally similar projects based on user profile
  async findCulturallySimilarProjects(
    userTags: string[],
    existingProjects: Array<{
      name: string
      topics: string[]
      language: string
    }>
  ) {
    try {
      // Get taste connections for user tags
      const tasteConnections = await this.getTasteAnalysis(userTags)

      // Score projects based on cultural alignment
      const scoredProjects = existingProjects.map(project => {
        const projectTags = mapTechToCulture([
          project.language,
          ...project.topics,
        ])

        // Calculate cultural alignment score
        const commonTags = projectTags.filter(
          tag =>
            userTags.includes(tag) ||
            tasteConnections.tags?.some(t => t.name === tag)
        )

        const culturalScore =
          commonTags.length / Math.max(projectTags.length, 1)

        return {
          ...project,
          culturalScore,
          culturalTags: projectTags,
          matchedTags: commonTags,
        }
      })

      // Sort by cultural alignment
      return scoredProjects.sort((a, b) => b.culturalScore - a.culturalScore)
    } catch (error) {
      console.error("Failed to find culturally similar projects:", error)
      return existingProjects
    }
  }
}

// Helper functions
function extractFrameworks(topics: string[]): string[] {
  const frameworkKeywords = [
    "react",
    "vue",
    "angular",
    "django",
    "flask",
    "express",
    "spring",
    "rails",
  ]
  return topics.filter(topic =>
    frameworkKeywords.some(fw => topic.toLowerCase().includes(fw))
  )
}

function extractDomains(topics: string[]): string[] {
  const domainKeywords = [
    "web",
    "mobile",
    "desktop",
    "cli",
    "api",
    "backend",
    "frontend",
    "fullstack",
    "devops",
    "ml",
    "ai",
    "blockchain",
  ]
  return topics.filter(topic =>
    domainKeywords.some(domain => topic.toLowerCase().includes(domain))
  )
}

// Export singleton instance
export const qlooClient = new QlooClient()
