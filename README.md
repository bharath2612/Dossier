# Dossier

> Research-backed AI presentation generator that creates professional, beautifully designed slides with cited content in under 5 minutes.

Dossier transforms a simple prompt into a fully-researched, well-structured presentation with minimal effort. Built with modern web technologies and powered by AI, it provides an elegant solution for creating professional presentations.

## Features

### 🎯 Core Capabilities

- **Intelligent Research**: Web search integration with reputable source prioritization
- **Smart Outline Generation**: AI-powered outline with 8-12 slides, fully editable
- **Full Presentation Generation**: Progressive disclosure with multiple citation styles
- **Interactive Editing**: Drag-and-drop reordering, inline editing, auto-save
- **Presenter Mode**: Full keyboard navigation, clean fullscreen experience
- **Sharing & Export**: Public sharing links, PDF export, social media cards

### 🎨 Design Philosophy

- Apple/Tesla-level sophistication
- Modern, clean typography
- Generous whitespace
- Minimal UI chrome
- Focus on content quality

## Architecture

Dossier consists of two main components:

```
┌─────────────────┐         ┌──────────────────┐
│   Frontend      │────────▶│    Backend       │
│   (Next.js)     │         │  (Express API)   │
└─────────────────┘         └────────┬─────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
              ┌──────────┐    ┌──────────┐    ┌──────────┐
              │ Supabase │    │ Claude   │    │  Brave   │
              │(Postgres)│    │  Sonnet  │    │  Search  │
              └──────────┘    └──────────┘    └──────────┘
```

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Zustand (state management)
- shadcn/ui components

**Backend:**
- Node.js/Express
- TypeScript
- Anthropic Claude API
- Brave Search API
- Supabase (PostgreSQL + Auth)

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm, yarn, pnpm, or bun
- A Supabase account and project
- Anthropic API key
- Brave Search API key (optional, for web research)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/dossier.git
   cd dossier
   ```

2. **Set up the backend:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your API keys and configuration
   npm install
   npm run dev
   ```

3. **Set up the frontend:**
   ```bash
   cd frontend
   cp .env.example .env.local
   # Edit .env.local with your configuration
   npm install
   npm run dev
   ```

4. **Set up the database:**
   - Create a Supabase project
   - Run the migrations in `supabase/migrations/` in order
   - Configure authentication (Google OAuth recommended)

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080

For detailed setup instructions, see the [Setup Guide](#setup-guide) section.

## Setup Guide

### 1. Backend Configuration

Create a `.env` file in the `backend/` directory:

```bash
# Anthropic API Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Brave Search API Configuration (optional)
BRAVE_SEARCH_API_KEY=your_brave_search_api_key_here

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Server Configuration
PORT=8080
NODE_ENV=development

# CORS Configuration (optional, defaults to * in development)
CORS_ORIGIN=*
```

**Getting API Keys:**
- **Anthropic**: Get your API key from [console.anthropic.com](https://console.anthropic.com/)
- **Brave Search**: Get your API key from [brave.com/search/api](https://brave.com/search/api/)
- **Supabase**: Get your credentials from your project's API settings

### 2. Frontend Configuration

Create a `.env.local` file in the `frontend/` directory:

```bash
# Backend API URL (no trailing slash!)
NEXT_PUBLIC_API_URL=http://localhost:8080

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Database Setup

1. Create a new project in [Supabase](https://supabase.com/)
2. Go to the SQL Editor
3. Run the migration files from `supabase/migrations/` in order:
   - `001_initial_schema.sql`
   - `001_create_drafts_table.sql`
   - `002_create_presentations_table.sql`
   - `003_create_users_table.sql`
   - `004_add_presentation_status.sql`

4. Configure Authentication:
   - Go to Authentication → Providers
   - Enable Google OAuth
   - Configure redirect URLs

### 4. Running the Application

**Development mode:**

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

**Production build:**

Backend:
```bash
cd backend
npm run build
npm start
```

Frontend:
```bash
cd frontend
npm run build
npm start
```

## Project Structure

```
dossier/
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── agents/         # AI agent implementations
│   │   ├── api/            # API route handlers
│   │   ├── config/         # Configuration files
│   │   ├── services/       # Business logic services
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   ├── dist/               # Compiled JavaScript
│   └── package.json
├── frontend/                # Next.js frontend application
│   ├── app/                # Next.js App Router pages
│   ├── components/         # React components
│   ├── lib/                # Utility libraries
│   ├── store/              # Zustand state stores
│   └── package.json
├── supabase/
│   └── migrations/         # Database migration files
├── LICENSE                 # AGPL-3.0 license
├── README.md              # This file
└── CONTRIBUTING.md        # Contribution guidelines
```

## Development

### Running Tests

Currently, the project uses manual testing. Automated tests are planned for future releases.

### Code Style

- TypeScript with strict mode enabled
- ESLint for code linting
- Prettier for code formatting (recommended)
- Follow existing code patterns and conventions

### Making Changes

1. Create a feature branch from `main`
2. Make your changes
3. Test thoroughly
4. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.

## Deployment

Dossier can be deployed to various platforms:

- **Vercel** (recommended for Next.js frontend)
- **Railway** (supports both frontend and backend)
- **Render** (supports both frontend and backend)
- **GCP Cloud Run** (for backend)

See [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md) for detailed deployment instructions.

### Environment Variables for Production

Make sure to set all required environment variables in your deployment platform. See `.env.example` files in `backend/` and `frontend/` directories for reference.

**Important:** Never commit `.env` files or expose API keys in your code.

## Configuration

### Environment Variables

See the `.env.example` files in both `backend/` and `frontend/` directories for all available configuration options.

### CORS Configuration

Configure CORS in production by setting the `CORS_ORIGIN` environment variable in the backend to your frontend URL. In development, it defaults to `*` to allow all origins.

## Documentation

- [Architecture Documentation](architecture.md) - System architecture and design decisions
- [Deployment Guide](DEPLOYMENT-CHECKLIST.md) - Deployment instructions and checklist
- [Contributing Guidelines](CONTRIBUTING.md) - How to contribute to the project
- [Frontend README](frontend/README.md) - Frontend-specific documentation

## License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Support

- **Documentation**: Check the docs in this repository
- **Issues**: Open an issue on GitHub for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Anthropic Claude](https://www.anthropic.com/)
- Database and auth by [Supabase](https://supabase.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)

---

**Made with ❤️ by the Dossier team**

