// src/app/api/test-github-validation/route.ts
import { NextResponse } from "next/server"
import { validateGitHubUrl, extractAndValidateGitHubUrls } from "@/lib/github-validation"

export async function GET() {
  try {
    console.log("🧪 Testing GitHub URL validation...")

    // Test individual URL validation
    const testUrls = [
      "https://github.com/facebook/react", // Valid
      "https://github.com/microsoft/vscode", // Valid
      "https://github.com/invalid/nonexistent", // Invalid
      "https://github.com/vercel/next.js", // Valid
      "https://not-github.com/some/repo", // Invalid format
    ]

    console.log("Testing individual URLs...")
    const validationResults = []
    for (const url of testUrls) {
      const result = await validateGitHubUrl(url)
      validationResults.push({ url, ...result })
      console.log(`${result.exists ? '✅' : '❌'} ${url}: ${result.error || 'Valid'}`)
    }

    // Test text extraction and validation
    const sampleText = `
      Check out these projects:
      - React: https://github.com/facebook/react
      - VS Code: https://github.com/microsoft/vscode
      - This doesn't exist: https://github.com/fake/nonexistent
      - Next.js: https://github.com/vercel/next.js
    `

    console.log("Testing text extraction and validation...")
    const extractionResult = await extractAndValidateGitHubUrls(sampleText)
    
    console.log("Valid URLs found:", extractionResult.validUrls)
    console.log("Invalid URLs found:", extractionResult.invalidUrls)

    return NextResponse.json({
      success: true,
      message: "GitHub URL validation test completed",
      results: {
        individualValidation: validationResults,
        textExtraction: extractionResult,
        summary: {
          totalTested: testUrls.length,
          validUrls: validationResults.filter(r => r.exists).length,
          invalidUrls: validationResults.filter(r => !r.exists).length,
          extractedValid: extractionResult.validUrls.length,
          extractedInvalid: extractionResult.invalidUrls.length
        }
      }
    })
  } catch (error) {
    console.error("GitHub validation test failed:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: "GitHub URL validation test failed" 
      },
      { status: 500 }
    )
  }
}