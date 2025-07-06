// import { signIn } from "@/lib/auth";

// export default function SignIn() {
//   return (
//     <form
//       action={async () => {
//         "use server";
//         await signIn("github");
//       }}
//     >
//       <button type="submit" className="bg-blue-500 text-white p-2 rounded-md">
//         Signin with GitHub
//       </button>
//     </form>
//   );
// }

"use client"

import { useState } from "react"
import { Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import clsx from "clsx"
import { ReactNode } from "react"
// import { signIn } from "@/lib/auth"

interface SignInProps {
  text: string
  variant?: "default" | "outline" | "ghost" | "link"
  size?: "sm" | "lg" | "default"
  className?: string
  iconAfter?: ReactNode
}

export default function SignIn({
  text,
  variant = "outline",
  size = "default",
  className,
  iconAfter,
}: SignInProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleGitHubAuth = async () => {
    setIsLoading(true)
    try {
      // await signIn("github")
      // setTimeout(() => {
      //   window.location.href = "/chat"
      // }, 2000)
    } catch (error) {
      console.error("GitHub Sign-in failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleGitHubAuth}
      disabled={isLoading}
      className={clsx(className)}
    >
      <Github className={clsx("mr-2", size === "lg" ? "h-5 w-5" : "h-4 w-4")} />
      {isLoading ? "Connecting..." : text}
      {iconAfter && <span className="ml-2">{iconAfter}</span>}
    </Button>
  )
}
