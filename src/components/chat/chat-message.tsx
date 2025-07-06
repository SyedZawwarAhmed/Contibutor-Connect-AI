"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { ProjectCard } from "./project-card"
import { Bot, User } from "lucide-react"
import { LoadingDots } from "@/components/ui/loading-dots"
import type { Message } from "ai"

interface ChatMessageProps {
  message: Message
  isLoading?: boolean
}

// Mock project data - in real app this would come from the AI response
const mockProjects = [
  {
    id: "1",
    name: "facebook/react",
    description: "The library for web and native user interfaces",
    languages: ["JavaScript", "TypeScript"],
    topics: ["react", "javascript", "library", "ui"],
    githubUrl: "https://github.com/facebook/react",
    explanation:
      "Perfect for learning modern React patterns and contributing to one of the most popular JavaScript libraries.",
  },
]

export function ChatMessage({ message, isLoading }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarFallback>
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`flex flex-col space-y-2 max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        <Card className={`p-4 ${isUser ? "bg-primary text-primary-foreground ml-12" : "bg-muted"}`}>
          {isLoading ? (
            <LoadingDots />
          ) : (
            <div className="space-y-2">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

              {/* Show project cards for AI messages that contain project recommendations */}
              {!isUser && message.content.toLowerCase().includes("project") && (
                <div className="space-y-3 mt-4">
                  {mockProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
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
