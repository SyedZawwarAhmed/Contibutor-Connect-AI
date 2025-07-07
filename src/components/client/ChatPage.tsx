"use client"

import { useState, useCallback } from "react"
import { useChat } from "@ai-sdk/react"
import { ChatInterface } from "@/components/chat/chat-interface"
import { WelcomeScreenWithInput } from "@/components/chat/welcome-screen-with-input"
import { Header } from "@/components/layout/header"
import { UserProfile } from "@/components/user/user-profile"
import type { Session } from "next-auth"

interface ChatPageClientProps {
  session: Session
}

export default function ChatPageClient({ session }: ChatPageClientProps) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    setMessages,
  } = useChat({
    api: "/api/chat",
    onError: error => {
      console.error("Chat error:", error)
    },
    onFinish: message => {
      console.log("Message finished:", message)
    },
  })

  const hasMessages = messages.length > 0

  const onStarterQuestion = useCallback(
    (question: string) => {
      // Create a proper event object for handleInputChange
      const fakeEvent = {
        target: { value: question },
      } as React.ChangeEvent<HTMLTextAreaElement>

      handleInputChange(fakeEvent)

      // Use setTimeout to ensure the input is set before submitting
      setTimeout(() => {
        const fakeSubmitEvent = {
          preventDefault: () => {},
        } as React.FormEvent<HTMLFormElement>

        handleSubmit(fakeSubmitEvent)
      }, 0)
    },
    [handleInputChange, handleSubmit]
  )

  return (
    <div className="flex h-screen bg-background">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header session={session} />

        <div className="flex-1 flex">
          {/* User Profile Sidebar - Hidden on mobile */}
          <div className="hidden lg:block w-80 border-r border-border bg-card">
            <UserProfile user={session.user} />
          </div>
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {hasMessages ? (
              <ChatInterface
                messages={messages}
                input={input}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
                error={error}
              />
            ) : (
              <WelcomeScreenWithInput
                input={input}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
                onStarterQuestion={onStarterQuestion}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
