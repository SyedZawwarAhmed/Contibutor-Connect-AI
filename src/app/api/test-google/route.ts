// src/app/api/test-google/route.ts
import { NextRequest, NextResponse } from "next/server"
import { google } from "@ai-sdk/google"
import { generateText } from "ai"

export async function GET(req: NextRequest) {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        {
          error: "GOOGLE_GENERATIVE_AI_API_KEY is not configured",
          configured: false,
        },
        { status: 500 }
      )
    }

    // Test simple text generation
    const result = await generateText({
      model: google("gemini-2.0-flash"),
      prompt: "Say hello and confirm you are working correctly. Keep it brief.",
      maxTokens: 100,
    })

    return NextResponse.json({
      success: true,
      message: "Google API is working correctly",
      response: result.text,
      configured: true,
    })
  } catch (error) {
    console.error("Google test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        configured: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        {
          error: "GOOGLE_GENERATIVE_AI_API_KEY is not configured",
        },
        { status: 500 }
      )
    }

    const result = await generateText({
      model: google("gemini-2.0-flash"),
      prompt: message || "Hello, please respond to confirm you're working.",
      maxTokens: 200,
    })

    return NextResponse.json({
      success: true,
      response: result.text,
    })
  } catch (error) {
    console.error("Google test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
