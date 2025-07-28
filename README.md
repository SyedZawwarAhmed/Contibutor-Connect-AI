# ContributorConnect AI

A revolutionary open-source project discovery platform that combines AI-powered recommendations with Qloo's cultural intelligence to match developers with projects where they'll thrive both technically and culturally.

## Features

- **AI-Powered Chat Interface**: Natural language conversations for project discovery
- **Cultural Intelligence**: First-of-its-kind cultural matching for open source projects
- **GitHub Integration**: Seamless authentication and profile analysis
- **Smart Recommendations**: Projects matched on both technical skills and cultural fit
- **Interactive Visualizations**: Demographic insights and cultural affinity charts
- **Real-time Streaming**: Instant AI responses with streaming support

## Tech Stack

- **Framework**: Next.js 15.3.5 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with GitHub OAuth
- **AI Models**: Google Gemini (primary), with support for Claude and OpenAI
- **Cultural AI**: Qloo Taste AI for demographic and cultural analysis
- **UI Components**: shadcn/ui with Tailwind CSS
- **Data Visualization**: Recharts for interactive charts
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database
- GitHub OAuth App credentials
- API keys for Google Gemini and Qloo

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/contributor-connect-ai.git
cd contributor-connect-ai
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"
GITHUB_ID="your-github-oauth-id"
GITHUB_SECRET="your-github-oauth-secret"
GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-key"
QLOO_API_KEY="your-qloo-api-key"
```

4. Set up the database:
```bash
npx prisma migrate dev
```

5. Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Key Features Explained

### Cultural Intelligence Integration

ContributorConnect AI is the world's first culturally-aware open source recommendation engine. It analyzes:

- **Technical-to-Cultural Mapping**: Converts programming interests into broader cultural preferences
- **Demographic Matching**: Finds projects with similar community demographics
- **Cultural Scoring**: Rates project alignment based on cultural fit (not just technical match)
- **Cross-Domain Insights**: Discovers unexpected connections through Qloo's taste graph

### Interactive Process Flow

The application provides full transparency into how cultural intelligence enhances recommendations:

1. **GitHub Profile Analysis**: Extracts languages, frameworks, and interests
2. **URN Extraction**: Maps technical terms to Qloo's cultural entities
3. **Cultural Analysis**: Uses Qloo APIs to find cultural patterns
4. **Smart Scoring**: Combines technical and cultural fit for final recommendations

## Available Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm dev:mcp          # Start MCP server (Model Context Protocol)
```

## Architecture

```
src/
├── app/              # Next.js app router pages and API routes
├── components/       # React components
│   ├── ui/          # Base UI components (shadcn/ui)
│   └── qloo/        # Qloo-specific components
├── lib/             # Utility functions and services
│   └── qloo/        # Qloo API integration
├── mcp/             # Model Context Protocol server
└── generated/       # Prisma client output
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built for the Qloo Hackathon
- Powered by Qloo's Taste AI for cultural intelligence
- Uses Google's Gemini for AI capabilities
- UI components from shadcn/ui