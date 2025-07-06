"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemePreview } from "./theme-preview"
import { useThemePalette } from "./enhanced-theme-provider"
import { useTheme } from "next-themes"
import { themePalettes } from "@/lib/themes"
import { Palette, Sun, Moon, Monitor } from "lucide-react"

export function ThemeSettings() {
  const { palette, setPalette, currentPalette } = useThemePalette()
  const { theme, setTheme } = useTheme()
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("light")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Theme Settings</h2>
        <p className="text-muted-foreground">Customize your ContributorConnect AI experience</p>
      </div>

      <Tabs defaultValue="palette" className="space-y-4">
        <TabsList>
          <TabsTrigger value="palette">Color Palette</TabsTrigger>
          <TabsTrigger value="mode">Light/Dark Mode</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="palette" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Color Palettes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {themePalettes.map((themePalette) => (
                  <Card
                    key={themePalette.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      palette === themePalette.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setPalette(themePalette.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{themePalette.name}</h3>
                        {themePalette.id === "indigo" && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{themePalette.description}</p>
                      <div className="flex gap-2">
                        {Object.entries(themePalette.preview).map(([key, color]) => (
                          <div
                            key={key}
                            className="w-8 h-8 rounded-md border border-border/50"
                            style={{ backgroundColor: color }}
                            title={key}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mode" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  onClick={() => setTheme("light")}
                  className="h-20 flex-col gap-2"
                >
                  <Sun className="h-6 w-6" />
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  onClick={() => setTheme("dark")}
                  className="h-20 flex-col gap-2"
                >
                  <Moon className="h-6 w-6" />
                  Dark
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  onClick={() => setTheme("system")}
                  className="h-20 flex-col gap-2"
                >
                  <Monitor className="h-6 w-6" />
                  System
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Theme Preview</CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={previewMode === "light" ? "default" : "outline"}
                  onClick={() => setPreviewMode("light")}
                >
                  Light
                </Button>
                <Button
                  size="sm"
                  variant={previewMode === "dark" ? "default" : "outline"}
                  onClick={() => setPreviewMode("dark")}
                >
                  Dark
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ThemePreview palette={currentPalette} mode={previewMode} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
