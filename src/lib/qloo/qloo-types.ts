// src/lib/qloo/qloo-types.ts

// Qloo API Response Types
export interface QlooEntity {
  uri: string
  name: string
  type: string
  metadata?: {
    popularity?: number
    description?: string
    external_links?: {
      spotify?: string
      wikipedia?: string
      imdb?: string
      [key: string]: string | undefined
    }
  }
}

export interface QlooDemographic {
  age_group: string
  gender: string
  affinity_score: number
  population_percentage: number
}

export interface QlooTag {
  uri: string
  name: string
  type: string
  parent_types?: string[]
  related_tags?: string[]
  popularity?: number
}

export interface QlooInsightsResponse {
  success?: boolean
  entities?: QlooEntity[]
  demographics?: QlooDemographic[]
  tags?: QlooTag[]
  results?: {
    entities?: QlooEntity[]
    demographics?: QlooDemographic[]
    tags?: QlooTag[]
  }
  metadata?: {
    total_count?: number
    query_id?: string
  }
}

export interface QlooHeatmapData {
  location: {
    country?: string
    state?: string
    city?: string
    coordinates?: {
      latitude: number
      longitude: number
    }
  }
  affinity_score: number
  population_size?: number
}

export interface QlooHeatmapResponse {
  heatmap_data: QlooHeatmapData[]
  metadata?: {
    total_locations?: number
    coverage_percentage?: number
  }
}

// Request Parameter Types
export interface QlooBasicInsightsParams {
  filter: {
    type: string
    tags?: string[]
    parent_types?: string[]
    demographics?: {
      age_groups?: string[]
      genders?: string[]
    }
  }
  signal?: {
    interests?: {
      entities?: string[]
      tags?: string[]
    }
    location?: {
      country?: string
      state?: string
      city?: string
    }
  }
  limit?: number
  offset?: number
}

export interface QlooDemographicsParams {
  filter: {
    type: 'urn:demographics'
  }
  signal: {
    interests: {
      entities?: string[]
      tags?: string[]
    }
  }
}

export interface QlooTasteAnalysisParams {
  filter: {
    type: 'urn:tag'
    tag_types?: string[]
    parent_types?: string[]
  }
  signal?: {
    interests?: {
      entities?: string[]
      tags?: string[]
    }
  }
  limit?: number
}

// Tech to Culture Mapping Types
export interface TechCulturalMapping {
  techCategory: string
  culturalTags: string[]
  qlooEntityTypes: string[]
  description: string
}

export interface EnhancedUserProfile {
  technicalInterests: {
    languages: string[]
    frameworks: string[]
    domains: string[]
  }
  culturalProfile?: {
    tags: QlooTag[]
    demographics: QlooDemographic[]
    affinities: QlooEntity[]
  }
  locationInsights?: {
    techHubs: string[]
    communityStrength: number
  }
}