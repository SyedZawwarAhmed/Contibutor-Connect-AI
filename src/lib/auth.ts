import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GitHub from "next-auth/providers/github"
import GitHubProvider from "next-auth/providers/github"
import { prisma } from "./prisma"
import { GitHubProfile } from "next-auth/providers/github"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email",
        },
      },
      // Custom profile function to extract all GitHub data
      profile(profile: GitHubProfile) {
        return {
          id: profile.id.toString(),
          name: profile.name ?? profile.login,
          email: profile.email,
          image: profile.avatar_url,
          // Extended GitHub fields
          githubUsername: profile.login,
          githubId: profile.id,
          githubNodeId: profile.node_id,
          githubUrl: profile.html_url,
          company: profile.company,
          blog: profile.blog,
          location: profile.location,
          bio: profile.bio,
          twitterUsername: profile.twitter_username,
          publicRepos: profile.public_repos,
          publicGists: profile.public_gists,
          followers: profile.followers,
          following: profile.following,
          githubCreatedAt: profile.created_at,
          githubUpdatedAt: profile.updated_at,
          hireable: profile.hireable,
          siteAdmin: profile.site_admin,
          plan: profile.plan
            ? {
                name: profile.plan.name,
                space: profile.plan.space,
                collaborators: profile.plan.collaborators,
                privateRepos: profile.plan.private_repos,
              }
            : null,
        }
      },
    }),
  ],
  callbacks: {
    // Update user data on every sign-in (for existing users)
    async signIn({ user, account, profile }) {
      if (account?.provider === "github" && profile) {
        try {
          // Update existing user with fresh GitHub data
          await prisma.user.update({
            where: { email: user.email! },
            data: {
              githubUsername: (profile as any).login,
              githubId: (profile as any).id,
              githubNodeId: (profile as any).node_id,
              githubUrl: (profile as any).html_url,
              company: (profile as any).company,
              blog: (profile as any).blog,
              location: (profile as any).location,
              bio: (profile as any).bio,
              twitterUsername: (profile as any).twitter_username,
              publicRepos: (profile as any).public_repos,
              publicGists: (profile as any).public_gists,
              followers: (profile as any).followers,
              following: (profile as any).following,
              githubCreatedAt: (profile as any).created_at,
              githubUpdatedAt: (profile as any).updated_at,
              hireable: (profile as any).hireable,
              siteAdmin: (profile as any).site_admin,
              plan: (profile as any).plan || null,
            },
          })
        } catch (error) {
          console.error("Error updating user GitHub data:", error)
          // Don't fail the sign-in if the update fails
        }
      }
      return true
    },
    // Include extended data in session
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
        // Include all the extended fields in the session
        githubUsername: (user as any).githubUsername,
        githubId: (user as any).githubId,
        company: (user as any).company,
        blog: (user as any).blog,
        location: (user as any).location,
        bio: (user as any).bio,
        twitterUsername: (user as any).twitterUsername,
        publicRepos: (user as any).publicRepos,
        publicGists: (user as any).publicGists,
        followers: (user as any).followers,
        following: (user as any).following,
        githubCreatedAt: (user as any).githubCreatedAt,
        githubUpdatedAt: (user as any).githubUpdatedAt,
        hireable: (user as any).hireable,
        siteAdmin: (user as any).siteAdmin,
        plan: (user as any).plan,
      },
    }),
  },
})
