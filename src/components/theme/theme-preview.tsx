"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, Github } from "lucide-react"
import type { ThemePalette } from "@/lib/themes"

interface ThemePreviewProps {
  palette: ThemePalette
  mode: "light" | "dark"
}

export function ThemePreview({ palette, mode }: ThemePreviewProps) {
  const colors = mode === "light" ? palette.light : palette.dark

  return (
    <div
      className="p-4 rounded-lg border space-y-3 min-h-[200px]"
      style={{
        backgroundColor: colors.background,
        borderColor: colors.border,
        color: colors.foreground,
      }}
    >
      {/* Header Preview */}
      <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: colors.border }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
            <Github className="w-3 h-3" style={{ color: colors.background }} />
          </div>
          <span className="text-sm font-medium">ContributorConnect</span>
        </div>
        <Button
          size="sm"
          style={{
            backgroundColor: colors.primary,
            color: colors.background,
          }}
        >
          Button
        </Button>
      </div>

      {/* Chat Preview */}
      <div className="space-y-2">
        {/* User Message */}
        <div className="flex justify-end">
          <div
            className="px-3 py-2 rounded-lg text-xs max-w-[70%]"
            style={{
              backgroundColor: colors.primary,
              color: colors.background,
            }}
          >
            Find me a React project
          </div>
        </div>

        {/* AI Message */}
        <div className="flex gap-2">
          <Avatar className="w-6 h-6">
            <AvatarFallback style={{ backgroundColor: colors.muted }}>
              <Bot className="w-3 h-3" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div
              className="px-3 py-2 rounded-lg text-xs"
              style={{
                backgroundColor: colors.muted,
                color: colors.mutedForeground,
              }}
            >
              Here's a great React project for you!
            </div>
            {/* Project Card Preview */}
            <Card
              className="mt-2 text-xs"
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
            >
              <CardHeader className="p-2">
                <CardTitle className="text-xs" style={{ color: colors.cardForeground }}>
                  facebook/react
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-0 space-y-1">
                <div className="flex gap-1">
                  <Badge
                    className="text-xs px-1 py-0"
                    style={{
                      backgroundColor: colors.secondary,
                      color: colors.secondaryForeground,
                    }}
                  >
                    JavaScript
                  </Badge>
                  <Badge
                    className="text-xs px-1 py-0"
                    style={{
                      backgroundColor: colors.success + "20",
                      color: colors.success,
                    }}
                  >
                    React
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
