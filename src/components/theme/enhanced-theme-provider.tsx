"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { getThemePalette, type ThemePalette } from "@/lib/themes"

interface ThemeContextType {
  palette: string
  setPalette: (palette: string) => void
  currentPalette: ThemePalette
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useThemePalette() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useThemePalette must be used within a ThemeProvider")
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultPalette?: string
}

export function EnhancedThemeProvider({
  children,
  defaultPalette = "sunset",
}: ThemeProviderProps) {
  const [palette, setPaletteState] = useState(defaultPalette)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedPalette = localStorage.getItem("theme-palette")
    if (savedPalette) {
      setPaletteState(savedPalette)
    }
  }, [])

  const setPalette = (newPalette: string) => {
    setPaletteState(newPalette)
    localStorage.setItem("theme-palette", newPalette)
    applyThemeColors(newPalette)
  }

  const applyThemeColors = (paletteId: string) => {
    const palette = getThemePalette(paletteId)
    const root = document.documentElement
    const isDark = root.classList.contains("dark")
    const colors = isDark ? palette.dark : palette.light

    // Apply CSS custom properties with HSL values
    Object.entries(colors).forEach(([key, value]) => {
      // Convert camelCase to kebab-case for CSS variables
      const cssVar = `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`
      root.style.setProperty(cssVar, value)
    })
  }

  useEffect(() => {
    if (mounted) {
      applyThemeColors(palette)
    }
  }, [palette, mounted])

  // Listen for theme changes to reapply colors
  useEffect(() => {
    if (mounted) {
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === "class"
          ) {
            applyThemeColors(palette)
          }
        })
      })

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      })

      return () => observer.disconnect()
    }
  }, [palette, mounted])

  if (!mounted) {
    return null
  }

  const currentPalette = getThemePalette(palette)

  return (
    <ThemeContext.Provider value={{ palette, setPalette, currentPalette }}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </NextThemesProvider>
    </ThemeContext.Provider>
  )
}
