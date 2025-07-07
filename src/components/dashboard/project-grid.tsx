"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Github, Star, GitFork, Clock } from "lucide-react"

interface Project {
  id: string
  name: string
  description: string
  languages: string[]
  topics: string[]
  githubUrl: string
  stars: number
  forks: number
  lastUpdated: string
  explanation: string
}

interface ProjectGridProps {
  projects: Project[]
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Card key={project.id} className="border-border/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  <span className="truncate">{project.name}</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
              </div>
              <Button size="sm" asChild className="shrink-0 ml-2">
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View
                </a>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* GitHub Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                {formatNumber(project.stars)}
              </div>
              <div className="flex items-center gap-1">
                <GitFork className="h-4 w-4" />
                {formatNumber(project.forks)}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDate(project.lastUpdated)}
              </div>
            </div>

            {/* Languages */}
            <div className="flex flex-wrap gap-1">
              {project.languages.map((lang) => (
                <Badge key={lang} variant="secondary" className="text-xs">
                  {lang}
                </Badge>
              ))}
            </div>

            {/* Topics */}
            <div className="flex flex-wrap gap-1">
              {project.topics.slice(0, 4).map((topic) => (
                <Badge key={topic} variant="outline" className="text-xs">
                  {topic}
                </Badge>
              ))}
              {project.topics.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{project.topics.length - 4} more
                </Badge>
              )}
            </div>

            {/* AI Explanation */}
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground italic">
                <strong>Why this project:</strong> {project.explanation}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
