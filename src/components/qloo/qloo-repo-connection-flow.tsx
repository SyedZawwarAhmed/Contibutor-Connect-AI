"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Brain,
  ArrowRight,
  Github,
  Target,
  Zap,
  TrendingUp,
  Users,
  ChevronRight,
} from "lucide-react"

interface QlooRepoConnectionFlowProps {
  userQuery: string
  extractedUrns?: string[]
  culturalTags?: string[]
  repositoryRecommendations?: Array<{
    name: string
    description?: string
    cultural_score?: number
    demographic_match?: number
    url?: string
    stars?: number
    language?: string
  }>
  metadata?: {
    total_repos_analyzed?: number
    cultural_scoring_applied?: boolean
    demographic_factors_used?: boolean
  }
  className?: string
}

export function QlooRepoConnectionFlow({
  userQuery,
  extractedUrns = [],
  culturalTags = [],
  repositoryRecommendations = [],
  metadata,
  className,
}: QlooRepoConnectionFlowProps) {
  const steps = [
    // {
    //   title: "User Input",
    //   description: "Your technical interests and preferences",
    //   icon: Target,
    //   content: userQuery,
    //   status: "completed"
    // },
    {
      title: "URN Extraction",
      description: "Convert tech interests to cultural entities",
      icon: Brain,
      content:
        extractedUrns.length > 0
          ? `${extractedUrns.length} URN tags mapped`
          : "Processing...",
      status: extractedUrns.length > 0 ? "completed" : "processing",
    },
    {
      title: "Cultural Analysis",
      description: "Qloo's Taste AI analyzes cultural preferences",
      icon: Zap,
      content:
        culturalTags.length > 0
          ? `${culturalTags.length} cultural insights`
          : "Analyzing...",
      status: culturalTags.length > 0 ? "completed" : "processing",
    },
    {
      title: "Repository Scoring",
      description: "GitHub repos ranked by cultural alignment",
      icon: Github,
      content:
        repositoryRecommendations && repositoryRecommendations.length > 0
          ? `${repositoryRecommendations.length} culturally-matched repos`
          : "Matching...",
      status:
        repositoryRecommendations && repositoryRecommendations.length > 0
          ? "completed"
          : "processing",
    },
  ]

  return (
    <Card className={`border-qloo-border bg-qloo-muted/20 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-qloo-primary-foreground">
          <Brain className="h-5 w-5 text-qloo-primary" />
          Cultural Intelligence → Repository Matching
        </CardTitle>
        <CardDescription className="text-qloo-muted-foreground">
          How Qloo's Taste AI influences your GitHub repository recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Process Flow */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-4">
              {/* Step Icon */}
              <div
                className={`p-2 rounded-full border-2 ${
                  step.status === "completed"
                    ? "bg-qloo-primary border-qloo-primary text-white"
                    : step.status === "processing"
                    ? "bg-qloo-secondary border-qloo-border text-qloo-primary animate-pulse"
                    : "bg-qloo-muted border-qloo-border text-qloo-muted-foreground"
                }`}
              >
                <step.icon className="h-4 w-4" />
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm text-qloo-primary-foreground">
                    {step.title}
                  </h4>
                  {step.status === "completed" && (
                    <Badge
                      variant="outline"
                      className="text-xs border-qloo-primary text-qloo-primary"
                    >
                      ✓
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-qloo-muted-foreground mb-1">
                  {step.description}
                </p>
                <p className="text-xs font-medium text-qloo-primary">
                  {step.content}
                </p>
              </div>

              {/* Arrow */}
              {index < steps.length - 1 && (
                <ChevronRight className="h-4 w-4 text-qloo-border" />
              )}
            </div>
          ))}
        </div>

        {/* Cultural Data Influence */}
        {culturalTags.length > 0 && (
          <div className="bg-qloo-accent/50 p-4 rounded-lg border border-qloo-border">
            <h4 className="font-medium mb-3 text-qloo-primary-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-qloo-primary" />
              Cultural Factors Influencing Repository Selection
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-qloo-primary mb-2">
                  Detected Cultural Interests:
                </div>
                <div className="flex flex-wrap gap-1">
                  {culturalTags.slice(0, 6).map((tag, index) => (
                    <Badge
                      key={index}
                      className="text-xs bg-qloo-secondary text-qloo-secondary-foreground"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {culturalTags.length > 6 && (
                    <Badge
                      variant="outline"
                      className="text-xs border-qloo-border"
                    >
                      +{culturalTags.length - 6} more
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <div className="font-medium text-qloo-primary mb-2">
                  Repository Scoring Factors:
                </div>
                <div className="space-y-1 text-xs text-qloo-muted-foreground">
                  <div>• Community cultural alignment</div>
                  <div>• Demographic preference matching</div>
                  <div>• Interest-based project affinity</div>
                  <div>• Cultural category scoring</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Culturally-Matched Repositories */}
        {repositoryRecommendations && repositoryRecommendations.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 text-qloo-primary-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-qloo-primary" />
              Top Cultural Matches
            </h4>
            <div className="space-y-3">
              {repositoryRecommendations.slice(0, 3).map((repo, index) => (
                <div
                  key={index}
                  className="bg-qloo-accent p-3 rounded-lg border border-qloo-border"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-qloo-primary-foreground truncate">
                        {repo.name}
                      </h5>
                      {repo.description && (
                        <p className="text-xs text-qloo-muted-foreground line-clamp-2">
                          {repo.description}
                        </p>
                      )}
                    </div>
                    <div className="ml-3 text-right">
                      {repo.cultural_score && (
                        <div className="text-sm font-bold text-qloo-primary">
                          {repo.cultural_score.toFixed(0)}%
                        </div>
                      )}
                      <div className="text-xs text-qloo-muted-foreground">
                        cultural fit
                      </div>
                    </div>
                  </div>

                  {repo.cultural_score && (
                    <Progress
                      value={repo.cultural_score}
                      className="h-2 bg-qloo-muted mb-2"
                    />
                  )}

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-qloo-muted-foreground">
                      {repo.language && (
                        <Badge
                          variant="outline"
                          className="text-xs border-qloo-border"
                        >
                          {repo.language}
                        </Badge>
                      )}
                      {repo.stars && (
                        <span>⭐ {repo.stars.toLocaleString()}</span>
                      )}
                    </div>
                    {repo.demographic_match && (
                      <span className="text-qloo-primary font-medium">
                        {repo.demographic_match.toFixed(0)}% demo match
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Process Statistics */}
        {metadata && (
          <div className="bg-qloo-muted/50 p-3 rounded-lg border border-qloo-border">
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="font-bold text-qloo-primary">
                  {metadata.total_repos_analyzed || 0}
                </div>
                <div className="text-xs text-qloo-muted-foreground">
                  Repos Analyzed
                </div>
              </div>
              <div>
                <div className="font-bold text-qloo-primary">
                  {metadata.cultural_scoring_applied ? "✓" : "○"}
                </div>
                <div className="text-xs text-qloo-muted-foreground">
                  Cultural Scoring
                </div>
              </div>
              <div>
                <div className="font-bold text-qloo-primary">
                  {metadata.demographic_factors_used ? "✓" : "○"}
                </div>
                <div className="text-xs text-qloo-muted-foreground">
                  Demo Factors
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
