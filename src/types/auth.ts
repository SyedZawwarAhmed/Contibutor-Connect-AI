// types/auth.ts - Extended NextAuth types

import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      // Core GitHub fields
      githubUsername?: string
      githubId?: number
      company?: string | null
      blog?: string | null
      location?: string | null
      bio?: string | null
      twitterUsername?: string | null

      // Statistics
      publicRepos?: number
      publicGists?: number
      followers?: number
      following?: number

      // Timestamps
      githubCreatedAt?: string
      githubUpdatedAt?: string

      // Additional fields
      hireable?: boolean | null
      siteAdmin?: boolean

      // Plan information
      plan?: {
        name: string
        space: number
        collaborators: number
        privateRepos: number
      } | null
    } & DefaultSession["user"]
  }

  interface User {
    // All the same extended fields as Session
    githubUsername?: string
    githubId?: number
    githubNodeId?: string
    githubUrl?: string
    company?: string | null
    blog?: string | null
    location?: string | null
    bio?: string | null
    twitterUsername?: string | null
    publicRepos?: number
    publicGists?: number
    followers?: number
    following?: number
    githubCreatedAt?: string
    githubUpdatedAt?: string
    hireable?: boolean | null
    siteAdmin?: boolean
    privateGists?: number
    totalPrivateRepos?: number
    ownedPrivateRepos?: number
    diskUsage?: number
    collaborators?: number
    twoFactorAuthentication?: boolean
    plan?: {
      name: string
      space: number
      collaborators: number
      privateRepos: number
    } | null
  }
}

// Custom type for GitHub plan
export interface GitHubPlan {
  name: string
  space: number
  collaborators: number
  privateRepos: number
}
