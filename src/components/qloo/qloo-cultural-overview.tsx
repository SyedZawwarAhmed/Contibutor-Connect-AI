"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, Target, TrendingUp, Users } from "lucide-react"

interface QlooInsights {
  culturalTags?: string[]
  demographics?: any[]
  relatedInterests?: any[]
  qlooUrns?: string[]
}

interface QlooCulturalOverviewProps {
  insights: QlooInsights
  metadata?: {
    cultural_tags_identified?: number
    demographics_analyzed?: boolean
    cultural_scoring_applied?: boolean
    api_working?: boolean
  }
  className?: string
}

export function QlooCulturalOverview({ insights, metadata, className }: QlooCulturalOverviewProps) {
  if (!insights) {
    return null
  }

  const culturalTags = insights.culturalTags || []
  const demographics = insights.demographics || []
  const relatedInterests = insights.relatedInterests || []

  // Calculate overview stats
  const totalCulturalMappings = culturalTags.length
  const demographicsCount = demographics.length
  const avgAffinity = demographics.length > 0 
    ? demographics.reduce((sum, demo) => {
        const ageEntries = Object.entries(demo.query.age as Record<string, number>)
        const topAge = ageEntries.reduce((a, b) => a[1] > b[1] ? a : b)
        return sum + Math.abs(topAge[1])
      }, 0) / demographics.length * 100
    : 0

  const femaleSkew = demographics.length > 0
    ? demographics.reduce((sum, demo) => sum + demo.query.gender.female, 0) / demographics.length * 100
    : 0

  return (
    <Card className={`border-purple-200 dark:border-purple-800 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
          <Brain className="h-5 w-5" />
          Cultural Intelligence Overview
        </CardTitle>
        <CardDescription>
          Qloo's Taste AI analysis of your technical interests through a cultural lens
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {totalCulturalMappings}
            </div>
            <div className="text-xs text-purple-500">Cultural Tags</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {demographicsCount}
            </div>
            <div className="text-xs text-purple-500">Demographics</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {avgAffinity.toFixed(0)}%
            </div>
            <div className="text-xs text-purple-500">Avg Affinity</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {femaleSkew.toFixed(0)}%
            </div>
            <div className="text-xs text-purple-500">Female Preference</div>
          </div>
        </div>

        {/* Cultural Tags */}
        {culturalTags.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <Target className="h-4 w-4" />
              Mapped Cultural Interests
            </h4>
            <div className="flex flex-wrap gap-2">
              {culturalTags.slice(0, 10).map((tag, index) => (
                <Badge 
                  key={index}
                  className="bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-700"
                >
                  {tag}
                </Badge>
              ))}
              {culturalTags.length > 10 && (
                <Badge variant="outline" className="border-purple-300 text-purple-600 dark:border-purple-600 dark:text-purple-400">
                  +{culturalTags.length - 10} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Top Community Matches */}
        {demographics.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <Users className="h-4 w-4" />
              Top Community Matches
            </h4>
            <div className="space-y-3">
              {demographics.slice(0, 3).map((demo, index) => {
                const category = demo.entity_id.split(':').pop()?.replace(/media:|genre:|keyword:/, '') || 'general'
                const ageEntries = Object.entries(demo.query.age as Record<string, number>)
                const topAge = ageEntries.reduce((a, b) => a[1] > b[1] ? a : b)
                const ageScore = Math.abs(topAge[1]) * 100
                const genderScore = demo.query.gender.female > 0 ? 
                  demo.query.gender.female * 100 : Math.abs(demo.query.gender.male) * 100

                return (
                  <div key={index} className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-purple-700 dark:text-purple-300 capitalize">
                        {category}
                      </span>
                      <span className="text-sm text-purple-600 dark:text-purple-400">
                        {ageScore.toFixed(0)}% affinity
                      </span>
                    </div>
                    <Progress 
                      value={ageScore} 
                      className="h-2 bg-purple-200 dark:bg-purple-800"
                    />
                    <div className="flex justify-between text-xs text-purple-500 mt-1">
                      <span>{topAge[0].replace(/_/g, ' ')}</span>
                      <span>{genderScore.toFixed(0)}% {demo.query.gender.female > 0 ? 'female' : 'male'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Analysis Status */}
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
          <h4 className="font-medium mb-2 text-green-700 dark:text-green-300 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analysis Status
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-green-600 dark:text-green-400">Cultural Mapping</span>
              <span className="text-green-700 dark:text-green-300 font-medium">
                {metadata?.cultural_scoring_applied ? '✓' : '○'} Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-green-600 dark:text-green-400">Demographics</span>
              <span className="text-green-700 dark:text-green-300 font-medium">
                {metadata?.demographics_analyzed ? '✓' : '○'} {demographicsCount > 0 ? 'Available' : 'Pending'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-green-600 dark:text-green-400">API Status</span>
              <span className="text-green-700 dark:text-green-300 font-medium">
                {metadata?.api_working ? '✓' : '○'} Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-green-600 dark:text-green-400">URN Mapping</span>
              <span className="text-green-700 dark:text-green-300 font-medium">
                {insights.qlooUrns && insights.qlooUrns.length > 0 ? '✓' : '○'} {insights.qlooUrns?.length || 0}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}