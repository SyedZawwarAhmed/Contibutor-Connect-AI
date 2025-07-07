import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import DashboardPageClient from "@/components/client/DashboardPage"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/")
  }

  return <DashboardPageClient session={session} />
}
