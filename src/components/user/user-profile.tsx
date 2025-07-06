"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Github, MapPin, Calendar, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  console.log("user data", user)

  // Mock additional data that would come from GitHub API
  const mockSkills = ["JavaScript", "TypeScript", "React", "Node.js", "Python"]
  const mockInterests = ["Web Development", "Machine Learning", "Open Source"]

  return (
    <div className="p-4 space-y-4">
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
              <h3 className="font-semibold text-sm">
                {user.name || "GitHub User"}
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Github className="h-3 w-3" />
                {user.email || "GitHub Account"}
              </p>
            </div>
          </div>

          {/* GitHub Profile Link */}
          {/* <Button variant="outline" size="sm" className="w-full mt-3" asChild>
            <a
              href={`https://github.com/${user.email?.split("@")[0] || ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-3 w-3" />
              View GitHub Profile
            </a>
          </Button> */}
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Connected via GitHub OAuth
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Profile Analysis</CardTitle>
          <p className="text-xs text-muted-foreground">
            Based on your GitHub activity (mock data)
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">
              Detected Skills
            </h4>
            <div className="flex flex-wrap gap-1">
              {mockSkills.map(skill => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">GitHub Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
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
          <p className="text-xs text-muted-foreground mt-2">
            Connect GitHub API for detailed stats
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
