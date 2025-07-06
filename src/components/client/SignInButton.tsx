"use client"

import { Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ReactNode, startTransition } from "react"

interface SignInButtonProps {
  text?: string
  variant?:
    | "default"
    | "outline"
    | "ghost"
    | "link"
    | "destructive"
    | "secondary"
  size?: "sm" | "lg" | "default" | "icon"
  className?: string
  iconAfter?: ReactNode
  onSignIn: () => Promise<void>
  disabled?: boolean
}

export default function SignInButton({
  text = "Sign in with GitHub",
  variant = "outline",
  size = "default",
  className,
  iconAfter,
  onSignIn,
  disabled = false,
}: SignInButtonProps) {
  const handleClick = () => {
    startTransition(async () => {
      await onSignIn()
    })
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={handleClick}
      disabled={disabled}
    >
      <Github className={cn("mr-2", size === "lg" ? "h-5 w-5" : "h-4 w-4")} />
      {text}
      {iconAfter && <span className="ml-2">{iconAfter}</span>}
    </Button>
  )
}
