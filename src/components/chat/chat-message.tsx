// src/components/chat/chat-message.tsx (Enhanced Version)
"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { ProjectCard } from "./project-card"
import { Bot, User, Sparkles } from "lucide-react"
import { LoadingDots } from "@/components/ui/loading-dots"
import type { Message } from "ai"
import { useEffect, useState, useRef } from "react"

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

function MessageContent({ content }: { content: string }) {
  // Split content into paragraphs and format
  const formatContent = (text: string) => {
    const lines = text.split("\n")
    const elements: any[] = []

    lines.forEach((line, index) => {
      const trimmedLine = line.trim()

      if (!trimmedLine) {
        // Empty line - add spacing
        elements.push(<div key={`space-${index}`} className="h-2" />)
        return
      }

      // Check for numbered lists (1. 2. 3.)
      if (/^\d+\.\s/.test(trimmedLine)) {
        elements.push(
          <div key={index} className="flex gap-2 mb-2">
            <span className="text-primary font-semibold text-sm min-w-[20px]">
              {trimmedLine.match(/^\d+/)?.[0]}.
            </span>
            <span className="text-foreground text-sm leading-relaxed">
              {trimmedLine.replace(/^\d+\.\s/, "")}
            </span>
          </div>
        )
        return
      }

      // Check for bullet points (-)
      if (trimmedLine.startsWith("- ")) {
        elements.push(
          <div key={index} className="flex gap-2 mb-1 ml-2">
            <span className="text-primary mt-1.5 w-1 h-1 rounded-full bg-current flex-shrink-0" />
            <span className="text-foreground text-sm leading-relaxed">
              {trimmedLine.replace(/^- /, "")}
            </span>
          </div>
        )
        return
      }

      // Check for headings (text ending with :)
      if (trimmedLine.endsWith(":") && trimmedLine.length < 50) {
        elements.push(
          <h4
            key={index}
            className="font-semibold text-foreground text-sm mt-3 mb-1"
          >
            {trimmedLine}
          </h4>
        )
        return
      }

      // Check for bold project names (**text**)
      if (trimmedLine.includes("**")) {
        const parts = trimmedLine.split("**")
        elements.push(
          <p
            key={index}
            className="text-foreground text-sm leading-relaxed mb-2"
          >
            {parts.map((part, i) =>
              i % 2 === 1 ? (
                <strong key={i} className="font-semibold text-primary">
                  {part}
                </strong>
              ) : (
                part
              )
            )}
          </p>
        )
        return
      }

      // Regular paragraph
      elements.push(
        <p key={index} className="text-foreground text-sm leading-relaxed mb-2">
          {trimmedLine}
        </p>
      )
    })

    return elements
  }

  return <div className="space-y-1">{formatContent(content)}</div>
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
  // Track which messages we've already processed using message ID
  const processedMessageIds = useRef(new Set<string>())

  // Check if message content suggests project search and trigger structured request
  useEffect(() => {
    // Skip if already processed this message
    if (processedMessageIds.current.has(message.id)) {
      return
    }

    // Only process assistant messages that are complete (not loading)
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
        // Mark this message as processed
        processedMessageIds.current.add(message.id)

        setIsLoadingProjects(true)
        fetchStructuredRecommendations(message.content)
      }
    }
  }, [message.id, message.content, isUser, isLoading, structuredData])

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
        console.log("structured data", data)
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
                <MessageContent content={message.content} />
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
          <Card className="bg-muted/30 border-dashed border-primary/30">
            <div className="p-4 text-center">
              <LoadingDots />
              <p className="text-xs text-muted-foreground mt-2 font-medium">
                🔍 Analyzing your request and finding perfect projects...
              </p>
            </div>
          </Card>
        )}

        {/* Show structured project recommendations */}
        {structuredData?.projects && !isUser && (
          <div className="space-y-3 w-full">
            <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                Recommended Projects
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                {structuredData.projects.length} projects found
              </span>
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
        <Avatar className="h-8 w-8 mt-1 ring-2 ring-primary/20">
          <AvatarImage src="/placeholder.svg?height=32&width=32" />
          <AvatarFallback className="bg-primary text-primary-foreground">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
