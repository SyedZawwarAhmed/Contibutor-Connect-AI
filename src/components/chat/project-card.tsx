// src/components/chat/project-card.tsx (Enhanced with MCP Support)
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ExternalLink,
  Github,
  Star,
  Users,
  Code,
  FileText,
  Palette,
  Database,
  TrendingUp,
  Target,
} from "lucide-react"
import { ProjectData } from "./chat-message"

interface Project extends ProjectData {
  id: string
  contributionScore?: number
  recommendationReason?: string
}

interface ProjectCardProps {
  project: Project
  enhanced?: boolean
  showMCPBadge?: boolean
}

export function ProjectCard({
  project,
  enhanced = false,
  showMCPBadge = false,
}: ProjectCardProps) {
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800"
      case "advanced":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800"
    }
  }

  const getContributionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "code":
      case "code contributions":
        return <Code className="h-3 w-3" />
      case "documentation":
        return <FileText className="h-3 w-3" />
      case "design":
      case "ui/ux design":
        return <Palette className="h-3 w-3" />
      default:
        return <Users className="h-3 w-3" />
    }
  }

  const formatStars = (stars?: number) => {
    if (!stars) return null
    if (stars >= 1000) {
      return `${(stars / 1000).toFixed(1)}k`
    }
    return stars.toString()
  }

  const getContributionScoreColor = (score?: number) => {
    if (!score) return "text-gray-500"
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-blue-600"
    if (score >= 40) return "text-yellow-600"
    return "text-orange-600"
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur hover:shadow-lg transition-all duration-200 relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1 pr-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Github className="h-4 w-4" />
              {project.name}
              {enhanced && project.stars && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-3 w-3" />
                  {formatStars(project.stars)}
                </div>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {project.description}
            </p>
          </div>
          <Button size="sm" asChild>
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              View
            </a>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Enhanced difficulty and contribution score */}
        {enhanced && (
          <div className="flex items-center gap-2 flex-wrap">
            {project.difficulty && (
              <Badge
                variant="outline"
                className={`text-xs ${getDifficultyColor(project.difficulty)}`}
              >
                {project.difficulty.charAt(0).toUpperCase() +
                  project.difficulty.slice(1)}
              </Badge>
            )}

            {project.contributionScore !== undefined && (
              <Badge
                variant="outline"
                className={`text-xs flex items-center gap-1 ${getContributionScoreColor(
                  project.contributionScore
                )}`}
              >
                <Target className="h-3 w-3" />
                {project.contributionScore}% Match
              </Badge>
            )}

            {/* Cultural Score Badge */}
            {project.culturalScore !== undefined && (
              <Badge
                variant="outline"
                className="text-xs flex items-center gap-1 bg-qloo-accent/50 text-qloo-primary border-qloo-border"
              >
                <TrendingUp className="h-3 w-3" />
                {Math.round(project.culturalScore)}% Cultural Fit
              </Badge>
            )}

            {/* MCP Badge */}
            {showMCPBadge && (
              <div className="w-fit">
                <Badge
                  variant="secondary"
                  className="text-xs bg-primary/10 text-primary border-primary/20 flex items-center gap-1"
                >
                  <Database className="h-3 w-3" />
                  Live Data
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Languages */}
        <div className="flex flex-wrap gap-1">
          {project.languages.map(lang => (
            <Badge key={lang} variant="secondary" className="text-xs">
              {lang}
            </Badge>
          ))}
        </div>

        {/* Topics */}
        <div className="flex flex-wrap gap-1">
          {project.topics.slice(0, 5).map(topic => (
            <Badge key={topic} variant="outline" className="text-xs">
              {topic}
            </Badge>
          ))}
          {project.topics.length > 5 && (
            <Badge variant="outline" className="text-xs">
              +{project.topics.length - 5} more
            </Badge>
          )}
        </div>

        {/* Cultural Tags */}
        {project.culturalTags && project.culturalTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-qloo-muted-foreground font-medium mr-1">Cultural:</span>
            {project.culturalTags.slice(0, 3).map(tag => (
              <Badge key={tag} className="text-xs bg-qloo-secondary text-qloo-secondary-foreground">
                {tag}
              </Badge>
            ))}
            {project.culturalTags.length > 3 && (
              <Badge variant="outline" className="text-xs border-qloo-border text-qloo-primary">
                +{project.culturalTags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Contribution Types */}
        {enhanced &&
          project.contributionTypes &&
          project.contributionTypes.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">
                Contribution Opportunities:
              </span>
              <div className="flex flex-wrap gap-1">
                {project.contributionTypes.map(type => (
                  <Badge
                    key={type}
                    variant="secondary"
                    className="text-xs flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                  >
                    {getContributionIcon(type)}
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          )}

        {/* Enhanced AI Explanation */}
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground italic">
            <strong>Why this project:</strong> {project.explanation}
          </p>
        </div>

        {/* MCP-specific recommendation reason */}
        {enhanced && project.recommendationReason && (
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-xs text-primary">
                <strong>AI Insight:</strong> {project.recommendationReason}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
