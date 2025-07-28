// src/lib/qloo/qloo-mapper.ts

import { TechCulturalMapping } from './qloo-types'

// Comprehensive mapping of technical interests to cultural tags
export const TECH_TO_CULTURE_MAPPINGS: Record<string, TechCulturalMapping> = {
  // Programming Languages
  python: {
    techCategory: 'language',
    culturalTags: ['data-science', 'artificial-intelligence', 'academic', 'research', 'automation'],
    qlooEntityTypes: ['urn:tag:keyword:media:science', 'urn:tag:keyword:media:technology', 'urn:tag:keyword:media:education'],
    description: 'Python developers often have interests in data, AI, and academic pursuits'
  },
  javascript: {
    techCategory: 'language',
    culturalTags: ['web-development', 'creative', 'startup', 'modern-tech', 'user-experience'],
    qlooEntityTypes: ['urn:tag:keyword:media:technology', 'urn:tag:genre:media:comedy', 'urn:tag:keyword:media:art'],
    description: 'JavaScript developers tend to be creative and startup-oriented'
  },
  typescript: {
    techCategory: 'language',
    culturalTags: ['enterprise', 'type-safety', 'engineering', 'scalability', 'best-practices'],
    qlooEntityTypes: ['urn:tag:keyword:media:technology', 'urn:tag:keyword:media:business'],
    description: 'TypeScript users value structure and enterprise-grade solutions'
  },
  rust: {
    techCategory: 'language',
    culturalTags: ['systems-programming', 'performance', 'security', 'low-level', 'technical-excellence'],
    qlooEntityTypes: ['urn:tag:keyword:media:technology', 'urn:tag:genre:media:sci_fi'],
    description: 'Rust developers focus on performance and security'
  },
  go: {
    techCategory: 'language',
    culturalTags: ['cloud-native', 'devops', 'microservices', 'simplicity', 'google-ecosystem'],
    qlooEntityTypes: ['urn:tag:technology', 'urn:tag:infrastructure'],
    description: 'Go developers often work in cloud and DevOps'
  },
  java: {
    techCategory: 'language',
    culturalTags: ['enterprise', 'backend', 'traditional', 'banking', 'large-scale'],
    qlooEntityTypes: ['urn:tag:technology', 'urn:tag:business'],
    description: 'Java developers often work in enterprise environments'
  },
  
  // Frameworks & Libraries
  react: {
    techCategory: 'framework',
    culturalTags: ['modern-web', 'component-based', 'facebook', 'ui-focused', 'spa'],
    qlooEntityTypes: ['urn:tag:technology', 'urn:tag:design'],
    description: 'React developers focus on modern UI development'
  },
  vue: {
    techCategory: 'framework',
    culturalTags: ['progressive', 'community-driven', 'pragmatic', 'indie', 'approachable'],
    qlooEntityTypes: ['urn:tag:technology', 'urn:tag:community'],
    description: 'Vue developers value community and pragmatism'
  },
  angular: {
    techCategory: 'framework',
    culturalTags: ['enterprise-frontend', 'google', 'structured', 'full-featured', 'corporate'],
    qlooEntityTypes: ['urn:tag:technology', 'urn:tag:business'],
    description: 'Angular developers work on enterprise applications'
  },
  nextjs: {
    techCategory: 'framework',
    culturalTags: ['full-stack', 'vercel', 'modern-web', 'performance', 'seo'],
    qlooEntityTypes: ['urn:tag:technology', 'urn:tag:marketing'],
    description: 'Next.js developers build performant full-stack apps'
  },
  
  // Domains & Interests
  'machine-learning': {
    techCategory: 'domain',
    culturalTags: ['ai', 'data-science', 'research', 'innovation', 'future-tech'],
    qlooEntityTypes: ['urn:tag:science', 'urn:tag:technology'],
    description: 'ML practitioners are interested in cutting-edge AI'
  },
  'web3': {
    techCategory: 'domain',
    culturalTags: ['blockchain', 'cryptocurrency', 'decentralization', 'finance', 'innovation'],
    qlooEntityTypes: ['urn:tag:technology', 'urn:tag:finance'],
    description: 'Web3 developers are interested in blockchain and crypto'
  },
  'game-development': {
    techCategory: 'domain',
    culturalTags: ['gaming', 'entertainment', 'graphics', 'creativity', 'interactive-media'],
    qlooEntityTypes: ['urn:tag:gaming', 'urn:tag:entertainment'],
    description: 'Game developers combine technical and creative skills'
  },
  'mobile-development': {
    techCategory: 'domain',
    culturalTags: ['mobile-first', 'app-store', 'user-experience', 'ios-android', 'consumer-tech'],
    qlooEntityTypes: ['urn:tag:technology', 'urn:tag:lifestyle'],
    description: 'Mobile developers focus on consumer applications'
  },
  'devops': {
    techCategory: 'domain',
    culturalTags: ['automation', 'infrastructure', 'cloud', 'efficiency', 'reliability'],
    qlooEntityTypes: ['urn:tag:technology', 'urn:tag:infrastructure'],
    description: 'DevOps engineers focus on automation and reliability'
  },
  'cybersecurity': {
    techCategory: 'domain',
    culturalTags: ['security', 'hacking', 'privacy', 'defense', 'ethical-hacking'],
    qlooEntityTypes: ['urn:tag:technology', 'urn:tag:security'],
    description: 'Security professionals protect systems and data'
  }
}

