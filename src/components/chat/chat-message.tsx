// src/components/chat/chat-message.tsx (Enhanced with MCP Support)
"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { ProjectCard } from "./project-card"
import { Bot, User, Sparkles, Database, Zap } from "lucide-react"
import { LoadingDots } from "@/components/ui/loading-dots"
import type { Message } from "ai"
import { useEffect, useState, useRef } from "react"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
interface ChatMessageProps {
  message: Message
  isLoading?: boolean
  onProjectRequest?: (query: string) => void
}

export interface ProjectData {
  name: string
  description: string
  githubUrl: string
  languages: string[]
  topics: string[]
  stars?: number
  difficulty: "beginner" | "intermediate" | "advanced"
  explanation: string
  contributionTypes: string[]
  contributionScore?: number
  recommendationReason?: string
}

interface StructuredResponse {
  projects: ProjectData[]
  reasoning: string
  user_analysis?: {
    experience_level: string
    primary_languages: string[]
    suggested_focus_areas: string[]
  }
}

interface MCPMetadata {
  mcp_search_total?: number
  beginner_repos_found?: number
  trending_repos_found?: number
  mcp_error?: string
  user_analysis_used?: boolean
}

const MarkdownComponents = {
  // Headings
  h1: ({ children }: any) => (
    <h1 className="text-xl font-bold text-foreground mb-3 mt-4 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-lg font-semibold text-foreground mb-2 mt-3 first:mt-0 flex items-center gap-2">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-base font-semibold text-foreground mb-2 mt-3 first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }: any) => (
    <h4 className="text-sm font-semibold text-foreground mb-1 mt-2 first:mt-0">
      {children}
    </h4>
  ),

  // Paragraphs
  p: ({ children }: any) => (
    <p className="text-sm text-foreground leading-relaxed mb-3 last:mb-0">
      {children}
    </p>
  ),

  // Lists
  ul: ({ children }: any) => (
    <ul className="space-y-1 mb-3 ml-4">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="space-y-1 mb-3 ml-4 list-decimal">{children}</ol>
  ),
  li: ({ children }: any) => (
    <li className="text-sm text-foreground leading-relaxed flex items-start gap-2">
      <span className="text-primary mt-1.5 w-1 h-1 rounded-full bg-current flex-shrink-0" />
      <span>{children}</span>
    </li>
  ),

  // Emphasis
  strong: ({ children }: any) => (
    <strong className="font-semibold text-primary">{children}</strong>
  ),
  em: ({ children }: any) => (
    <em className="italic text-muted-foreground">{children}</em>
  ),

  // Code
  code: ({ inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || "")
    const language = match ? match[1] : ""

    if (!inline && language) {
      return (
        <div className="my-3">
          <SyntaxHighlighter
            style={oneDark}
            language={language}
            PreTag="div"
            className="rounded-md text-xs"
            {...props}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
        </div>
      )
    }

    return (
      <code
        className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground border"
        {...props}
      >
        {children}
      </code>
    )
  },

  // Links
  a: ({ href, children }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:text-primary/80 underline underline-offset-2 font-medium"
    >
      {children}
    </a>
  ),

  // Blockquotes
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-primary pl-4 py-2 bg-muted/30 rounded-r-md mb-3 italic text-muted-foreground">
      {children}
    </blockquote>
  ),

  // Tables
  table: ({ children }: any) => (
    <div className="overflow-x-auto mb-3">
      <table className="min-w-full border border-border rounded-md">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => <thead className="bg-muted">{children}</thead>,
  tbody: ({ children }: any) => <tbody>{children}</tbody>,
  tr: ({ children }: any) => (
    <tr className="border-b border-border">{children}</tr>
  ),
  th: ({ children }: any) => (
    <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="px-3 py-2 text-xs text-foreground">{children}</td>
  ),

  // Horizontal rule
  hr: () => <hr className="border-border my-4" />,
}

function MessageContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown components={MarkdownComponents}>{content}</ReactMarkdown>
    </div>
  )
}

