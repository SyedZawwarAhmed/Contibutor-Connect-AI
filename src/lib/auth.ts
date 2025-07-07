import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GitHub from "next-auth/providers/github"
import { prisma } from "./prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "github" && profile) {
        // Store GitHub username in the user object
        user.githubUsername = (profile as any).login
      }
      return true
    },
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
        githubUsername: (user as any).githubUsername,
      },
    }),
  },
  pages: {
    signIn: "/", // Redirect to home if sign-in fails
  },
})
