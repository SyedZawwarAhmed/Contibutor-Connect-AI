// src/app/api/recommendations/qloo-enhanced/test-endpoint.ts
// Manual integration test for the Qloo-enhanced recommendations endpoint

/**
 * Test the Qloo-enhanced recommendations endpoint manually
 * This file demonstrates how to call the endpoint and what to expect
 */

export interface TestQlooEndpointOptions {
  baseUrl?: string
  authToken?: string // If you need to pass auth token manually
}

export async function testQlooEnhancedEndpoint(
  query: string,
  options: TestQlooEndpointOptions = {}
) {
  const { baseUrl = 'http://localhost:3000' } = options

  try {
    console.log('🧪 Testing Qloo-enhanced recommendations endpoint...')
    console.log(`📝 Query: "${query}"`)
    
    const response = await fetch(`${baseUrl}/api/recommendations/qloo-enhanced`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In real usage, authentication is handled by NextAuth sessions
        ...(options.authToken && { 'Authorization': `Bearer ${options.authToken}` })
      },
      body: JSON.stringify({
        query,
        use_qloo: true
      })
    })

    console.log(`🌐 Response Status: ${response.status}`)
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Error Response:', errorData)
      return { success: false, error: errorData }
    }

    const data = await response.json()
    
    // Validate response structure
    console.log('✅ Response received!')
    console.log('📊 Validating response structure...')
    
    validateQlooResponse(data)
    
    return { success: true, data }

  } catch (error) {
    console.error('❌ Test failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

function validateQlooResponse(data: any) {
  // Basic structure validation
  if (!data.success) {
    console.warn('⚠️  Response success is false')
  }

  if (!data.data || !data.data.projects) {
    console.error('❌ Missing data.projects in response')
    return false
  }

  if (!data.metadata) {
    console.error('❌ Missing metadata in response')
    return false
  }

  console.log('✅ Basic structure validation passed')

  // Validate projects structure
  console.log(`📝 Found ${data.data.projects.length} projects`)
  
  data.data.projects.forEach((project: any, index: number) => {
    console.log(`\n🔍 Validating Project ${index + 1}: ${project.name}`)
    
    const requiredFields = ['name', 'description', 'githubUrl', 'languages', 'topics', 'difficulty', 'explanation', 'contributionTypes']
    const missingFields = requiredFields.filter(field => !project[field])
    
    if (missingFields.length > 0) {
      console.warn(`⚠️  Missing fields: ${missingFields.join(', ')}`)
    } else {
      console.log('✅ All required fields present')
    }

    // Validate GitHub URL
    if (project.githubUrl && !project.githubUrl.match(/^https:\/\/github\.com\/[\w-]+\/[\w.-]+$/)) {
      console.warn('⚠️  Invalid GitHub URL format')
    } else {
      console.log('✅ GitHub URL format valid')
    }

    // Validate difficulty
    if (!['beginner', 'intermediate', 'advanced'].includes(project.difficulty)) {
      console.warn('⚠️  Invalid difficulty level')
    } else {
      console.log('✅ Difficulty level valid')
    }
  })

  // Validate Qloo metadata
  console.log('\n🧠 Validating Qloo Intelligence Data...')
  
  if (data.metadata.qloo_insights_used) {
    console.log('✅ Qloo insights were used')
    
    if (data.metadata.cultural_tags_identified > 0) {
      console.log(`✅ ${data.metadata.cultural_tags_identified} cultural tags identified`)
    }

    if (data.metadata.demographics_analyzed) {
      console.log('✅ Demographics analyzed')
    }

    if (data.metadata.cultural_scoring_applied) {
      console.log('✅ Cultural scoring applied')
    }

    // Validate qloo_insights structure
    if (data.qloo_insights) {
      console.log('✅ Qloo insights data present')
      
      if (data.qloo_insights.culturalTags?.length > 0) {
        console.log(`📊 Cultural Tags: ${data.qloo_insights.culturalTags.slice(0, 5).join(', ')}`)
      }

      if (data.qloo_insights.demographics?.length > 0) {
        const topDemo = data.qloo_insights.demographics[0]
        console.log(`👥 Primary Demographic: ${topDemo.age_group} ${topDemo.gender} (${(topDemo.affinity_score * 100).toFixed(1)}% affinity)`)
      }

      if (data.qloo_insights.relatedInterests?.length > 0) {
        const interests = data.qloo_insights.relatedInterests.slice(0, 4).map((i: any) => i.name).join(', ')
        console.log(`🎯 Related Interests: ${interests}`)
      }
    }
  } else {
    console.log('ℹ️  Qloo insights not used (fallback mode)')
  }

  console.log('\n🎉 Response validation completed!')
  return true
}

// Example usage and test cases
export const TEST_QUERIES = [
  'Find me beginner-friendly Python data science projects',
  'Show me React TypeScript projects for intermediate developers',
  'I want to contribute to machine learning projects in Python',
  'Find me Rust systems programming projects',
  'Show me JavaScript frontend projects with good documentation',
  'I\'m interested in web3 and blockchain projects',
  'Find me DevOps projects with Docker and Kubernetes',
  'Show me game development projects in any language'
]

// Run tests for all example queries
export async function runAllTests(options: TestQlooEndpointOptions = {}) {
  console.log('🚀 Running comprehensive Qloo endpoint tests...\n')
  
  const results = []
  
  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const query = TEST_QUERIES[i]
    console.log(`\n${'='.repeat(60)}`)
    console.log(`🧪 TEST ${i + 1}/${TEST_QUERIES.length}`)
    console.log(`${'='.repeat(60)}`)
    
    const result = await testQlooEnhancedEndpoint(query, options)
    results.push({ query, result })
    
    if (result.success) {
      console.log('✅ Test passed!')
    } else {
      console.log('❌ Test failed!')
    }
    
    // Add delay between tests to avoid rate limiting
    if (i < TEST_QUERIES.length - 1) {
      console.log('⏳ Waiting 2 seconds before next test...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  // Summary
  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 TEST SUMMARY')
  console.log(`${'='.repeat(60)}`)
  
  const passed = results.filter(r => r.result.success).length
  const failed = results.filter(r => !r.result.success).length
  
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📊 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`)
  
  if (failed > 0) {
    console.log('\n❌ Failed tests:')
    results.filter(r => !r.result.success).forEach(({ query, result }) => {
      console.log(`- "${query}": ${result.error}`)
    })
  }
  
  return results
}

// Export sample response for documentation
export const SAMPLE_RESPONSE = {
  success: true,
  data: {
    projects: [
      {
        name: 'scikit-learn',
        description: 'Machine learning library for Python',
        githubUrl: 'https://github.com/scikit-learn/scikit-learn',
        languages: ['Python'],
        topics: ['machine-learning', 'data-science', 'python'],
        stars: 58000,
        difficulty: 'intermediate',
        explanation: 'Perfect match for your Python and data science interests with a welcoming community for new contributors.',
        contributionTypes: ['bug-fixes', 'documentation', 'features']
      }
    ],
    reasoning: 'These recommendations combine technical skills with cultural interests for optimal project-community fit.'
  },
  metadata: {
    qloo_insights_used: true,
    cultural_tags_identified: 5,
    demographics_analyzed: true,
    cultural_scoring_applied: true,
    total_projects_analyzed: 150
  },
  qloo_insights: {
    culturalTags: ['data-science', 'research', 'academic', 'ai', 'automation'],
    demographics: [
      {
        age_group: '25-34',
        gender: 'Male',
        affinity_score: 0.85
      }
    ],
    relatedInterests: [
      { name: 'artificial-intelligence' },
      { name: 'data-visualization' },
      { name: 'automation' },
      { name: 'research' }
    ]
  }
}

// If running this file directly in Node.js
if (require.main === module) {
  console.log('🧪 Running Qloo endpoint test...')
  testQlooEnhancedEndpoint('Find me Python machine learning projects for beginners')
    .then(result => {
      if (result.success) {
        console.log('🎉 Test completed successfully!')
        console.log(JSON.stringify(result.data, null, 2))
      } else {
        console.error('❌ Test failed:', result.error)
      }
    })
    .catch(console.error)
}