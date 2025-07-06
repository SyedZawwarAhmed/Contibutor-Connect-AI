"use client"

import { useThemePalette } from "./enhanced-theme-provider"
import { useTheme } from "next-themes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function ThemeDebug() {
  const { palette, currentPalette } = useThemePalette()
  const { theme } = useTheme()

  return (
    <Card className="fixed bottom-4 right-4 w-64 z-50 opacity-90 hover:opacity-100 transition-opacity">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Theme Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs">Palette:</span>
          <Badge variant="outline" className="text-xs">
            {currentPalette.name}
          </Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs">Mode:</span>
          <Badge variant="outline" className="text-xs">
            {theme}
          </Badge>
        </div>
        <div className="grid grid-cols-4 gap-1 mt-2">
          <div className="w-4 h-4 rounded bg-primary border" title="Primary" />
          <div className="w-4 h-4 rounded bg-secondary border" title="Secondary" />
          <div className="w-4 h-4 rounded bg-accent border" title="Accent" />
          <div className="w-4 h-4 rounded bg-muted border" title="Muted" />
        </div>
      </CardContent>
    </Card>
  )
}
