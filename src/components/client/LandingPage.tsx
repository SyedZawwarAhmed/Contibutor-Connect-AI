"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Github,
  Sparkles,
  Users,
  ArrowRight,
  Star,
  GitFork,
  TrendingUp,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { ThemeSelector } from "@/components/theme/theme-selector"
import SignIn from "../signin-github"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Github className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              ContributorConnect AI
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeSelector />
            <ThemeToggle />

            <SignIn
              text="Sign in with GitHub"
              size={`sm`}
              iconAfter={<></>}
              className="text-sm"
            />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <Badge variant="secondary" className="px-4 py-2">
              <Sparkles className="mr-2 h-4 w-4" />
              AI-Powered Open Source Discovery
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground max-w-4xl mx-auto">
              Find Your Perfect
              <span className="text-primary"> Open Source</span> Project
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Bridge the gap between your skills and open-source needs. Let AI
              analyze your GitHub profile and discover projects that match your
              expertise and interests.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignIn
              text="Get Started with GitHub"
              size="lg"
              className="text-lg px-8 py-6"
              iconAfter={<ArrowRight className="h-5 w-5" />}
            />

            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 bg-transparent"
            >
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How ContributorConnect AI Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our AI analyzes your GitHub activity and preferences to recommend
            the perfect open-source projects for your next contribution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-border/50 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Github className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>GitHub Integration</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Connect your GitHub account to analyze your coding patterns,
                preferred languages, and contribution history.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>AI-Powered Matching</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Our advanced AI analyzes thousands of repositories to find
                projects that match your skills and interests.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Community Focus</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Discover welcoming communities and projects that actively
                encourage new contributors.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to Find Your Next Project?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of developers who have discovered their perfect
              open-source projects with ContributorConnect AI.
            </p>

            <SignIn
              text="Start Contributing Today"
              size="lg"
              className="text-lg px-8 py-6"
              iconAfter={<ArrowRight className="h-5 w-5" />}
            />
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <Github className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">
                ContributorConnect AI
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 ContributorConnect AI. Empowering open-source
              contributions.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
