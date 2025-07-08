// src/lib/llm.ts
import { anthropic } from "@ai-sdk/anthropic"
import { generateObject, generateText } from "ai"
import { z } from "zod"

// Types for structured responses
export const ProjectRecommendationSchema = z.object({
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
    })
  ),
  reasoning: z.string(),
})

export type ProjectRecommendation = z.infer<typeof ProjectRecommendationSchema>

// LLM Service class
export class LLMService {
  private getModel() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured")
    }
    return anthropic("claude-4-sonnet-20250514")
  }

  async generateProjectRecommendations(
    userQuery: string,
    userProfile: any
  ): Promise<ProjectRecommendation> {
    const prompt = `Based on the user query and profile, recommend 3-5 open-source projects that would be perfect matches.

User Query: "${userQuery}"

User Profile:
- GitHub: @${userProfile.githubUsername || "Unknown"}
- Bio: ${userProfile.bio || "Not provided"}
- Company: ${userProfile.company || "Not provided"}
- Location: ${userProfile.location || "Not provided"}
- Public Repos: ${userProfile.publicRepos || 0}
- Followers: ${userProfile.followers || 0}
- GitHub Member Since: ${userProfile.githubCreatedAt || "Unknown"}

Consider the user's experience level, interests, and preferred technologies. Focus on projects that:
1. Match their skill level and interests
2. Have active, welcoming communities
3. Offer good learning opportunities
4. Have clear contribution guidelines
5. Align with their stated preferences

For each project, provide:
- Accurate GitHub repository name (owner/repo format)
- Clear description of what the project does
- Programming languages used
- Relevant topics/tags
- Difficulty level for new contributors
- Specific explanation of why it's a good match
- Types of contributions they could make

Ensure all GitHub URLs are real and accessible.`

    try {
      const result = await generateObject({
        model: this.getModel(),
        prompt,
        schema: ProjectRecommendationSchema,
        temperature: 0.7,
      })

      return result.object
    } catch (error) {
      console.error("Error generating project recommendations:", error)
      throw new Error("Failed to generate recommendations")
    }
  }

  async analyzeUserIntent(message: string): Promise<{
    intent:
      | "project_search"
      | "general_question"
      | "contribution_help"
      | "other"
    technologies: string[]
    difficultyLevel: "beginner" | "intermediate" | "advanced" | "any"
    contributionTypes: string[]
  }> {
    const intentSchema = z.object({
      intent: z.enum([
        "project_search",
        "general_question",
        "contribution_help",
        "other",
      ]),
      technologies: z.array(z.string()),
      difficultyLevel: z.enum(["beginner", "intermediate", "advanced", "any"]),
      contributionTypes: z.array(z.string()),
    })

    try {
      const result = await generateObject({
        model: this.getModel(),
        prompt: `Analyze this user message and extract their intent and preferences:

Message: "${message}"

Determine:
1. Primary intent (what they want to accomplish)
2. Technologies/languages mentioned or implied
3. Difficulty level preference (beginner/intermediate/advanced/any)
4. Types of contributions they're interested in

Examples:
- "Find me a beginner React project" → intent: project_search, technologies: ["React"], difficulty: beginner
- "How do I contribute to open source?" → intent: contribution_help, technologies: [], difficulty: any
- "Show me Python data science projects" → intent: project_search, technologies: ["Python"], difficulty: any`,
        schema: intentSchema,
        temperature: 0.3,
      })

      return result.object
    } catch (error) {
      console.error("Error analyzing user intent:", error)
      return {
        intent: "other",
        technologies: [],
        difficultyLevel: "any",
        contributionTypes: [],
      }
    }
  }

  async generateSimpleResponse(
    message: string,
    context: string
  ): Promise<string> {
    try {
      const result = await generateText({
        model: this.getModel(),
        prompt: `${context}

User message: "${message}"

Provide a helpful, encouraging response focused on open-source contribution and project discovery.`,
        temperature: 0.7,
        maxTokens: 500,
      })

      return result.text
    } catch (error) {
      console.error("Error generating response:", error)
      throw new Error("Failed to generate response")
    }
  }
}

// Export singleton instance
export const llmService = new LLMService()
