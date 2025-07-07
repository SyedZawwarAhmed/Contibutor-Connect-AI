// src/components/chat/chat-message.tsx (Enhanced Version)
"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { ProjectCard } from "./project-card"
import { Bot, User, Sparkles } from "lucide-react"
import { LoadingDots } from "@/components/ui/loading-dots"
import type { Message } from "ai"
import { useEffect, useState } from "react"

interface ChatMessageProps {
  message: Message
  isLoading?: boolean
  onProjectRequest?: (query: string) => void
}

export interface ProjectData {
  name: string
  description: string
  githubUrl: string
  languages: string[]
  topics: string[]
  stars?: number
  difficulty: "beginner" | "intermediate" | "advanced"
  explanation: string
  contributionTypes: string[]
}

interface StructuredResponse {
  projects: ProjectData[]
  reasoning: string
}

export function ChatMessage({
  message,
  isLoading,
  onProjectRequest,
}: ChatMessageProps) {
  const isUser = message.role === "user"
  const [structuredData, setStructuredData] =
    useState<StructuredResponse | null>(null)
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)

  // Check if message content suggests project search and trigger structured request
  useEffect(() => {
    if (!isUser && message.content && !isLoading && !structuredData) {
      const content = message.content.toLowerCase()
      const projectKeywords = [
        "find projects",
        "recommend projects",
        "show me projects",
        "project for",
        "contribute to",
        "open source",
        "repository",
        "repos",
      ]

      const shouldFetchProjects = projectKeywords.some(keyword =>
        content.includes(keyword)
      )

      if (shouldFetchProjects && onProjectRequest) {
        setIsLoadingProjects(true)
        fetchStructuredRecommendations(message.content)
      }
    }
  }, [message.content, isUser, isLoading, structuredData, onProjectRequest])

  const fetchStructuredRecommendations = async (query: string) => {
    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.projects) {
          setStructuredData(data.data)
        }
      }
    } catch (error) {
      console.error("Failed to fetch project recommendations:", error)
    } finally {
      setIsLoadingProjects(false)
    }
  }

  const formatDifficulty = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return { text: "Beginner Friendly", color: "text-green-600" }
      case "intermediate":
        return { text: "Intermediate", color: "text-yellow-600" }
      case "advanced":
        return { text: "Advanced", color: "text-red-600" }
      default:
        return { text: "Any Level", color: "text-gray-600" }
    }
  }

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarFallback>
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={`flex flex-col space-y-2 max-w-[80%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <Card
          className={`p-4 ${
            isUser ? "bg-primary text-primary-foreground ml-12" : "bg-muted"
          }`}
        >
          {isLoading && !message.content ? (
            <LoadingDots />
          ) : (
            <div className="space-y-2">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>

              {/* Show structured reasoning if available */}
              {structuredData?.reasoning && !isUser && (
                <div className="mt-3 p-3 bg-primary/10 rounded-lg border-l-2 border-primary">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-primary">
                      AI Analysis
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    {structuredData.reasoning}
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Loading state for project recommendations */}
        {isLoadingProjects && !isUser && (
          <Card className="bg-muted/50 border-dashed">
            <div className="p-4 text-center">
              <LoadingDots />
              <p className="text-xs text-muted-foreground mt-2">
                Analyzing your request and finding perfect projects...
              </p>
            </div>
          </Card>
        )}

        {/* Show structured project recommendations */}
        {structuredData?.projects && !isUser && (
          <div className="space-y-3 w-full">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Recommended Projects</span>
            </div>

            {structuredData.projects.map((project, index) => {
              const difficultyInfo = formatDifficulty(project.difficulty)

              return (
                <ProjectCard
                  key={`${project.name}-${index}`}
                  project={{
                    id: `structured-${index}`,
                    name: project.name,
                    description: project.description,
                    languages: project.languages,
                    topics: project.topics,
                    githubUrl: project.githubUrl,
                    explanation: project.explanation,
                    stars: project.stars,
                    difficulty: project.difficulty,
                    contributionTypes: project.contributionTypes,
                  }}
                  enhanced={true}
                />
              )
            })}
          </div>
        )}
      </div>

      {isUser && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src="/placeholder.svg?height=32&width=32" />
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
