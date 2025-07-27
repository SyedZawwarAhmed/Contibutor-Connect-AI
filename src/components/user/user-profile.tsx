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
  Shield,
  Crown,
  Users,
  GitFork,
  Star,
} from "lucide-react"
import type { User } from "next-auth"

interface UserProfileProps {
  user?: User | null
}

export function UserProfile({ user }: UserProfileProps) {
  if (!user) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No user data available</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // All data is now available directly from the user object (no API calls needed!)
  const githubJoinDate = user.githubCreatedAt
    ? new Date(user.githubCreatedAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : null

  return (
    <div className="p-4 space-y-4">
      {/* User Profile Card */}
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
                  {user.name || "GitHub User"}
                </h3>
                {user.siteAdmin && (
                  <Badge variant="destructive" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Github className="h-3 w-3" />@
                {user.githubUsername || "Unknown"}
              </p>
            </div>
          </div>

          {/* GitHub Profile Link */}
          {user.githubUsername && (
            <Button variant="outline" size="sm" className="w-full mt-3" asChild>
              <a
                href={`https://github.com/${user.githubUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-3 w-3" />
                View GitHub Profile
              </a>
            </Button>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Bio */}
          {user.bio && (
            <div className="space-y-1">
              <p className="text-xs text-foreground leading-relaxed">
                {user.bio.replace(/\r\n/g, " ").trim()}
              </p>
            </div>
          )}

          {/* Location */}
          {user.location && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {user.location}
            </div>
          )}

          {/* Company */}
          {user.company && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building className="h-3 w-3" />
              {user.company}
            </div>
          )}

          {/* Blog/Website */}
          {user.blog && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              <a
                href={
                  user.blog.startsWith("http")
                    ? user.blog
                    : `https://${user.blog}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline truncate"
              >
                {user.blog}
              </a>
            </div>
          )}

          {/* Twitter */}
          {user.twitterUsername && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Twitter className="h-3 w-3" />
              <a
                href={`https://twitter.com/${user.twitterUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                @{user.twitterUsername}
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
        </CardContent>
      </Card>

      {/* GitHub Statistics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">GitHub Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-xl font-bold text-primary">
                {user.publicRepos || 0}
              </div>
              <p className="text-xs text-muted-foreground">Repositories</p>
            </div>

            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-xl font-bold text-primary">
                {user.followers || 0}
              </div>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>

            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-xl font-bold text-primary">
                {user.following || 0}
              </div>
              <p className="text-xs text-muted-foreground">Following</p>
            </div>

            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-xl font-bold text-primary">
                {user.publicGists || 0}
              </div>
              <p className="text-xs text-muted-foreground">Gists</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
