// src/app/api/chat/route.ts (Enhanced Version)
import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { streamText } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { prisma } from "@/lib/prisma"
import { llmService } from "@/lib/llm"

// Configure Claude model
const getModel = () => {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured")
  }
  return anthropic("claude-3-5-sonnet-20241022")
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messages, structured = false } = await req.json()
    const lastMessage = messages[messages.length - 1]?.content || ""

    // Get user's GitHub profile data for context
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

    // Analyze user intent to determine response type
    const intent = await llmService.analyzeUserIntent(lastMessage)

    // If user is asking for project recommendations, use structured generation
    if (intent.intent === "project_search" && structured) {
      try {
        const recommendations = await llmService.generateProjectRecommendations(
          lastMessage,
          user
        )

        return NextResponse.json({
          type: "structured",
          data: recommendations,
        })
      } catch (error) {
        console.error(
          "Structured generation failed, falling back to streaming:",
          error
        )
        // Fall back to normal streaming
      }
    }

    // Build system prompt with user context
    const systemPrompt = `You are ContributorConnect AI, an intelligent assistant that helps developers discover open-source projects perfect for their skills and interests.

User Profile Context:
${user?.githubUsername ? `- GitHub: @${user.githubUsername}` : ""}
${user?.bio ? `- Bio: ${user.bio}` : ""}
${user?.company ? `- Company: ${user.company}` : ""}
${user?.location ? `- Location: ${user.location}` : ""}
${user?.publicRepos ? `- Public Repositories: ${user.publicRepos}` : ""}
${user?.followers ? `- Followers: ${user.followers}` : ""}
${user?.githubCreatedAt ? `- GitHub Member Since: ${user.githubCreatedAt}` : ""}

Detected Intent: ${intent.intent}
Technologies of Interest: ${intent.technologies.join(", ") || "None specified"}
Preferred Difficulty: ${intent.difficultyLevel}

Your main responsibilities:
1. **Project Discovery**: Help users find open-source projects that match their skills, interests, and contribution preferences
2. **Skill Assessment**: Analyze user requests to understand their technical background and learning goals
3. **Community Matching**: Recommend projects with welcoming communities that actively support new contributors
4. **Contribution Guidance**: Provide specific advice on how to get started with contributions

When recommending projects, always provide:
- Specific project names in owner/repo format (e.g., facebook/react)
- Clear descriptions of what each project does
- Programming languages and technologies used
- Why each project is a good match for the user
- Suggested ways to start contributing
- Difficulty level for new contributors

Be encouraging, helpful, and focus on building confidence in open-source contribution. Use a conversational tone while being informative.`

    // Create the AI stream
    const result = await streamText({
      model: getModel(),
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.7,
      maxTokens: 1000,
    })

    // Return the streaming response
    // return result.toAIStreamResponse()
    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
