"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search, RotateCcw } from "lucide-react"

interface EmptyStateProps {
  title: string
  description: string
  onReset?: () => void
}

export function EmptyState({ title, description, onReset }: EmptyStateProps) {
  return (
    <Card className="border-dashed border-2 border-border/50">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
        {onReset && (
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Filters
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
