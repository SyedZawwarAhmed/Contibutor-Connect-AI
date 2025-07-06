"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Github } from "lucide-react"

interface Project {
  id: string
  name: string
  description: string
  languages: string[]
  topics: string[]
  githubUrl: string
  explanation: string
}

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Github className="h-4 w-4" />
              {project.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{project.description}</p>
          </div>
          <Button size="sm" asChild>
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
              <ExternalLink className="h-4 w-4 mr-1" />
              View
            </a>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
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
          {project.topics.map((topic) => (
            <Badge key={topic} variant="outline" className="text-xs">
              {topic}
            </Badge>
          ))}
        </div>

        {/* AI Explanation */}
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground italic">
            <strong>Why this project:</strong> {project.explanation}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
