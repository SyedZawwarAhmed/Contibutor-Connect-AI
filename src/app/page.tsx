import LandingPage from "@/components/client/LandingPage"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth()

  // If user is authenticated, redirect to chat
  if (session) {
    redirect("/chat")
  }

  return <LandingPage />
}
