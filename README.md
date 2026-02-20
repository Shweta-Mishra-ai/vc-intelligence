# VC Intelligence Platform

A premium VC Intelligence Interface built with Next.js, React, Tailwind CSS, and shadcn/ui. Discover, track, and analyze startup companies with advanced search, filtering, and enrichment capabilities.

## Features

- **Company Discovery**: Browse and search through a curated database of startup companies
- **Advanced Filtering**: Filter companies by industry, stage, and custom search queries
- **Company Profiles**: Detailed company pages with overview, signals timeline, and notes
- **Live Enrichment Engine**: AI-powered data enrichment with real-time scraping and analysis
- **Custom Lists**: Create and manage custom company lists with CSV export
- **Saved Searches**: Save and quickly re-run search filter combinations
- **Persistent Storage**: All user data (lists, notes, searches) stored in localStorage

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **State Management**: React hooks + localStorage

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vc-intelligence
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file in the root directory for environment-specific configuration:

```env
# OpenAI API Configuration (for Live Enrichment Engine)
OPENAI_API_KEY=your_openai_api_key_here

# Optional: API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Setting Up Live Enrichment

The Live Enrichment Engine currently uses mock data. To enable real enrichment:

1. Add your OpenAI API key to `.env.local`
2. Install required packages:
```bash
npm install openai cheerio
```

3. Update `/app/api/enrich/route.ts` to use the actual OpenAI/Cheerio implementation (see TODO comments in the file)

## Project Structure

```
vc-intelligence/
├── app/
│   ├── api/
│   │   └── enrich/          # Live Enrichment API endpoint
│   ├── companies/
│   │   ├── [id]/           # Company detail pages
│   │   └── page.tsx        # Companies listing page
│   ├── lists/              # Custom lists management
│   ├── saved/              # Saved searches
│   ├── layout.tsx          # Root layout with sidebar
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── sidebar.tsx         # Navigation sidebar
│   ├── global-search.tsx   # Global search bar
│   ├── enrichment-display.tsx  # Enrichment results display
│   └── enrichment-loader.tsx   # Enrichment loading state
├── data/
│   └── companies.json      # Mock company data
├── lib/
│   ├── companies.ts        # Company data utilities
│   └── utils.ts           # Utility functions
└── public/                 # Static assets
```

## Key Features Explained

### Companies Page (`/companies`)

- **Global Search**: Search across company names, descriptions, and industries
- **Industry Filter**: Filter by specific industries
- **Sorting**: Sort by name, industry, or stage
- **Pagination**: Navigate through results with pagination controls

### Company Detail Page (`/companies/[id]`)

- **Overview**: Company information and description
- **Signals Timeline**: Recent activity and derived signals
- **Notes**: Private notes with localStorage persistence
- **Save to List**: Add company to custom lists
- **Live Enrichment**: AI-powered data enrichment with loading states

### Lists Page (`/lists`)

- **Create Lists**: Create custom company lists
- **Manage Companies**: Add/remove companies from lists
- **CSV Export**: Export lists as CSV files
- **Persistent Storage**: All lists stored in localStorage

### Saved Searches (`/saved`)

- **Save Searches**: Save search query and filter combinations
- **Quick Re-run**: Execute saved searches with one click
- **Manage**: Delete saved searches

## Data Storage

All user data is stored in browser localStorage:

- **Lists**: `vc-lists` - JSON object mapping list names to company IDs
- **Notes**: `company-{id}-notes` - Text notes for each company
- **Enrichment Data**: `company-{id}-enrichment` - Cached enrichment results
- **Saved Searches**: `vc-saved-searches` - Array of saved search objects

## Development

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Customization

### Adding New Companies

Edit `data/companies.json` to add or modify company entries. Each company should have:
- `id`: Unique identifier
- `name`: Company name
- `website`: Company website URL
- `industry`: Industry category
- `stage`: Funding stage
- `shortDescription`: Brief description

### Styling

The app uses Tailwind CSS with custom CSS variables defined in `app/globals.css`. Modify these variables to customize the color scheme and design tokens.

### Components

All UI components are built with shadcn/ui and can be customized in the `components/ui/` directory.

## Future Enhancements

- [ ] Real OpenAI/Cheerio integration for Live Enrichment
- [ ] Backend API for persistent data storage
- [ ] User authentication and multi-user support
- [ ] Advanced analytics and reporting
- [ ] Export to additional formats (PDF, Excel)
- [ ] Real-time collaboration features
- [ ] Integration with external data sources

## License

MIT

## Support

For issues and questions, please open an issue on the repository.
