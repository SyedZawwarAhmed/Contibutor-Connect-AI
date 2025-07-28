// Demo page to showcase Qloo cultural intelligence integration
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Users, Target, Brain, TrendingUp, MapPin } from "lucide-react"

interface DemoData {
  query: string
  user_profile: any
  github_data: any
  qloo_insights: any
  culturally_enhanced_projects: any[]
  metadata: any
}

export default function QlooDemoPage() {
  const [demoData, setDemoData] = useState<DemoData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runDemo = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/test-qloo-enhanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "Find me Python data science projects for machine learning",
        }),
      })

      const result = await response.json()
      if (result.success) {
        setDemoData(result.data)
      } else {
        setError(result.error || "Demo failed")
      }
    } catch (error) {
      console.error("Demo failed:", error)
      setError("Failed to run demo. Please check if the server is running.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Qloo Cultural Intelligence Demo
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
          See how Qloo's Taste AI enhances project recommendations with cultural
          intelligence
        </p>
        <Button
          onClick={runDemo}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Brain className="mr-2 h-4 w-4" />
          )}
          Run Qloo Demo
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-red-800 mb-2">Demo Error</h3>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {demoData && (
        <div className="space-y-6">
          {/* User Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Simulated User Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">GitHub Profile</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    <strong>@{demoData.user_profile.githubUsername}</strong>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {demoData.user_profile.bio}
                  </p>
                  <div className="flex gap-2 text-xs">
                    <Badge variant="outline">
                      {demoData.user_profile.publicRepos} repos
                    </Badge>
                    <Badge variant="outline">
                      {demoData.user_profile.followers} followers
                    </Badge>
                    <Badge variant="outline">
                      {demoData.user_profile.location}
                    </Badge>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Technical Interests</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium">Languages: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {demoData.github_data.languages.map(
                          (lang: string, i: number) => (
                            <Badge key={i} variant="secondary">
                              {lang}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Topics: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {demoData.github_data.topics
                          .slice(0, 4)
                          .map((topic: string, i: number) => (
                            <Badge key={i} variant="outline">
                              {topic}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cultural Intelligence Insights */}
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                <Brain className="h-5 w-5" />
                Qloo Cultural Intelligence
              </CardTitle>
              <CardDescription>
                How Qloo's Taste AI analyzes technical interests through a
                cultural lens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cultural Tags */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  Mapped Cultural Interests
                </h4>
                <div className="flex flex-wrap gap-2">
                  {demoData.qloo_insights?.culturalTags?.map(
                    (tag: string, i: number) => (
                      <Badge
                        key={i}
                        className="bg-purple-100 text-purple-700 hover:bg-purple-200"
                      >
                        {tag}
                      </Badge>
                    )
                  )}
                </div>
              </div>

              {/* Demographics */}
              {demoData.qloo_insights?.demographics &&
                demoData.qloo_insights.demographics.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-500" />
                      Community Demographics
                    </h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {demoData.qloo_insights.demographics
                        .slice(0, 6)
                        .map((demo: any, index: number) => {
                          // Find the age group with highest affinity
                          const ageEntries = Object.entries(
                            demo.query.age as Record<string, number>
                          )
                          const topAge = ageEntries.reduce((a, b) =>
                            a[1] > b[1] ? a : b
                          )
                          const ageGroup = topAge[0].replace(/_/g, " ")
                          const ageScore = (topAge[1] * 100).toFixed(0)

                          // Get gender preference
                          const genderScore =
                            demo.query.gender.female > 0
                              ? `${(demo.query.gender.female * 100).toFixed(
                                  0
                                )}% female`
                              : `${(
                                  Math.abs(demo.query.gender.male) * 100
                                ).toFixed(0)}% male`

                          // Extract interest category from entity_id
                          const category =
                            demo.entity_id
                              .split(":")
                              .pop()
                              ?.replace(/media:|genre:|keyword:/, "") ||
                            "general"

                          return (
                            <Card
                              key={index}
                              className="p-3 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
                            >
                              <div className="text-center">
                                <h5 className="font-medium text-purple-700 dark:text-purple-300 capitalize mb-2">
                                  {category}
                                </h5>
                                <div className="space-y-1 text-sm">
                                  <div className="text-purple-600 dark:text-purple-400">
                                    <strong>{ageScore}%</strong> affinity
                                  </div>
                                  <div className="text-purple-600 dark:text-purple-400">
                                    {ageGroup}
                                  </div>
                                  <div className="text-purple-500 text-xs">
                                    {genderScore}
                                  </div>
                                </div>
                              </div>
                            </Card>
                          )
                        })}
                    </div>
                  </div>
                )}

              {/* Metadata */}
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold mb-2 text-green-700 dark:text-green-300 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Analysis Results
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-green-600 dark:text-green-400">
                      {demoData.metadata?.cultural_tags_identified || demoData.qloo_insights?.culturalTags?.length || 0}
                    </div>
                    <div className="text-green-500 text-xs">Cultural Tags</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-green-600 dark:text-green-400">
                      {demoData.qloo_insights?.demographics?.length || 0}
                    </div>
                    <div className="text-green-500 text-xs">Demographics</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-green-600 dark:text-green-400">
                      {demoData.metadata?.cultural_scoring_applied ? "✓" : "✗"}
                    </div>
                    <div className="text-green-500 text-xs">
                      Cultural Scoring
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-green-600 dark:text-green-400">
                      {demoData.metadata?.api_working ? "✓" : "✗"}
                    </div>
                    <div className="text-green-500 text-xs">API Status</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Project Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Culturally Enhanced Project Recommendations
              </CardTitle>
              <CardDescription>
                Projects ranked by both technical relevance and cultural
                community fit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {demoData.culturally_enhanced_projects?.map(
                  (project: any, index: number) => (
                    <Card
                      key={index}
                      className="p-4 border-l-4 border-l-blue-500"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-lg">
                            {project.name}
                          </h4>
                          <p className="text-gray-600 dark:text-gray-300 text-sm">
                            {project.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {(project.culturalScore * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-gray-500">
                            Cultural Fit
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <span>⭐ {project.stars?.toLocaleString()}</span>
                        <span>📝 {project.language}</span>
                        <span>🏷️ {project.topics.join(", ")}</span>
                      </div>

                      {project.matchedTags &&
                        project.matchedTags.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                              Cultural Matches:
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {project.matchedTags
                                .slice(0, 5)
                                .map((tag: string, i: number) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className="text-xs border-purple-300 text-purple-600"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        )}
                    </Card>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
