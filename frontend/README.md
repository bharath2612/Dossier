# Dossier Frontend

The frontend application for Dossier, built with Next.js 14, React 19, and TypeScript.

## Features

- Modern Next.js App Router architecture
- Real-time presentation generation
- Interactive outline editor with drag-and-drop
- Presentation viewer and editor
- PDF export functionality
- Google OAuth authentication via Supabase
- Responsive design with Tailwind CSS
- Dark mode support

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm, yarn, pnpm, or bun
- A Supabase project (for authentication and data storage)
- Backend API URL (see main README for backend setup)

### Installation

1. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

3. Configure environment variables in `.env.local`:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:8080
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── outline/           # Outline editor
│   └── presentation/      # Presentation viewer/editor
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── editor/           # Editor components
│   ├── landing/          # Landing page components
│   ├── outline/          # Outline editor components
│   ├── presentation/     # Presentation components
│   └── ui/               # Reusable UI components
├── lib/                   # Utility libraries
│   ├── api/              # API client
│   ├── export/           # Export utilities
│   ├── supabase/         # Supabase client
│   ├── themes/           # Theme configuration
│   └── utils/            # General utilities
├── store/                 # Zustand state management
├── hooks/                 # React hooks
└── public/                # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run generate:og` - Generate OpenGraph image

## Key Technologies

- **Next.js 14** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Supabase** - Authentication and database
- **Framer Motion** - Animations
- **Radix UI** - Accessible UI primitives

## Environment Variables

See `.env.example` for required environment variables. All variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## Development

### Adding New Components

1. Create component in appropriate `components/` subdirectory
2. Use TypeScript for type safety
3. Follow existing component patterns
4. Add to Storybook if applicable (optional)

### State Management

State is managed using Zustand stores in the `store/` directory:
- `store/presentation.ts` - Presentation state
- `store/draft.ts` - Draft state
- `store/ui.ts` - UI state

### API Integration

API calls are handled through `lib/api/client.ts`. The API client provides type-safe methods for communicating with the backend.

## Building for Production

```bash
npm run build
npm run start
```

The production build is optimized and includes:
- Code splitting
- Image optimization
- Static page generation where possible
- Minification and compression

## Deployment

See the main README.md and DEPLOYMENT-CHECKLIST.md for deployment instructions.

For Vercel deployment:
1. Connect your repository
2. Set environment variables
3. Deploy automatically on push to main branch

## License

This project is licensed under AGPL-3.0 - see the LICENSE file in the root directory for details.
