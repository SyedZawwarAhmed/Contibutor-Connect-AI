"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { FilterSection } from "@/components/dashboard/filter-section"
import { ProjectGrid } from "@/components/dashboard/project-grid"
import { LoadingGrid } from "@/components/dashboard/loading-grid"
import { EmptyState } from "@/components/dashboard/empty-state"
import type { Session } from "next-auth"
export interface Project {
  id: string
  name: string
  description: string
  languages: string[]
  topics: string[]
  githubUrl: string
  stars: number
  forks: number
  lastUpdated: string
  explanation: string
}

export interface FilterState {
  location: string
  technologies: string[]
  domains: string[]
  projectSize: string
  difficulty: string
  contributionTypes: string[]
}
const initialFilters: FilterState = {
  location: "anywhere",
  technologies: [],
  domains: [],
  projectSize: "any",
  difficulty: "any",
  contributionTypes: [],
}

interface DashboardPageClientProps {
  session: Session
}

export default function DashboardPageClient({
  session,
}: DashboardPageClientProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleApplyFilters = async () => {
    setIsLoading(true)
    setHasSearched(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Mock project data with proper typing
      const mockProjects: Project[] = [
        {
          id: "1",
          name: "facebook/react",
          description: "The library for web and native user interfaces",
          languages: ["JavaScript", "TypeScript"],
          topics: ["react", "javascript", "library", "ui"],
          githubUrl: "https://github.com/facebook/react",
          stars: 218000,
          forks: 45000,
          lastUpdated: "2024-01-15",
          explanation:
            "Perfect match for your React expertise and interest in UI libraries. This project welcomes contributions and has excellent documentation.",
        },
        {
          id: "2",
          name: "microsoft/vscode",
          description: "Visual Studio Code - Open Source IDE",
          languages: ["TypeScript", "JavaScript"],
          topics: ["editor", "ide", "typescript", "electron"],
          githubUrl: "https://github.com/microsoft/vscode",
          stars: 155000,
          forks: 27000,
          lastUpdated: "2024-01-14",
          explanation:
            "Great for developers interested in editor tooling and TypeScript. Active community with clear contribution guidelines.",
        },
        {
          id: "3",
          name: "vercel/next.js",
          description: "The React Framework for the Web",
          languages: ["TypeScript", "JavaScript"],
          topics: ["react", "nextjs", "framework", "web"],
          githubUrl: "https://github.com/vercel/next.js",
          stars: 118000,
          forks: 25000,
          lastUpdated: "2024-01-16",
          explanation:
            "Ideal for React developers looking to contribute to a modern web framework. Excellent for learning advanced React patterns.",
        },
      ]

      setProjects(mockProjects)
    } catch (error) {
      console.error("Error fetching projects:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetFilters = () => {
    setFilters(initialFilters)
    setProjects([])
    setHasSearched(false)
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <Header session={session} />

        <div className="flex-1 flex">
          {/* Sidebar */}
          <DashboardSidebar />

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              <div className="p-6 space-y-6">
                {/* Page Header */}
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-foreground">
                    Discover Open-Source Projects
                  </h1>
                  <p className="text-muted-foreground">
                    Use filters below to find projects that match your interests
                    and expertise
                  </p>
                </div>

                {/* Filter Section */}
                <FilterSection
                  filters={filters}
                  onFiltersChange={setFilters}
                  onApplyFilters={handleApplyFilters}
                  onResetFilters={handleResetFilters}
                  isLoading={isLoading}
                />

                {/* Results Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-foreground">
                      {hasSearched
                        ? "Recommended Projects for You"
                        : "Your Personalized Recommendations"}
                    </h2>
                    {projects.length > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {projects.length} projects found
                      </span>
                    )}
                  </div>

                  {isLoading ? (
                    <LoadingGrid />
                  ) : projects.length > 0 ? (
                    <ProjectGrid projects={projects} />
                  ) : hasSearched ? (
                    <EmptyState
                      title="No projects found"
                      description="No projects found matching your current criteria. Try adjusting your filters or broadening your search!"
                      onReset={handleResetFilters}
                    />
                  ) : (
                    <EmptyState
                      title="Ready to discover projects?"
                      description="Apply filters above to discover projects tailored to your interests!"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