// Helper function to extract cultural tags from technical interests
export function mapTechToCulture(techInterests: string[]): string[] {
  const culturalTags = new Set<string>()
  
  techInterests.forEach(interest => {
    const normalizedInterest = interest.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const mapping = TECH_TO_CULTURE_MAPPINGS[normalizedInterest]
    
    if (mapping) {
      mapping.culturalTags.forEach(tag => culturalTags.add(tag))
    } else {
      // For unmapped interests, create generic tags
      culturalTags.add(`tech-${normalizedInterest}`)
    }
  })
  
  return Array.from(culturalTags)
}

// Map GitHub topics to Qloo-compatible tags
export function mapGitHubTopicsToQlooTags(topics: string[]): string[] {
  const qlooTags: string[] = []
  
  const topicMappings: Record<string, string[]> = {
    'good-first-issue': ['beginner-friendly', 'mentorship', 'learning'],
    'hacktoberfest': ['open-source', 'community', 'contribution'],
    'machine-learning': ['ai', 'data-science', 'research'],
    'web': ['web-development', 'frontend', 'internet'],
    'api': ['backend', 'integration', 'services'],
    'cli': ['command-line', 'developer-tools', 'automation'],
    'documentation': ['writing', 'education', 'communication'],
    'testing': ['quality-assurance', 'reliability', 'engineering'],
    'design': ['ui-ux', 'creativity', 'visual-arts'],
    'database': ['data-management', 'backend', 'storage']
  }
  
  topics.forEach(topic => {
    const normalizedTopic = topic.toLowerCase()
    if (topicMappings[normalizedTopic]) {
      qlooTags.push(...topicMappings[normalizedTopic])
    } else {
      qlooTags.push(normalizedTopic.replace(/[^a-z0-9]/g, '-'))
    }
  })
  
  return [...new Set(qlooTags)]
}

// Generate Qloo entity types based on tech stack
export function getTechQlooEntityTypes(techStack: string[]): string[] {
  const entityTypes = new Set<string>()
  
  techStack.forEach(tech => {
    const normalizedTech = tech.toLowerCase()
    const mapping = TECH_TO_CULTURE_MAPPINGS[normalizedTech]
    
    if (mapping) {
      mapping.qlooEntityTypes.forEach(type => entityTypes.add(type))
    }
  })
  
  // Always include technology as a base type
  entityTypes.add('urn:tag:technology')
  
  return Array.from(entityTypes)
}

// Create a cultural profile from GitHub user data
export function createCulturalProfile(userData: {
  languages: string[]
  topics: string[]
  bio?: string
  location?: string
}) {
  const culturalTags = [
    ...mapTechToCulture(userData.languages),
    ...mapGitHubTopicsToQlooTags(userData.topics)
  ]
  
  // Extract additional interests from bio if available
  if (userData.bio) {
    const bioKeywords = extractKeywordsFromBio(userData.bio)
    culturalTags.push(...bioKeywords)
  }
  
  // Add location-based tags if available
  if (userData.location) {
    culturalTags.push(`location-${userData.location.toLowerCase().replace(/[^a-z0-9]/g, '-')}`)
  }
  
  return {
    tags: [...new Set(culturalTags)],
    entityTypes: getTechQlooEntityTypes(userData.languages)
  }
}

// Extract relevant keywords from user bio
function extractKeywordsFromBio(bio: string): string[] {
  const keywords: string[] = []
  const bioLower = bio.toLowerCase()
  
  // Common interest indicators in developer bios
  const interestPatterns = [
    { pattern: /(?:love|enjoy|passionate about|interested in)\s+(\w+)/gi, group: 1 },
    { pattern: /(\w+)\s+enthusiast/gi, group: 1 },
    { pattern: /(?:building|creating|working on)\s+(\w+)/gi, group: 1 }
  ]
  
  interestPatterns.forEach(({ pattern, group }) => {
    let match
    while ((match = pattern.exec(bioLower)) !== null) {
      if (match[group]) {
        keywords.push(match[group].replace(/[^a-z0-9]/g, '-'))
      }
    }
  })
  
  return keywords
}

// Extract Qloo-compatible URN tags from tech interests
export function extractQlooUrns(techInterests: string[]): string[] {
  const qlooUrns: string[] = []
  
  techInterests.forEach(tech => {
    const techLower = tech.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const mapping = TECH_TO_CULTURE_MAPPINGS[techLower] || TECH_TO_CULTURE_MAPPINGS[tech.toLowerCase()]
    
    if (mapping && mapping.qlooEntityTypes) {
      qlooUrns.push(...mapping.qlooEntityTypes)
    }
  })
  
  // Add some default URNs based on common tech patterns
  const techLowerJoined = techInterests.join(' ').toLowerCase()
  
  if (techLowerJoined.includes('data') || techLowerJoined.includes('science') || techLowerJoined.includes('ml')) {
    qlooUrns.push('urn:tag:keyword:media:science', 'urn:tag:keyword:media:education')
  }
  if (techLowerJoined.includes('web') || techLowerJoined.includes('frontend') || techLowerJoined.includes('react')) {
    qlooUrns.push('urn:tag:keyword:media:technology', 'urn:tag:keyword:media:art')
  }
  if (techLowerJoined.includes('ai') || techLowerJoined.includes('machine') || techLowerJoined.includes('neural')) {
    qlooUrns.push('urn:tag:genre:media:sci_fi', 'urn:tag:keyword:media:technology')
  }
  if (techLowerJoined.includes('game') || techLowerJoined.includes('entertainment')) {
    qlooUrns.push('urn:tag:genre:media:comedy', 'urn:tag:genre:media:action')
  }
  
  return [...new Set(qlooUrns)] // Remove duplicates
}