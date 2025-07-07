// scripts/reset-user-data.ts
// Run this script to delete existing user and force fresh creation

import { prisma } from "../lib/prisma"

async function resetUserData(email: string) {
  try {
    // Delete all related data first (sessions, accounts)
    await prisma.session.deleteMany({
      where: {
        user: {
          email: email,
        },
      },
    })

    await prisma.account.deleteMany({
      where: {
        user: {
          email: email,
        },
      },
    })

    // Delete the user
    await prisma.user.delete({
      where: {
        email: email,
      },
    })

    console.log(`✅ User data reset for ${email}`)
    console.log("Sign in again to get fresh GitHub data")
  } catch (error) {
    console.error("Error resetting user data:", error)
  } finally {
    await prisma.$disconnect()
  }
}

// Replace with your email
resetUserData("umershaikh217@gmail.com")
