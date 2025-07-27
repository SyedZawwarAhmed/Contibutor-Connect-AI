// src/app/api/recommendations/qloo-enhanced/route.test.ts

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "./route"

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "test-user-id" },
  }),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn().mockResolvedValue({
        githubUsername: "testuser",
        bio: "Python developer interested in AI and data science",
        location: "San Francisco, CA",
        company: "Tech Corp",
        publicRepos: 25,
        followers: 150,
      }),
    },
  },
}))

vi.mock("@/lib/llm", () => ({
  llmService: {
    generateProjectRecommendations: vi.fn().mockResolvedValue({
      projects: [
        {
          name: "scikit-learn",
          description: "Machine learning library for Python",
          githubUrl: "https://github.com/scikit-learn/scikit-learn",
          languages: ["Python"],
          topics: ["machine-learning", "data-science", "python"],
          stars: 58000,
          difficulty: "intermediate",
          explanation: "Perfect for your Python and ML interests",
          contributionTypes: ["bug-fixes", "documentation", "features"],
        },
        {
          name: "tensorflow",
          description: "Open source machine learning framework",
          githubUrl: "https://github.com/tensorflow/tensorflow",
          languages: ["Python", "C++"],
          topics: ["machine-learning", "deep-learning", "ai"],
          stars: 180000,
          difficulty: "advanced",
          explanation: "Great for advancing your AI knowledge",
          contributionTypes: ["research", "optimization", "documentation"],
        },
      ],
      reasoning:
        "These projects align with your Python expertise and data science interests while offering different complexity levels for contribution.",
    }),
  },
}))

vi.mock("@/lib/mcp-client-remote", () => ({
  withRemoteMCPClient: vi.fn().mockImplementation(async callback => {
    return await callback({
      analyzeUserGitHubProfile: vi.fn().mockResolvedValue({
        technical_profile: {
          primary_languages: {
            Python: 45,
            JavaScript: 30,
            TypeScript: 25,
          },
        },
        experience_indicators: {
          experience_level: "intermediate",
        },
      }),
      searchRepositories: vi.fn().mockResolvedValue({
        total_found: 150,
        repositories: [
          {
            name: "pandas",
            description: "Data analysis library",
            language: "Python",
            topics: ["data-analysis", "pandas", "python"],
            stars: 42000,
            url: "https://github.com/pandas-dev/pandas",
          },
          {
            name: "numpy",
            description: "Numerical computing library",
            language: "Python",
            topics: ["scientific-computing", "numpy", "python"],
            stars: 26000,
            url: "https://github.com/numpy/numpy",
          },
        ],
      }),
    })
  }),
}))

vi.mock("@/lib/qloo/qloo-client", () => ({
  qlooClient: {
    enhanceUserProfile: vi.fn().mockResolvedValue({
      technicalInterests: {
        languages: ["Python", "JavaScript"],
        frameworks: ["django", "react"],
        domains: ["data-science", "web-development"],
      },
      culturalProfile: {
        tags: [
          { name: "data-science", popularity: 0.8 },
          { name: "research", popularity: 0.7 },
          { name: "academic", popularity: 0.6 },
        ],
        demographics: [
          {
            age_group: "25-34",
            gender: "Male",
            affinity_score: 0.85,
          },
          {
            age_group: "25-34",
            gender: "Female",
            affinity_score: 0.75,
          },
        ],
        affinities: [
          { name: "machine-learning", type: "technology" },
          { name: "open-source", type: "community" },
        ],
      },
    }),
    getDemographics: vi.fn().mockResolvedValue({
      demographics: [
        {
          age_group: "25-34",
          gender: "Male",
          affinity_score: 0.85,
          population_percentage: 0.32,
        },
        {
          age_group: "35-44",
          gender: "Male",
          affinity_score: 0.78,
          population_percentage: 0.28,
        },
      ],
    }),
    getTasteAnalysis: vi.fn().mockResolvedValue({
      tags: [
        { name: "artificial-intelligence", popularity: 0.9 },
        { name: "data-visualization", popularity: 0.7 },
        { name: "automation", popularity: 0.6 },
        { name: "research", popularity: 0.8 },
      ],
    }),
    findCulturallySimilarProjects: vi.fn().mockResolvedValue([
      {
        name: "pandas",
        topics: ["data-analysis", "pandas", "python"],
        language: "Python",
        culturalScore: 0.92,
        culturalTags: ["data-science", "research", "academic"],
        matchedTags: ["data-science", "research"],
      },
      {
        name: "numpy",
        topics: ["scientific-computing", "numpy", "python"],
        language: "Python",
        culturalScore: 0.87,
        culturalTags: ["data-science", "academic", "scientific"],
        matchedTags: ["data-science", "academic"],
      },
    ]),
  },
}))

