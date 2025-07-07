"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Filter, RotateCcw, Search, X } from "lucide-react"
import { useState } from "react"

interface FilterSectionProps {
  filters: any
  onFiltersChange: (filters: any) => void
  onApplyFilters: () => void
  onResetFilters: () => void
  isLoading: boolean
}

const technologies = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "Go",
  "Rust",
  "C++",
  "C#",
  "React",
  "Vue.js",
  "Angular",
  "Node.js",
  "Django",
  "Flask",
  "Spring",
  "Machine Learning",
  "AI",
  "Blockchain",
  "Web Development",
  "Mobile Development",
]

const domains = [
  "Fintech",
  "Healthcare",
  "Education",
  "E-commerce",
  "Gaming",
  "Scientific Research",
  "Open Source Tools",
  "DevOps",
  "Cybersecurity",
]

const contributionTypes = [
  "Code Contributions",
  "Documentation",
  "Bug Fixing",
  "Feature Development",
  "UI/UX Design",
  "Testing",
  "Community Management",
]

export function FilterSection({
  filters,
  onFiltersChange,
  onApplyFilters,
  onResetFilters,
  isLoading,
}: FilterSectionProps) {
  const [techSearch, setTechSearch] = useState("")
  const [domainSearch, setDomainSearch] = useState("")

  const addTechnology = (tech: string) => {
    if (!filters.technologies.includes(tech)) {
      onFiltersChange({
        ...filters,
        technologies: [...filters.technologies, tech],
      })
    }
    setTechSearch("")
  }

  const removeTechnology = (tech: string) => {
    onFiltersChange({
      ...filters,
      technologies: filters.technologies.filter((t: string) => t !== tech),
    })
  }

  const addDomain = (domain: string) => {
    if (!filters.domains.includes(domain)) {
      onFiltersChange({
        ...filters,
        domains: [...filters.domains, domain],
      })
    }
    setDomainSearch("")
  }

  const removeDomain = (domain: string) => {
    onFiltersChange({
      ...filters,
      domains: filters.domains.filter((d: string) => d !== domain),
    })
  }

  const toggleContributionType = (type: string) => {
    const isSelected = filters.contributionTypes.includes(type)
    onFiltersChange({
      ...filters,
      contributionTypes: isSelected
        ? filters.contributionTypes.filter((t: string) => t !== type)
        : [...filters.contributionTypes, type],
    })
  }

  const filteredTechnologies = technologies.filter(
    (tech) => tech.toLowerCase().includes(techSearch.toLowerCase()) && !filters.technologies.includes(tech),
  )

  const filteredDomains = domains.filter(
    (domain) => domain.toLowerCase().includes(domainSearch.toLowerCase()) && !filters.domains.includes(domain),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filter & Refine
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Location */}
          <div className="space-y-2">
            <Label>Location</Label>
            <Select
              value={filters.location}
              onValueChange={(value) => onFiltersChange({ ...filters, location: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anywhere">Anywhere</SelectItem>
                <SelectItem value="united-states">United States</SelectItem>
                <SelectItem value="india">India</SelectItem>
                <SelectItem value="germany">Germany</SelectItem>
                <SelectItem value="brazil">Brazil</SelectItem>
                <SelectItem value="united-kingdom">United Kingdom</SelectItem>
                <SelectItem value="canada">Canada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Project Size */}
          <div className="space-y-2">
            <Label>Project Size</Label>
            <Select
              value={filters.projectSize}
              onValueChange={(value) => onFiltersChange({ ...filters, projectSize: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Size</SelectItem>
                <SelectItem value="small">Small (&lt;50 stars)</SelectItem>
                <SelectItem value="medium">Medium (50-500 stars)</SelectItem>
                <SelectItem value="large">Large (&gt;500 stars)</SelectItem>
                <SelectItem value="very-large">Very Large (&gt;5000 stars)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty Level */}
          <div className="space-y-2">
            <Label>Difficulty Level</Label>
            <Select
              value={filters.difficulty}
              onValueChange={(value) => onFiltersChange({ ...filters, difficulty: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="beginner">Beginner-Friendly</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Technologies */}
        <div className="space-y-3">
          <Label>Technologies & Languages</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search technologies..."
              value={techSearch}
              onChange={(e) => setTechSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selected Technologies */}
          {filters.technologies.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.technologies.map((tech: string) => (
                <Badge key={tech} variant="default" className="flex items-center gap-1">
                  {tech}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeTechnology(tech)} />
                </Badge>
              ))}
            </div>
          )}

          {/* Available Technologies */}
          {techSearch && filteredTechnologies.length > 0 && (
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {filteredTechnologies.slice(0, 10).map((tech) => (
                <Badge
                  key={tech}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => addTechnology(tech)}
                >
                  {tech}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Domains */}
        <div className="space-y-3">
          <Label>Domain/Industry</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search domains..."
              value={domainSearch}
              onChange={(e) => setDomainSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selected Domains */}
          {filters.domains.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.domains.map((domain: string) => (
                <Badge key={domain} variant="default" className="flex items-center gap-1">
                  {domain}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeDomain(domain)} />
                </Badge>
              ))}
            </div>
          )}

          {/* Available Domains */}
          {domainSearch && filteredDomains.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filteredDomains.map((domain) => (
                <Badge
                  key={domain}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => addDomain(domain)}
                >
                  {domain}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Contribution Types */}
        <div className="space-y-3">
          <Label>Contribution Type</Label>
          <div className="flex flex-wrap gap-2">
            {contributionTypes.map((type) => (
              <Badge
                key={type}
                variant={filters.contributionTypes.includes(type) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleContributionType(type)}
              >
                {type}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={onApplyFilters} disabled={isLoading} className="flex-1">
            {isLoading ? "Searching..." : "Apply Filters"}
          </Button>
          <Button variant="outline" onClick={onResetFilters}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
