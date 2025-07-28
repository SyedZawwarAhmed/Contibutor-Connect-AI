"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChatInput } from "./chat-input"
import { Github, Sparkles, Code, Users } from "lucide-react"

interface WelcomeScreenWithInputProps {
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  onStarterQuestion: (question: string) => void
}

const starterQuestions = [
  "Find Python data science projects that match my technical interests and cultural preferences",
  "Show me beginner-friendly React projects with strong community support and cultural alignment",
  "Recommend AI/ML projects where developers like me typically contribute and feel welcome",
  "Find TypeScript projects that align with my coding style and the type of developer communities I enjoy",
]

export function WelcomeScreenWithInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  onStarterQuestion,
}: WelcomeScreenWithInputProps) {
  return (
    <div className="flex-1 flex flex-col">
      {/* Welcome Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-8 text-center">
          {/* Welcome Message */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-foreground">Welcome to ContributorConnect AI</h2>

            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              Bridge the gap between your skills and open-source needs. Ask me to find ideal projects based on your
              preferences!
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border/50">
              <CardContent className="p-4 text-center space-y-2">
                <Github className="h-6 w-6 text-primary mx-auto" />
                <h3 className="font-semibold">GitHub Integration</h3>
                <p className="text-sm text-muted-foreground">Analyze your profile and preferences</p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-4 text-center space-y-2">
                <Code className="h-6 w-6 text-primary mx-auto" />
                <h3 className="font-semibold">Smart Matching</h3>
                <p className="text-sm text-muted-foreground">Find projects that match your skills</p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-4 text-center space-y-2">
                <Users className="h-6 w-6 text-primary mx-auto" />
                <h3 className="font-semibold">Community Focus</h3>
                <p className="text-sm text-muted-foreground">Connect with welcoming communities</p>
              </CardContent>
            </Card>
          </div>

          {/* Starter Questions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Try asking me:</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {starterQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-4 text-left justify-start whitespace-normal bg-transparent"
                  onClick={() => onStarterQuestion(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card/50 backdrop-blur">
        <div className="max-w-4xl mx-auto p-4">
          <ChatInput
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
