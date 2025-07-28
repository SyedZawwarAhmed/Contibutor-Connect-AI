"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChatMessage } from "@/components/chat/chat-message"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain } from "lucide-react"

export default function TestQlooChatPage() {
  const [showDemo, setShowDemo] = useState(false)
  const [demoData, setDemoData] = useState<any>(null)

  const loadDemoData = async () => {
    try {
      const response = await fetch("/api/test-qloo-enhanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "Find me Python data science projects" })
      })
      
      const result = await response.json()
      if (result.success) {
        setDemoData(result.data)
        setShowDemo(true)
      }
    } catch (error) {
      console.error("Failed to load demo data:", error)
    }
  }

  // Create a mock message with Qloo data embedded in content
  const createMockMessage = () => {
    if (!demoData) return null

    return {
      id: "demo-message",
      role: "assistant" as const,
      content: `Based on your interest in Python data science projects and cultural intelligence analysis, here are some personalized recommendations:

## Recommended Projects

### 1. **pandas** - Data Manipulation Library
A powerful data analysis and manipulation library for Python. Perfect for data science workflows.

### 2. **matplotlib** - Plotting Library  
Create static, animated, and interactive visualizations in Python.

### 3. **scikit-learn** - Machine Learning Library
Simple and efficient tools for predictive data analysis built on NumPy, SciPy, and matplotlib.

These projects have been selected based on both technical relevance and cultural community fit analysis provided by Qloo's Taste AI.

<!-- QLOO_INSIGHTS:${JSON.stringify(demoData.qloo_insights)} -->
<!-- QLOO_METADATA:${JSON.stringify(demoData.metadata)} -->
<!-- CULTURALLY_ENHANCED_PROJECTS:${JSON.stringify(demoData.culturally_enhanced_projects)} -->`
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Qloo Chat Integration Test
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Test the enhanced chat interface with rich Qloo cultural intelligence data and interactive charts
        </p>
        
        {!showDemo && (
          <Button 
            onClick={loadDemoData}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Brain className="mr-2 h-4 w-4" />
            Load Qloo Chat Demo
          </Button>
        )}
      </div>

      {showDemo && demoData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Enhanced Chat Message with Qloo Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChatMessage 
              message={createMockMessage()!}
              isLoading={false}
            />
          </CardContent>
        </Card>
      )}

      {showDemo && (
        <div className="mt-6 text-center">
          <Button 
            variant="outline"
            onClick={() => setShowDemo(false)}
          >
            Hide Demo
          </Button>
        </div>
      )}
    </div>
  )
}