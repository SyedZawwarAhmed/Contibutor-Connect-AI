"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, GitBranch, Star } from "lucide-react"

interface CulturalProject {
  name: string
  description?: string
  language?: string
  topics?: string[]
  stars?: number
  culturalScore?: number
  culturalTags?: string[]
  matchedTags?: string[]
}

interface QlooProjectScoringProps {
  projects: CulturalProject[]
  title?: string
  className?: string
}

export function QlooProjectScoring({ projects, title = "Culturally Enhanced Projects", className }: QlooProjectScoringProps) {
  if (!projects || projects.length === 0) {
    return null
  }

  // Prepare data for charts
  const chartData = projects.slice(0, 5).map(project => ({
    name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
    fullName: project.name,
    culturalFit: Math.round((project.culturalScore || 0) * 100),
    popularity: Math.min(Math.round((project.stars || 0) / 1000), 100), // Normalize to 0-100
    matchedTags: project.matchedTags?.length || 0,
    language: project.language,
    stars: project.stars
  }))

  // Prepare radar chart data for top project
  const topProject = projects[0]
  const radarData = topProject ? [
    {
      category: 'Cultural Fit',
      value: Math.round((topProject.culturalScore || 0) * 100),
      fullMark: 100
    },
    {
      category: 'Popularity',
      value: Math.min(Math.round((topProject.stars || 0) / 1000), 100),
      fullMark: 100
    },
    {
      category: 'Tag Matches',
      value: Math.min((topProject.matchedTags?.length || 0) * 20, 100),
      fullMark: 100
    },
    {
      category: 'Topic Relevance',
      value: Math.min((topProject.topics?.length || 0) * 25, 100),
      fullMark: 100
    }
  ] : []

  return (
    <Card className={`border-purple-200 dark:border-purple-800 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
          <TrendingUp className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          Projects ranked by cultural community fit and technical relevance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cultural Fit Comparison Chart */}
        <div>
          <h4 className="font-medium mb-3 text-sm text-purple-700 dark:text-purple-300 flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Cultural Fit Comparison
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-purple-200 dark:stroke-purple-800" />
              <XAxis 
                dataKey="name" 
                className="text-xs fill-purple-600 dark:fill-purple-400"
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                className="text-xs fill-purple-600 dark:fill-purple-400"
                tick={{ fontSize: 11 }}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--background)',
                  border: '1px solid rgb(147, 51, 234, 0.3)',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
                formatter={(value, name, props) => [
                  name === 'culturalFit' ? `${value}%` : 
                  name === 'popularity' ? `${props.payload.stars?.toLocaleString()} stars` :
                  name === 'matchedTags' ? `${value} matches` : value,
                  name === 'culturalFit' ? 'Cultural Fit' :
                  name === 'popularity' ? 'Popularity' :
                  name === 'matchedTags' ? 'Tag Matches' : name
                ]}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
              />
              <Bar 
                dataKey="culturalFit" 
                fill="#a855f7" 
                radius={[2, 2, 0, 0]}
                stroke="rgb(147, 51, 234, 0.5)"
                strokeWidth={1}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Project Radar Chart */}
        {topProject && (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-3 text-sm text-purple-700 dark:text-purple-300">
                Top Match Analysis: {topProject.name}
              </h4>
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={radarData}>
                  <PolarGrid className="stroke-purple-200 dark:stroke-purple-800" />
                  <PolarAngleAxis 
                    tick={{ fontSize: 10, fill: 'rgb(147, 51, 234)' }}
                    className="fill-purple-600 dark:fill-purple-400"
                  />
                  <PolarRadiusAxis 
                    tick={{ fontSize: 9, fill: 'rgb(147, 51, 234, 0.7)' }}
                    domain={[0, 100]}
                    className="fill-purple-500 dark:fill-purple-500"
                  />
                  <Radar 
                    name="Score" 
                    dataKey="value" 
                    stroke="#8b5cf6" 
                    fill="#a855f7" 
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--background)',
                      border: '1px solid rgb(147, 51, 234, 0.3)',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                    formatter={(value) => [`${value}%`, 'Score']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h4 className="font-medium mb-3 text-sm text-purple-700 dark:text-purple-300">
                Project Details
              </h4>
              <div className="space-y-3">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-purple-700 dark:text-purple-300">
                      {topProject.name}
                    </span>
                    <Badge className="bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300">
                      {Math.round((topProject.culturalScore || 0) * 100)}% fit
                    </Badge>
                  </div>
                  {topProject.description && (
                    <p className="text-xs text-purple-600 dark:text-purple-400 mb-2">
                      {topProject.description.length > 80 
                        ? topProject.description.substring(0, 80) + '...'
                        : topProject.description
                      }
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-purple-500">
                    {topProject.stars && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {topProject.stars.toLocaleString()}
                      </span>
                    )}
                    {topProject.language && (
                      <span>• {topProject.language}</span>
                    )}
                  </div>
                </div>

                {topProject.matchedTags && topProject.matchedTags.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2 block">
                      Cultural Matches:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {topProject.matchedTags.slice(0, 4).map((tag, index) => (
                        <Badge 
                          key={index}
                          variant="outline" 
                          className="text-xs border-purple-300 text-purple-600 dark:border-purple-600 dark:text-purple-400"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {topProject.matchedTags.length > 4 && (
                        <Badge variant="outline" className="text-xs border-purple-300 text-purple-600 dark:border-purple-600 dark:text-purple-400">
                          +{topProject.matchedTags.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Project List */}
        <div>
          <h4 className="font-medium mb-3 text-sm text-purple-700 dark:text-purple-300">
            Ranked Recommendations
          </h4>
          <div className="space-y-2">
            {projects.slice(0, 5).map((project, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-purple-600 dark:text-purple-400 w-6">
                    #{index + 1}
                  </span>
                  <div>
                    <span className="font-medium text-purple-700 dark:text-purple-300">
                      {project.name}
                    </span>
                    {project.language && (
                      <span className="text-purple-500 ml-2">• {project.language}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-600 dark:text-purple-400 font-medium">
                    {Math.round((project.culturalScore || 0) * 100)}%
                  </span>
                  {project.stars && (
                    <span className="text-purple-500 text-xs">
                      ⭐ {project.stars > 1000 ? `${Math.round(project.stars/1000)}k` : project.stars}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}