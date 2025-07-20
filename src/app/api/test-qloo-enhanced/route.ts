// Test endpoint for Qloo-enhanced recommendations without authentication
import { NextRequest, NextResponse } from "next/server"
import { qlooClient } from "@/lib/qloo/qloo-client"
import { mapTechToCulture, extractQlooUrns } from "@/lib/qloo/qloo-mapper"

export async function POST(req: NextRequest) {
  try {
    const { query = "Find me Python data science projects" } = await req.json()

    console.log("Testing Qloo-enhanced recommendations flow...")

    // Simulate a user profile (like what would come from GitHub OAuth)
    const mockUser = {
      githubUsername: "test-user",
      bio: "Data scientist passionate about machine learning and open source",
      location: "San Francisco, CA",
      company: "Tech Startup",
      publicRepos: 42,
      followers: 180,
    }

    // Simulate GitHub data (languages and topics from user's repos)
    const mockGithubData = {
      languages: ["Python", "JavaScript", "TypeScript", "R"],
      topics: ["machine-learning", "data-science", "web-development", "neural-networks", "visualization"],
    }

    console.log("1. Testing cultural profile mapping...")
    
    // Map technical interests to cultural tags
    const culturalTags = mapTechToCulture([
      ...mockGithubData.languages,
      ...mockGithubData.topics,
    ])
    
    console.log("Cultural tags mapped:", culturalTags.slice(0, 10))

    console.log("2. Testing Qloo API calls...")

    // Extract Qloo-compatible URN tags from the tech interests
    const extractedQlooUrns = extractQlooUrns([
      ...mockGithubData.languages,
      ...mockGithubData.topics
    ])
    
    // Combine extracted URNs with some known working ones
    const qlooCompatibleTags = [...extractedQlooUrns, 
      "urn:tag:genre:media:documentary",  // For research/academic interests
      "urn:tag:genre:media:sci_fi",      // For technology interests  
      "urn:tag:keyword:media:technology", // For tech interests
      "urn:tag:keyword:media:science",    // For data science
      "urn:tag:keyword:media:education"   // For learning/academic
    ].slice(0, 8) // Limit to 8 tags for API efficiency

    // Test Qloo insights
    let qlooInsights: any = {}

    try {
      console.log("Using Qloo-compatible URN tags:", qlooCompatibleTags)
      
      // Get demographics for the Qloo-compatible tags
      const demographics = await qlooClient.getDemographics(qlooCompatibleTags)
      console.log("Demographics result:", demographics.success ? "✅ Success" : "❌ Failed")
      console.log("Demographics count:", demographics.results?.demographics?.length || 0)
      
      // Get taste analysis
      const tasteAnalysis = await qlooClient.getTasteAnalysis(qlooCompatibleTags)
      console.log("Taste analysis result:", tasteAnalysis.success ? "✅ Success" : "❌ Failed")
      console.log("Taste analysis count:", tasteAnalysis.results?.tags?.length || 0)

      // Enhanced user profile
      const enhancedProfile = await qlooClient.enhanceUserProfile({
        username: mockUser.githubUsername,
        languages: mockGithubData.languages,
        topics: mockGithubData.topics,
        bio: mockUser.bio,
        location: mockUser.location,
        followers: mockUser.followers,
        publicRepos: mockUser.publicRepos,
      })

      qlooInsights = {
        culturalProfile: enhancedProfile.culturalProfile,
        demographics: demographics.results?.demographics || [],
        relatedInterests: tasteAnalysis.results?.tags || [],
        culturalTags: culturalTags.slice(0, 10),
        qlooCompatibleTags: qlooCompatibleTags,
        rawDemographicsResponse: demographics.results,
        rawTasteResponse: tasteAnalysis.results,
      }

      console.log("3. Qloo insights summary:")
      console.log("- Cultural tags:", qlooInsights.culturalTags.length)
      console.log("- Demographics data:", qlooInsights.demographics.length)
      console.log("- Related interests:", qlooInsights.relatedInterests.length)

    } catch (error) {
      console.error("Qloo API error:", error)
      qlooInsights.error = error instanceof Error ? error.message : "Unknown error"
    }

    // Simulate project recommendations enhanced with cultural scoring
    const mockProjects = [
      {
        name: "scikit-learn",
        language: "Python",
        topics: ["machine-learning", "data-science", "algorithms"],
        stars: 58000,
        description: "Machine learning library for Python"
      },
      {
        name: "pandas",
        language: "Python", 
        topics: ["data-analysis", "data-science", "dataframes"],
        stars: 40000,
        description: "Data manipulation and analysis library"
      },
      {
        name: "matplotlib",
        language: "Python",
        topics: ["visualization", "plotting", "data-science"],
        stars: 18000,
        description: "Plotting library for Python"
      }
    ]

    // Apply cultural scoring if we have insights
    let culturallyEnhancedProjects = mockProjects
    if (qlooInsights.culturalTags && !qlooInsights.error) {
      try {
        const scored = await qlooClient.findCulturallySimilarProjects(
          qlooInsights.culturalTags,
          mockProjects.map(p => ({ name: p.name, topics: p.topics, language: p.language }))
        )
        // Merge the scores back with full project data
        culturallyEnhancedProjects = mockProjects.map(project => {
          const scoredProject = scored.find(s => s.name === project.name)
          return { ...project, ...scoredProject }
        })
        console.log("4. Cultural scoring applied successfully")
      } catch (error) {
        console.error("Cultural scoring error:", error)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Qloo-enhanced recommendations test completed",
      data: {
        query,
        user_profile: mockUser,
        github_data: mockGithubData,
        qloo_insights: qlooInsights,
        culturally_enhanced_projects: culturallyEnhancedProjects,
      },
      metadata: {
        qloo_insights_used: !qlooInsights.error,
        cultural_tags_identified: qlooInsights.culturalTags?.length || 0,
        demographics_analyzed: qlooInsights.demographics?.length > 0,
        cultural_scoring_applied: culturallyEnhancedProjects !== mockProjects,
        api_working: !qlooInsights.error
      }
    })

  } catch (error) {
    console.error("Qloo enhanced test error:", error)
    return NextResponse.json(
      { 
        error: "Test failed", 
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Qloo Enhanced Recommendations Test Endpoint",
    instructions: "Send a POST request with optional 'query' parameter to test the full Qloo integration flow",
    example: {
      method: "POST", 
      body: { query: "Find me Python data science projects" }
    }
  })
}