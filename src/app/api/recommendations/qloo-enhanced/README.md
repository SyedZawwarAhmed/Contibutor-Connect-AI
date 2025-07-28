# Qloo-Enhanced Recommendations API

This endpoint provides culturally-aware project recommendations by combining GitHub data with Qloo's cultural intelligence.

## Endpoint

```
POST /api/recommendations/qloo-enhanced
```

## Request Body

```json
{
  "query": "Find me Python data science projects for beginners",
  "use_qloo": true
}
```

### Parameters

- `query` (string, required): The user's project search query
- `use_qloo` (boolean, optional): Whether to use Qloo cultural intelligence (default: true)

## Response Structure

### Successful Response (200)

```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "name": "scikit-learn",
        "description": "Machine learning library for Python",
        "githubUrl": "https://github.com/scikit-learn/scikit-learn",
        "languages": ["Python"],
        "topics": ["machine-learning", "data-science", "python"],
        "stars": 58000,
        "difficulty": "intermediate",
        "explanation": "Perfect match for your Python and data science interests",
        "contributionTypes": ["bug-fixes", "documentation", "features"]
      }
    ],
    "reasoning": "Cultural analysis shows strong alignment with research-oriented projects"
  },
  "metadata": {
    "qloo_insights_used": true,
    "cultural_tags_identified": 5,
    "demographics_analyzed": true,
    "cultural_scoring_applied": true,
    "total_projects_analyzed": 150
  },
  "qloo_insights": {
    "culturalTags": ["data-science", "research", "academic", "ai"],
    "demographics": [
      {
        "age_group": "25-34",
        "gender": "Male",
        "affinity_score": 0.85
      }
    ],
    "relatedInterests": [
      { "name": "artificial-intelligence" },
      { "name": "data-visualization" }
    ]
  }
}
```

### Error Responses

#### Unauthorized (401)
```json
{
  "error": "Unauthorized"
}
```

#### No GitHub Profile (400)
```json
{
  "error": "GitHub profile not found"
}
```

#### Server Error (500)
```json
{
  "error": "Failed to generate recommendations"
}
```

## Authentication

This endpoint requires authentication via NextAuth.js session. Users must be logged in with their GitHub account.

## Cultural Intelligence Features

When `use_qloo: true`, the endpoint:

1. **Maps Technical Interests to Cultural Tags**
   - Python → data-science, research, academic
   - JavaScript → creative, startup, modern-tech
   - Rust → performance, security, technical-excellence

2. **Analyzes Demographics**
   - Finds communities with similar age/gender demographics
   - Provides affinity scores for community fit

3. **Discovers Cross-Domain Interests**
   - Uses Qloo's taste analysis to find related interests
   - Suggests projects beyond immediate technical domain

4. **Applies Cultural Scoring**
   - Ranks projects by cultural alignment
   - Considers both technical skills AND personality fit

## Testing

### Unit Tests
```bash
npm test src/app/api/recommendations/qloo-enhanced/route.test.ts
```

### Manual Testing
```typescript
import { testQlooEnhancedEndpoint } from './test-endpoint'

// Test single query
await testQlooEnhancedEndpoint('Find me React projects')

// Run comprehensive tests
import { runAllTests } from './test-endpoint'
await runAllTests()
```

### Example cURL Request
```bash
curl -X POST http://localhost:3000/api/recommendations/qloo-enhanced \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Find me Python data science projects for beginners",
    "use_qloo": true
  }'
```

## Environment Variables Required

```env
QLOO_API_KEY=your_qloo_api_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key
GITHUB_TOKEN=your_github_token
DATABASE_URL=your_postgres_url
NEXTAUTH_SECRET=your_auth_secret
```

## Key Dependencies

- `@/lib/qloo/qloo-client`: Qloo API integration
- `@/lib/qloo/qloo-mapper`: Tech-to-culture mapping
- `@/lib/mcp-client-remote`: GitHub data access
- `@/lib/llm`: Google Gemini integration
- `@/lib/auth`: NextAuth.js authentication

## Performance Notes

- Average response time: 2-4 seconds
- Includes parallel API calls to Qloo and GitHub
- Graceful fallback when Qloo API is unavailable
- Cultural scoring applied to top 20 projects maximum

## Limitations

- Requires authenticated user with GitHub profile
- Qloo API rate limits may apply
- Cultural mapping is based on predefined tech-to-culture associations
- English language queries work best