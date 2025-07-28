// src/app/api/recommendations/route.ts
import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { llmService } from "@/lib/llm"

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      query,
      technologies = [],
      difficulty = "any",
      contributionTypes = [],
    } = await req.json()

    // Get user's GitHub profile data
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

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Build enhanced user profile with filters
    const enhancedProfile = {
      ...user,
      preferredTechnologies: technologies,
      difficultyLevel: difficulty,
      contributionTypes,
    }

    // Generate project recommendations
    const recommendations = await llmService.generateProjectRecommendations(
      query,
      enhancedProfile
    )

    return NextResponse.json({
      success: true,
      data: recommendations,
      metadata: {
        userId: session.user.id,
        query,
        filters: {
          technologies,
          difficulty,
          contributionTypes,
        },
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Recommendations API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate recommendations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// GET endpoint for quick recommendations based on user profile
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)

    // Get user's GitHub profile data
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

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Generate general recommendations based on user profile
    const query = `Based on my GitHub profile, recommend some interesting open-source projects I could contribute to. Consider my experience level and background.`

    const recommendations = await llmService.generateProjectRecommendations(
      query,
      user
    )

    return NextResponse.json({
      success: true,
      data: recommendations,
      metadata: {
        userId: session.user.id,
        type: "profile-based",
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("GET Recommendations API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate profile-based recommendations",
      },
      { status: 500 }
    )
  }
}
