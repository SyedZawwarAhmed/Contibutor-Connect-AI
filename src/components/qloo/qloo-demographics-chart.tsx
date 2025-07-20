"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Users, TrendingUp } from "lucide-react"

interface DemographicData {
  entity_id: string
  query: {
    age: Record<string, number>
    gender: {
      male: number
      female: number
    }
  }
}

interface QlooDemographicsChartProps {
  demographics: DemographicData[]
  title?: string
  className?: string
}

export function QlooDemographicsChart({
  demographics,
  title = "Community Demographics",
  className,
}: QlooDemographicsChartProps) {
  if (!demographics || demographics.length === 0) {
    console.log("QlooDemographicsChart: No demographics data", {
      demographics,
      length: demographics?.length,
    })
    return null
  }

  console.log("QlooDemographicsChart: Demographics data received", {
    count: demographics.length,
    sample: demographics[0],
    allData: demographics,
  })

  // Prepare age distribution data from actual Qloo API response
  const ageData = demographics
    .map(demo => {
      const category =
        demo.entity_id
          .split(":")
          .pop()
          ?.replace(/media:|genre:|keyword:/, "") || "general"
      const ageEntries = Object.entries(demo.query.age || {})

      if (ageEntries.length === 0) return null

      const topAge = ageEntries.reduce((a, b) => (a[1] > b[1] ? a : b))

      return {
        category: category.charAt(0).toUpperCase() + category.slice(1),
        ageGroup: topAge[0].replace(/_/g, " "),
        affinity: Math.round(topAge[1] * 100),
        femalePreference: Math.round((demo.query.gender?.female || 0) * 100),
        malePreference: Math.round(
          Math.abs(demo.query.gender?.male || 0) * 100
        ),
      }
    })
    .filter(Boolean)
    .slice(0, 6)

  // Prepare gender distribution data for pie chart
  const totalFemalePreference =
    demographics.reduce(
      (sum, demo) => sum + (demo.query.gender?.female || 0),
      0
    ) / demographics.length
  const totalMalePreference =
    demographics.reduce(
      (sum, demo) => sum + Math.abs(demo.query.gender?.male || 0),
      0
    ) / demographics.length

  const genderData = [
    {
      name: "Female Preference",
      value: Math.round(totalFemalePreference * 100),
      color: "#e879f9",
    },
    {
      name: "Male Preference",
      value: Math.round(totalMalePreference * 100),
      color: "#8b5cf6",
    },
  ].filter(item => item.value > 0)

  console.log("QlooDemographicsChart: Processed data", {
    ageData,
    genderData,
  })

  // If no valid data after processing, show a message
  if (ageData.length === 0 && genderData.length === 0) {
    return (
      <Card className={`border-purple-200 dark:border-purple-800 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <Users className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No demographic data available to display</p>
            <p className="text-xs mt-1">
              Data received: {demographics.length} entries, but could not
              process age groups or gender data
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-purple-200 dark:border-purple-800 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
          <Users className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          Age and gender preferences across different cultural categories
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Age Affinity Chart */}
        <div>
          <h4 className="font-medium mb-3 text-sm text-purple-700 dark:text-purple-300 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Cultural Category Affinity
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={ageData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-purple-200 dark:stroke-purple-800"
              />
              <XAxis
                dataKey="category"
                className="text-xs fill-purple-600 dark:fill-purple-400"
                tick={{ fontSize: 11 }}
              />
              <YAxis
                className="text-xs fill-purple-600 dark:fill-purple-400"
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "black",
                  border: "1px solid rgb(147, 51, 234, 0.3)",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
                formatter={(value, name) => [
                  `${value}%`,
                  name === "affinity" ? "Affinity Score" : name,
                ]}
                labelFormatter={label => `Category: ${label}`}
              />
              <Bar
                dataKey="affinity"
                fill="#a855f7"
                radius={[2, 2, 0, 0]}
                stroke="rgb(147, 51, 234, 0.5)"
                strokeWidth={1}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gender Distribution */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-3 text-sm text-purple-700 dark:text-purple-300">
              Overall Gender Preference
            </h4>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid rgb(147, 51, 234, 0.3)",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                  formatter={value => [`${value}%`, "Preference"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 className="font-medium mb-3 text-sm text-purple-700 dark:text-purple-300">
              Category Breakdown
            </h4>
            <div className="space-y-2">
              {ageData.slice(0, 4).map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center text-xs"
                >
                  <span className="font-medium text-purple-600 dark:text-purple-400">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-500">{item.affinity}%</span>
                    <span className="text-purple-400">•</span>
                    <span className="text-purple-500">{item.ageGroup}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs text-purple-600 dark:text-purple-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-500"></div>
            <span>Higher values indicate stronger community preference</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
