"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Github,
  MapPin,
  Calendar,
  ExternalLink,
  Building,
  Globe,
} from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  fetchGitHubUser,
  fetchGitHubUserLanguages,
  type GitHubUser,
} from "@/lib/github-api"
import { useEffect, useState } from "react"

export function DashboardSidebar() {
  const { data: session } = useSession()
  const [githubData, setGithubData] = useState<GitHubUser | null>(null)
  const [languages, setLanguages] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)

  const user = session?.user
  const githubUsername = (user as any)?.githubUsername

  useEffect(() => {
    if (githubUsername) {
      setLoading(true)
      Promise.all([
        fetchGitHubUser(githubUsername),
        fetchGitHubUserLanguages(githubUsername),
      ])
        .then(([userData, languageData]) => {
          setGithubData(userData)
          setLanguages(languageData)
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [githubUsername])

  const topLanguages = Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([lang]) => lang)

  // Mock interests - in a real app, these could be derived from repo topics
  const mockInterests = ["Web Development", "Open Source", "UI/UX"]

  if (!user) {
    return (
      <div className="w-80 border-r border-border bg-card p-4 space-y-4 overflow-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              Please sign in to view your profile
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-80 border-r border-border bg-card p-4 space-y-4 overflow-auto">
      {/* User Profile */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.image || ""} alt={user.name || "User"} />
              <AvatarFallback>
                {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm">
                Welcome, {user.name || "User"}!
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Github className="h-3 w-3" />@
                {githubUsername || user.email || "GitHub User"}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ) : githubData ? (
            <div className="space-y-2">
              {githubData.bio && (
                <p className="text-xs text-foreground">{githubData.bio}</p>
              )}

              {githubData.location && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {githubData.location}
                </div>
              )}

              {githubData.company && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Building className="h-3 w-3" />
                  {githubData.company}
                </div>
              )}

              {githubData.blog && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Globe className="h-3 w-3" />
                  <a
                    href={
                      githubData.blog.startsWith("http")
                        ? githubData.blog
                        : `https://${githubData.blog}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline truncate"
                  >
                    {githubData.blog}
                  </a>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Joined{" "}
                {new Date(githubData.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Connected via GitHub OAuth
            </div>
          )}

          {githubUsername && (
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-transparent"
              asChild
            >
              <a
                href={`https://github.com/${githubUsername}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3 w-3 mr-2" />
                View GitHub Profile
              </a>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Profile Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Your Profile Analysis</CardTitle>
          <p className="text-xs text-muted-foreground">
            Based on your GitHub activity
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">
              Programming Languages
            </h4>
            {loading ? (
              <div className="flex flex-wrap gap-1">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-5 w-16" />
                ))}
              </div>
            ) : topLanguages.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {topLanguages.map(language => (
                  <Badge key={language} variant="secondary" className="text-xs">
                    {language}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">
                  JavaScript
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  TypeScript
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  React
                </Badge>
                <p className="text-xs text-muted-foreground w-full mt-1">
                  Default languages shown
                </p>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">
              Areas of Interest
            </h4>
            <div className="flex flex-wrap gap-1">
              {mockInterests.map(interest => (
                <Badge key={interest} variant="outline" className="text-xs">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GitHub Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">GitHub Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-8" />
                </div>
              ))}
            </div>
          ) : githubData ? (
            <>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Public Repos</span>
                <span className="font-medium">{githubData.public_repos}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Followers</span>
                <span className="font-medium">{githubData.followers}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Following</span>
                <span className="font-medium">{githubData.following}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Public Repos</span>
                <span className="font-medium">--</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Followers</span>
                <span className="font-medium">--</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Following</span>
                <span className="font-medium">--</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
