"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Github,
  MapPin,
  Calendar,
  ExternalLink,
  Building,
  Globe,
  Twitter,
  Crown,
  Users,
  Star,
  GitFork,
} from "lucide-react"
import { useSession } from "next-auth/react"

export function DashboardSidebar() {
  const { data: session } = useSession()
  const user = session?.user

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

  // Get GitHub join date
  const githubJoinDate = (user as any).githubCreatedAt
    ? new Date((user as any).githubCreatedAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : null

  // Extract skills from bio
  const extractSkillsFromBio = (bio: string | null) => {
    if (!bio) return []
    const skills = bio
      .split("||")
      .map(skill => skill.trim())
      .filter(Boolean)
    return skills.slice(0, 5) // Limit to 5 skills
  }

  const userSkills = extractSkillsFromBio((user as any).bio)

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
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">
                  Welcome, {user.name || "User"}!
                </h3>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Github className="h-3 w-3" />@
                {(user as any).githubUsername || user.email || "GitHub User"}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Bio */}
          {(user as any).bio && (
            <div className="space-y-1">
              <p className="text-xs text-foreground leading-relaxed">
                {(user as any).bio.replace(/\r\n/g, " ").trim()}
              </p>
            </div>
          )}

          {/* Location */}
          {(user as any).location && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {(user as any).location}
            </div>
          )}

          {/* Company */}
          {(user as any).company && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building className="h-3 w-3" />
              {(user as any).company}
            </div>
          )}

          {/* Blog/Website */}
          {(user as any).blog && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              <a
                href={
                  (user as any).blog.startsWith("http")
                    ? (user as any).blog
                    : `https://${(user as any).blog}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline truncate"
              >
                Portfolio
              </a>
            </div>
          )}

          {/* Twitter */}
          {(user as any).twitterUsername && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Twitter className="h-3 w-3" />
              <a
                href={`https://twitter.com/${(user as any).twitterUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                @{(user as any).twitterUsername}
              </a>
            </div>
          )}

          {/* Join Date */}
          {githubJoinDate && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Joined {githubJoinDate}
            </div>
          )}

          {/* GitHub Profile Link */}
          {(user as any).githubUsername && (
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-transparent"
              asChild
            >
              <a
                href={`https://github.com/${(user as any).githubUsername}`}
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

      {/* GitHub Statistics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">GitHub Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-lg font-bold text-primary">
                <Star className="h-4 w-4" />
                {(user as any).publicRepos || 0}
              </div>
              <p className="text-xs text-muted-foreground">Repos</p>
            </div>

            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-lg font-bold text-primary">
                <Users className="h-4 w-4" />
                {(user as any).followers || 0}
              </div>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>

            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-lg font-bold text-primary">
                <GitFork className="h-4 w-4" />
                {(user as any).following || 0}
              </div>
              <p className="text-xs text-muted-foreground">Following</p>
            </div>

            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold text-primary">
                {(user as any).publicGists || 0}
              </div>
              <p className="text-xs text-muted-foreground">Gists</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Profile Analysis</CardTitle>
          <p className="text-xs text-muted-foreground">
            From your GitHub profile
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">
              Expertise Areas
            </h4>
            {userSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {userSkills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">
                  Software Engineer
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Developer
                </Badge>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">
              Areas of Interest
            </h4>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">
                Web Development
              </Badge>
              <Badge variant="outline" className="text-xs">
                Open Source
              </Badge>
              <Badge variant="outline" className="text-xs">
                Blockchain
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
