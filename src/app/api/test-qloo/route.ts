// src/app/api/test-qloo/route.ts

import { NextRequest, NextResponse } from "next/server"
import { qlooClient } from "@/lib/qloo/qloo-client"

export async function GET(req: NextRequest) {
  try {
    console.log("Testing Qloo API connection...")

    // Test basic demographics API call
    const testTags = ["technology", "programming", "data-science"]
    
    console.log("Testing getDemographics with tags:", testTags)
    const demographics = await qlooClient.getDemographics(testTags)
    
    console.log("Demographics response:", demographics)

    // Test taste analysis
    console.log("Testing getTasteAnalysis with tags:", testTags)
    const tasteAnalysis = await qlooClient.getTasteAnalysis(testTags)
    
    console.log("Taste analysis response:", tasteAnalysis)

    return NextResponse.json({
      success: true,
      message: "Qloo API is working correctly",
      tests: {
        demographics: {
          success: true,
          data: demographics,
          count: demographics.demographics?.length || 0
        },
        tasteAnalysis: {
          success: true,
          data: tasteAnalysis,
          count: tasteAnalysis.tags?.length || 0
        }
      }
    })

  } catch (error) {
    console.error("Qloo API test failed:", error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      configured: !!process.env.QLOO_API_KEY,
      apiKeyPresent: !!process.env.QLOO_API_KEY,
      baseUrl: process.env.QLOO_API_URL || "https://hackathon.api.qloo.com"
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { tags } = await req.json()
    
    if (!tags || !Array.isArray(tags)) {
      return NextResponse.json({
        error: "Please provide an array of tags to test"
      }, { status: 400 })
    }

    console.log("Testing Qloo API with custom tags:", tags)

    const [demographics, tasteAnalysis] = await Promise.allSettled([
      qlooClient.getDemographics(tags),
      qlooClient.getTasteAnalysis(tags)
    ])

    return NextResponse.json({
      success: true,
      message: "Qloo API test completed",
      results: {
        demographics: {
          status: demographics.status,
          data: demographics.status === 'fulfilled' ? demographics.value : null,
          error: demographics.status === 'rejected' ? demographics.reason.message : null
        },
        tasteAnalysis: {
          status: tasteAnalysis.status,
          data: tasteAnalysis.status === 'fulfilled' ? tasteAnalysis.value : null,
          error: tasteAnalysis.status === 'rejected' ? tasteAnalysis.reason.message : null
        }
      }
    })

  } catch (error) {
    console.error("Qloo API custom test failed:", error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}