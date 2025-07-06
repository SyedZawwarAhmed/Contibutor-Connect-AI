"use client"

import { useState } from "react"
import { useChat } from "ai/react"
import { ChatInterface } from "@/components/chat/chat-interface"
import { WelcomeScreenWithInput } from "@/components/chat/welcome-screen-with-input"
import { Header } from "@/components/layout/header"
import { UserProfile } from "@/components/user/user-profile"
import type { Session } from "next-auth"

interface ChatPageClientProps {
  session: Session
}

export default function ChatPageClient({ session }: ChatPageClientProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat()

  const hasMessages = messages.length > 0

  const onStarterQuestion = (question: string) => {
    // Create a proper event object for handleInputChange
    const fakeEvent = {
      target: { value: question },
    } as React.ChangeEvent<HTMLTextAreaElement>

    handleInputChange(fakeEvent)

    // Create a proper event object for handleSubmit
    const fakeSubmitEvent = {
      preventDefault: () => {},
    } as React.FormEvent<HTMLFormElement>

    handleSubmit(fakeSubmitEvent)
  }

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