export function ChatMessage({
  message,
  isLoading,
  onProjectRequest,
}: ChatMessageProps) {
  const isUser = message.role === "user"
  const [structuredData, setStructuredData] =
    useState<StructuredResponse | null>(null)
  const [mcpMetadata, setMcpMetadata] = useState<MCPMetadata | null>(null)
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const processedMessageIds = useRef(new Set<string>())

  // Enhanced project detection for MCP integration
  useEffect(() => {
    if (processedMessageIds.current.has(message.id)) {
      return
    }

    if (!isUser && message.content && !isLoading && !structuredData) {
      const content = message.content.toLowerCase()
      const projectKeywords = [
        "find projects",
        "recommend projects",
        "show me projects",
        "project for",
        "contribute to",
        "open source",
        "repository",
        "repos",
        "beginner friendly",
        "trending",
        "github",
      ]

      const shouldFetchProjects = projectKeywords.some(keyword =>
        content.includes(keyword)
      )

      if (shouldFetchProjects && onProjectRequest) {
        processedMessageIds.current.add(message.id)
        setIsLoadingProjects(true)
        fetchEnhancedRecommendations(message.content)
      }
    }
  }, [message.id, message.content, isUser, isLoading, structuredData])

  const fetchEnhancedRecommendations = async (query: string) => {
    try {
      // Try MCP-enhanced recommendations first
      const mcpResponse = await fetch("/api/recommendations/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })

      if (mcpResponse.ok) {
        const mcpData = await mcpResponse.json()
        console.log("MCP enhanced data", mcpData)

        if (mcpData.success && mcpData.data.projects) {
          setStructuredData(mcpData.data)
          setMcpMetadata(mcpData.metadata)
          return
        }
      }

      // Fallback to regular recommendations
      const fallbackResponse = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json()
        if (fallbackData.success && fallbackData.data.projects) {
          setStructuredData(fallbackData.data)
        }
      }
    } catch (error) {
      console.error("Failed to fetch enhanced recommendations:", error)
    } finally {
      setIsLoadingProjects(false)
    }
  }

  const formatDifficulty = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return { text: "Beginner Friendly", color: "text-green-600" }
      case "intermediate":
        return { text: "Intermediate", color: "text-yellow-600" }
      case "advanced":
        return { text: "Advanced", color: "text-red-600" }
      default:
        return { text: "Any Level", color: "text-gray-600" }
    }
  }

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarFallback>
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={`flex flex-col space-y-2 max-w-[80%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <Card
          className={`p-4 ${
            isUser ? "bg-primary text-primary-foreground ml-12" : "bg-muted"
          }`}
        >
          {isLoading && !message.content ? (
            <LoadingDots />
          ) : (
            <div className="space-y-2">
              <div className="leading-relaxed">
                <MessageContent content={message.content} />
              </div>

              {/* Enhanced reasoning with MCP info */}
              {structuredData?.reasoning && !isUser && (
                <div className="mt-3 p-3 bg-primary/10 rounded-lg border-l-2 border-primary">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-primary">
                      AI Analysis
                    </span>
                    {mcpMetadata?.user_analysis_used && (
                      <Database className="h-3 w-3 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    {structuredData.reasoning}
                  </p>
                </div>
              )}

              {/* User analysis from MCP */}
              {structuredData?.user_analysis && !isUser && (
                <div className="mt-2 p-2 bg-secondary/50 rounded border">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-3 w-3 text-secondary-foreground" />
                    <span className="text-xs font-medium text-secondary-foreground">
                      Your Profile Analysis
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                      Experience:{" "}
                      {structuredData.user_analysis.experience_level}
                    </div>
                    <div>
                      Languages:{" "}
                      {structuredData.user_analysis.primary_languages.join(
                        ", "
                      )}
                    </div>
                    <div>
                      Focus Areas:{" "}
                      {structuredData.user_analysis.suggested_focus_areas.join(
                        ", "
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Loading state for project recommendations */}
        {isLoadingProjects && !isUser && (
          <Card className="bg-muted/30 border-dashed border-primary/30">
            <div className="p-4 text-center">
              <LoadingDots />
              <p className="text-xs text-muted-foreground mt-2 font-medium flex items-center justify-center gap-1">
                <Zap className="h-3 w-3" />
                Analyzing GitHub repositories with live data...
              </p>
            </div>
          </Card>
        )}

        {/* Enhanced project recommendations with MCP metadata */}
        {structuredData?.projects && !isUser && (
          <div className="space-y-3 w-full">
            <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {mcpMetadata?.user_analysis_used ? "Live GitHub" : "AI"}{" "}
                Recommendations
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                {structuredData.projects.length} projects found
              </span>
              {mcpMetadata?.user_analysis_used && (
                <Database className="h-3 w-3 text-primary" />
              )}
            </div>

            {/* MCP metadata info */}
            {mcpMetadata && (
              <div className="text-xs text-muted-foreground bg-secondary/30 p-2 rounded border">
                <div className="flex items-center gap-4 flex-wrap">
                  {mcpMetadata.mcp_search_total !== undefined && (
                    <span>
                      📊 {mcpMetadata.mcp_search_total} repos analyzed
                    </span>
                  )}
                  {mcpMetadata.beginner_repos_found !== undefined &&
                    mcpMetadata.beginner_repos_found > 0 && (
                      <span>
                        🎯 {mcpMetadata.beginner_repos_found} beginner-friendly
                      </span>
                    )}
                  {mcpMetadata.trending_repos_found !== undefined &&
                    mcpMetadata.trending_repos_found > 0 && (
                      <span>
                        📈 {mcpMetadata.trending_repos_found} trending
                      </span>
                    )}
                  {mcpMetadata.mcp_error && (
                    <span className="text-warning">
                      ⚠️ Limited data: {mcpMetadata.mcp_error}
                    </span>
                  )}
                </div>
              </div>
            )}

            {structuredData.projects.map((project, index) => (
              <ProjectCard
                key={`${project.name}-${index}`}
                project={{
                  id: `structured-${index}`,
                  name: project.name,
                  description: project.description,
                  languages: project.languages,
                  topics: project.topics,
                  githubUrl: project.githubUrl,
                  explanation: project.explanation,
                  stars: project.stars,
                  difficulty: project.difficulty,
                  contributionTypes: project.contributionTypes,
                  contributionScore: project.contributionScore,
                  recommendationReason: project.recommendationReason,
                }}
                enhanced={true}
                showMCPBadge={mcpMetadata?.user_analysis_used}
              />
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <Avatar className="h-8 w-8 mt-1 ring-2 ring-primary/20">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
// // src/components/chat/chat-message.tsx (Enhanced Version)
// "use client"

// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { Card } from "@/components/ui/card"
// import { ProjectCard } from "./project-card"
// import { Bot, User, Sparkles } from "lucide-react"
// import { LoadingDots } from "@/components/ui/loading-dots"
// import type { Message } from "ai"
// import { useEffect, useState, useRef } from "react"

// interface ChatMessageProps {
//   message: Message
//   isLoading?: boolean
//   onProjectRequest?: (query: string) => void
// }

// export interface ProjectData {
//   name: string
//   description: string
//   githubUrl: string
//   languages: string[]
//   topics: string[]
//   stars?: number
//   difficulty: "beginner" | "intermediate" | "advanced"
//   explanation: string
//   contributionTypes: string[]
// }

// interface StructuredResponse {
//   projects: ProjectData[]
//   reasoning: string
// }

// function MessageContent({ content }: { content: string }) {
//   // Split content into paragraphs and format
//   const formatContent = (text: string) => {
//     const lines = text.split("\n")
//     const elements: any[] = []

//     lines.forEach((line, index) => {
//       const trimmedLine = line.trim()

//       if (!trimmedLine) {
//         // Empty line - add spacing
//         elements.push(<div key={`space-${index}`} className="h-2" />)
//         return
//       }

//       // Check for numbered lists (1. 2. 3.)
//       if (/^\d+\.\s/.test(trimmedLine)) {
//         elements.push(
//           <div key={index} className="flex gap-2 mb-2">
//             <span className="text-primary font-semibold text-sm min-w-[20px]">
//               {trimmedLine.match(/^\d+/)?.[0]}.
//             </span>
//             <span className="text-foreground text-sm leading-relaxed">
//               {trimmedLine.replace(/^\d+\.\s/, "")}
//             </span>
//           </div>
//         )
//         return
//       }

//       // Check for bullet points (-)
//       if (trimmedLine.startsWith("- ")) {
//         elements.push(
//           <div key={index} className="flex gap-2 mb-1 ml-2">
//             <span className="text-primary mt-1.5 w-1 h-1 rounded-full bg-current flex-shrink-0" />
//             <span className="text-foreground text-sm leading-relaxed">
//               {trimmedLine.replace(/^- /, "")}
//             </span>
//           </div>
//         )
//         return
//       }

//       // Check for headings (text ending with :)
//       if (trimmedLine.endsWith(":") && trimmedLine.length < 50) {
//         elements.push(
//           <h4
//             key={index}
//             className="font-semibold text-foreground text-sm mt-3 mb-1"
//           >
//             {trimmedLine}
//           </h4>
//         )
//         return
//       }

//       // Check for bold project names (**text**)
//       if (trimmedLine.includes("**")) {
//         const parts = trimmedLine.split("**")
//         elements.push(
//           <p
//             key={index}
//             className="text-foreground text-sm leading-relaxed mb-2"
//           >
//             {parts.map((part, i) =>
//               i % 2 === 1 ? (
//                 <strong key={i} className="font-semibold text-primary">
//                   {part}
//                 </strong>
//               ) : (
//                 part
//               )
//             )}
//           </p>
//         )
//         return
//       }

//       // Regular paragraph
//       elements.push(
//         <p key={index} className="text-foreground text-sm leading-relaxed mb-2">
//           {trimmedLine}
//         </p>
//       )
//     })

//     return elements
//   }

//   return <div className="space-y-1">{formatContent(content)}</div>
// }

// export function ChatMessage({
//   message,
//   isLoading,
//   onProjectRequest,
// }: ChatMessageProps) {
//   const isUser = message.role === "user"
//   const [structuredData, setStructuredData] =
//     useState<StructuredResponse | null>(null)
//   const [isLoadingProjects, setIsLoadingProjects] = useState(false)
//   // Track which messages we've already processed using message ID
//   const processedMessageIds = useRef(new Set<string>())

//   // Check if message content suggests project search and trigger structured request
//   useEffect(() => {
//     // Skip if already processed this message
//     if (processedMessageIds.current.has(message.id)) {
//       return
//     }

//     // Only process assistant messages that are complete (not loading)
//     if (!isUser && message.content && !isLoading && !structuredData) {
//       const content = message.content.toLowerCase()
//       const projectKeywords = [
//         "find projects",
//         "recommend projects",
//         "show me projects",
//         "project for",
//         "contribute to",
//         "open source",
//         "repository",
//         "repos",
//       ]

//       const shouldFetchProjects = projectKeywords.some(keyword =>
//         content.includes(keyword)
//       )

//       if (shouldFetchProjects && onProjectRequest) {
//         // Mark this message as processed
//         processedMessageIds.current.add(message.id)

//         setIsLoadingProjects(true)
//         fetchStructuredRecommendations(message.content)
//       }
//     }
//   }, [message.id, message.content, isUser, isLoading, structuredData])

//   const fetchStructuredRecommendations = async (query: string) => {
//     try {
//       const response = await fetch("/api/recommendations", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           query,
//         }),
//       })

//       if (response.ok) {
//         const data = await response.json()
//         console.log("structured data", data)
//         if (data.success && data.data.projects) {
//           setStructuredData(data.data)
//         }
//       }
//     } catch (error) {
//       console.error("Failed to fetch project recommendations:", error)
//     } finally {
//       setIsLoadingProjects(false)
//     }
//   }

//   const formatDifficulty = (difficulty: string) => {
//     switch (difficulty) {
//       case "beginner":
//         return { text: "Beginner Friendly", color: "text-green-600" }
//       case "intermediate":
//         return { text: "Intermediate", color: "text-yellow-600" }
//       case "advanced":
//         return { text: "Advanced", color: "text-red-600" }
//       default:
//         return { text: "Any Level", color: "text-gray-600" }
//     }
//   }

//   return (
//     <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
//       {!isUser && (
//         <Avatar className="h-8 w-8 mt-1">
//           <AvatarFallback>
//             <Bot className="h-4 w-4" />
//           </AvatarFallback>
//         </Avatar>
//       )}

//       <div
//         className={`flex flex-col space-y-2 max-w-[80%] ${
//           isUser ? "items-end" : "items-start"
//         }`}
//       >
//         <Card
//           className={`p-4 ${
//             isUser ? "bg-primary text-primary-foreground ml-12" : "bg-muted"
//           }`}
//         >
//           {isLoading ? (
//             <LoadingDots />
//           ) : (
//             <div className="space-y-2">
//               <div className="text-sm leading-relaxed whitespace-pre-wrap">
//                 <MessageContent content={message.content} />
//               </div>

//               {/* Show structured reasoning if available */}
//               {structuredData?.reasoning && !isUser && (
//                 <div className="mt-3 p-3 bg-primary/10 rounded-lg border-l-2 border-primary">
//                   <div className="flex items-center gap-2 mb-2">
//                     <Sparkles className="h-4 w-4 text-primary" />
//                     <span className="text-xs font-medium text-primary">
//                       AI Analysis
//                     </span>
//                   </div>
//                   <p className="text-xs text-muted-foreground italic">
//                     {structuredData.reasoning}
//                   </p>
//                 </div>
//               )}
//             </div>
//           )}
//         </Card>

//         {/* Loading state for project recommendations */}
//         {isLoadingProjects && !isUser && (
//           <Card className="bg-muted/30 border-dashed border-primary/30">
//             <div className="p-4 text-center">
//               <LoadingDots />
//               <p className="text-xs text-muted-foreground mt-2 font-medium">
//                 🔍 Analyzing your request and finding perfect projects...
//               </p>
//             </div>
//           </Card>
//         )}

//         {/* Show structured project recommendations */}
//         {structuredData?.projects && !isUser && (
//           <div className="space-y-3 w-full">
//             <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg border border-primary/20">
//               <Sparkles className="h-4 w-4 text-primary" />
//               <span className="text-sm font-semibold text-primary">
//                 Recommended Projects
//               </span>
//               <span className="text-xs text-muted-foreground ml-auto">
//                 {structuredData.projects.length} projects found
//               </span>
//             </div>

//             {structuredData.projects.map((project, index) => {
//               const difficultyInfo = formatDifficulty(project.difficulty)

//               return (
//                 <ProjectCard
//                   key={`${project.name}-${index}`}
//                   project={{
//                     id: `structured-${index}`,
//                     name: project.name,
//                     description: project.description,
//                     languages: project.languages,
//                     topics: project.topics,
//                     githubUrl: project.githubUrl,
//                     explanation: project.explanation,
//                     stars: project.stars,
//                     difficulty: project.difficulty,
//                     contributionTypes: project.contributionTypes,
//                   }}
//                   enhanced={true}
//                 />
//               )
//             })}
//           </div>
//         )}
//       </div>

//       {isUser && (
//         <Avatar className="h-8 w-8 mt-1 ring-2 ring-primary/20">
//           <AvatarImage src="/placeholder.svg?height=32&width=32" />
//           <AvatarFallback className="bg-primary text-primary-foreground">
//             <User className="h-4 w-4" />
//           </AvatarFallback>
//         </Avatar>
//       )}
//     </div>
//   )
// }