vi.mock("@/lib/qloo/qloo-mapper", () => ({
  mapTechToCulture: vi
    .fn()
    .mockReturnValue([
      "data-science",
      "research",
      "academic",
      "ai",
      "automation",
    ]),
}))

describe("/api/recommendations/qloo-enhanced", () => {
  beforeAll(() => {
    // Set up environment variables
    process.env.QLOO_API_KEY = "test-qloo-api-key"
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-google-api-key"
  })

  afterAll(() => {
    vi.clearAllMocks()
  })

  it("should return successful Qloo-enhanced recommendations", async () => {
    const requestBody = {
      query: "Find me Python data science projects for intermediate developers",
      use_qloo: true,
    }

    const request = new NextRequest(
      "http://localhost:3000/api/recommendations/qloo-enhanced",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    const response = await POST(request)
    const data = await response.json()

    // Test response structure
    expect(response.status).toBe(200)
    expect(data).toHaveProperty("success", true)
    expect(data).toHaveProperty("data")
    expect(data).toHaveProperty("metadata")
    expect(data).toHaveProperty("qloo_insights")
  })

  it("should return proper project recommendation structure", async () => {
    const requestBody = {
      query: "Show me beginner-friendly React projects",
      use_qloo: true,
    }

    const request = new NextRequest(
      "http://localhost:3000/api/recommendations/qloo-enhanced",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    const response = await POST(request)
    const data = await response.json()

    // Test project structure
    expect(data.data).toHaveProperty("projects")
    expect(Array.isArray(data.data.projects)).toBe(true)

    if (data.data.projects.length > 0) {
      const project = data.data.projects[0]
      expect(project).toHaveProperty("name")
      expect(project).toHaveProperty("description")
      expect(project).toHaveProperty("githubUrl")
      expect(project).toHaveProperty("languages")
      expect(project).toHaveProperty("topics")
      expect(project).toHaveProperty("difficulty")
      expect(project).toHaveProperty("explanation")
      expect(project).toHaveProperty("contributionTypes")

      // Validate GitHub URL format
      expect(project.githubUrl).toMatch(
        /^https:\/\/github\.com\/[\w-]+\/[\w.-]+$/
      )

      // Validate difficulty enum
      expect(["beginner", "intermediate", "advanced"]).toContain(
        project.difficulty
      )
    }
  })

  it("should return proper Qloo metadata when insights are used", async () => {
    const requestBody = {
      query: "Find me machine learning projects",
      use_qloo: true,
    }

    const request = new NextRequest(
      "http://localhost:3000/api/recommendations/qloo-enhanced",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    const response = await POST(request)
    const data = await response.json()

    // Test Qloo metadata structure
    expect(data.metadata).toHaveProperty("qloo_insights_used")
    expect(data.metadata).toHaveProperty("cultural_tags_identified")
    expect(data.metadata).toHaveProperty("demographics_analyzed")
    expect(data.metadata).toHaveProperty("cultural_scoring_applied")
    expect(data.metadata).toHaveProperty("total_projects_analyzed")

    // When Qloo is enabled, these should be true/positive
    expect(data.metadata.qloo_insights_used).toBe(true)
    expect(typeof data.metadata.cultural_tags_identified).toBe("number")
    expect(data.metadata.cultural_tags_identified).toBeGreaterThan(0)
  })

  it("should return proper Qloo insights structure", async () => {
    const requestBody = {
      query: "Python AI projects for research",
      use_qloo: true,
    }

    const request = new NextRequest(
      "http://localhost:3000/api/recommendations/qloo-enhanced",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    const response = await POST(request)
    const data = await response.json()

    // Test Qloo insights structure
    expect(data.qloo_insights).toBeDefined()
    expect(data.qloo_insights).toHaveProperty("culturalProfile")
    expect(data.qloo_insights).toHaveProperty("demographics")
    expect(data.qloo_insights).toHaveProperty("relatedInterests")
    expect(data.qloo_insights).toHaveProperty("culturalTags")

    // Test cultural tags
    expect(Array.isArray(data.qloo_insights.culturalTags)).toBe(true)
    expect(data.qloo_insights.culturalTags.length).toBeGreaterThan(0)

    // Test demographics structure
    if (data.qloo_insights.demographics.length > 0) {
      const demo = data.qloo_insights.demographics[0]
      expect(demo).toHaveProperty("age_group")
      expect(demo).toHaveProperty("gender")
      expect(demo).toHaveProperty("affinity_score")
      expect(typeof demo.affinity_score).toBe("number")
      expect(demo.affinity_score).toBeGreaterThanOrEqual(0)
      expect(demo.affinity_score).toBeLessThanOrEqual(1)
    }

    // Test related interests structure
    if (data.qloo_insights.relatedInterests.length > 0) {
      const interest = data.qloo_insights.relatedInterests[0]
      expect(interest).toHaveProperty("name")
      expect(typeof interest.name).toBe("string")
    }
  })

  it("should handle requests when Qloo is disabled", async () => {
    const requestBody = {
      query: "Find me JavaScript projects",
      use_qloo: false,
    }

    const request = new NextRequest(
      "http://localhost:3000/api/recommendations/qloo-enhanced",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    const response = await POST(request)
    const data = await response.json()

    // Should still succeed but without Qloo insights
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.metadata.qloo_insights_used).toBe(false)
    expect(data.qloo_insights).toBeNull()
  })

  it("should return 401 for unauthenticated requests", async () => {
    // Mock auth to return null
    vi.mocked(require("@/lib/auth").auth).mockResolvedValueOnce(null)

    const requestBody = {
      query: "Find me projects",
      use_qloo: true,
    }

    const request = new NextRequest(
      "http://localhost:3000/api/recommendations/qloo-enhanced",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    const response = await POST(request)

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data).toHaveProperty("error", "Unauthorized")
  })

  it("should return 400 when user has no GitHub username", async () => {
    // Mock prisma to return user without GitHub username
    vi.mocked(
      require("@/lib/prisma").prisma.user.findUnique
    ).mockResolvedValueOnce({
      githubUsername: null,
      bio: null,
      location: null,
    })

    const requestBody = {
      query: "Find me projects",
      use_qloo: true,
    }

    const request = new NextRequest(
      "http://localhost:3000/api/recommendations/qloo-enhanced",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data).toHaveProperty("error", "GitHub profile not found")
  })

  it("should handle Qloo API failures gracefully", async () => {
    // Mock Qloo client to throw errors
    vi.mocked(
      require("@/lib/qloo/qloo-client").qlooClient.enhanceUserProfile
    ).mockRejectedValueOnce(new Error("Qloo API unavailable"))

    const requestBody = {
      query: "Find me Python projects",
      use_qloo: true,
    }

    const request = new NextRequest(
      "http://localhost:3000/api/recommendations/qloo-enhanced",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    const response = await POST(request)
    const data = await response.json()

    // Should still succeed with fallback
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.metadata.qloo_insights_used).toBe(false)
  })

  it("should extract and map technical terms from query correctly", async () => {
    const requestBody = {
      query:
        "Find me React TypeScript projects with Docker and Kubernetes for frontend development",
      use_qloo: true,
    }

    const request = new NextRequest(
      "http://localhost:3000/api/recommendations/qloo-enhanced",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    const response = await POST(request)
    const data = await response.json()

    // Should successfully process technical terms
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    // Verify mapTechToCulture was called (mocked)
    const mapTechToCulture = vi.mocked(
      require("@/lib/qloo/qloo-mapper").mapTechToCulture
    )
    expect(mapTechToCulture).toHaveBeenCalled()
  })
})

// Integration test with sample expected response
export const SAMPLE_QLOO_ENHANCED_RESPONSE = {
  success: true,
  data: {
    projects: [
      {
        name: "scikit-learn",
        description: "Machine learning library for Python",
        githubUrl: "https://github.com/scikit-learn/scikit-learn",
        languages: ["Python"],
        topics: ["machine-learning", "data-science", "python"],
        stars: 58000,
        difficulty: "intermediate",
        explanation:
          "Perfect match for your Python and data science interests. Strong community support for new contributors.",
        contributionTypes: ["bug-fixes", "documentation", "features"],
      },
    ],
    reasoning:
      "These recommendations combine your technical Python skills with your cultural interest in data science and research, ensuring both technical and social fit.",
  },
  metadata: {
    qloo_insights_used: true,
    cultural_tags_identified: 5,
    demographics_analyzed: true,
    cultural_scoring_applied: true,
    total_projects_analyzed: 150,
  },
  qloo_insights: {
    culturalTags: ["data-science", "research", "academic", "ai", "automation"],
    demographics: [
      {
        age_group: "25-34",
        gender: "Male",
        affinity_score: 0.85,
      },
    ],
    relatedInterests: [
      { name: "artificial-intelligence" },
      { name: "data-visualization" },
      { name: "automation" },
      { name: "research" },
    ],
  },
} as const

export type QlooEnhancedResponse = typeof SAMPLE_QLOO_ENHANCED_RESPONSE
