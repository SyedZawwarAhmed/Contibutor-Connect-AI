import { githubSignIn } from "@/app/actions/github-signin"
import SignInButton from "./client/SignInButton"
import { ArrowRight } from "lucide-react"

interface SignInProps {
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
  iconAfter?: React.ReactNode
}

export default function SignIn({
  text = "Continue with GitHub",
  variant = "outline",
  size = "lg",
  className = "text-lg px-6 py-4",
  iconAfter = <ArrowRight className="h-4 w-4" />,
}: SignInProps) {
  return (
    <SignInButton
      text={text}
      variant={variant}
      size={size}
      className={className}
      iconAfter={iconAfter}
      onSignIn={githubSignIn}
    />
  )
}
