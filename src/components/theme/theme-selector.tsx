"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Check, Palette } from "lucide-react"
import { useThemePalette } from "./enhanced-theme-provider"
import { themePalettes } from "@/lib/themes"

export function ThemeSelector() {
  const { palette, setPalette, currentPalette } = useThemePalette()
  const [open, setOpen] = useState(false)
  const [, forceUpdate] = useState({})

  useEffect(() => {
    forceUpdate({})
  }, [palette])

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Palette className="h-4 w-4" />
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background"
            style={{ backgroundColor: currentPalette.preview.primary }}
          />
          <span className="sr-only">Select theme palette</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-2" align="end">
        <div className="space-y-2">
          <div className="px-2 py-1.5">
            <h4 className="text-sm font-medium">Choose Theme Palette</h4>
            <p className="text-xs text-muted-foreground">
              Select from our curated color schemes
            </p>
          </div>

          <div className="grid gap-2">
            {themePalettes.map(themePalette => (
              <Card
                key={themePalette.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  palette === themePalette.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => {
                  setPalette(themePalette.id)
                  setOpen(false)
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-sm">
                        {themePalette.name}
                      </h5>
                      {palette === themePalette.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    {themePalette.id === "sunset" && (
                      <Badge variant="secondary" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mb-3">
                    {themePalette.description}
                  </p>

                  {/* Color Preview */}
                  <div className="flex gap-1">
                    <div
                      className="w-6 h-6 rounded-md border border-border/50"
                      style={{ backgroundColor: themePalette.preview.primary }}
                      title="Primary"
                    />
                    <div
                      className="w-6 h-6 rounded-md border border-border/50"
                      style={{
                        backgroundColor: themePalette.preview.secondary,
                      }}
                      title="Secondary"
                    />
                    <div
                      className="w-6 h-6 rounded-md border border-border/50"
                      style={{ backgroundColor: themePalette.preview.accent }}
                      title="Accent"
                    />
                    <div
                      className="w-6 h-6 rounded-md border border-border/50"
                      style={{
                        backgroundColor: themePalette.preview.background,
                      }}
                      title="Background"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="px-2 py-1 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Current:{" "}
              <span className="font-medium">{currentPalette.name}</span>
            </p>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
