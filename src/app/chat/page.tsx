import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import ChatPageClient from "@/components/client/ChatPage"

export default async function ChatPage() {
  const session = await auth()

  if (!session) {
    redirect("/")
  }

  return <ChatPageClient session={session} />
}
