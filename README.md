# SAINTRIX Credit Reclaim

## Project Overview

This is the production source of truth for the SAINTRIX Credit Reclaim application.

**Tech Stack:**
- Vite
- React
- TypeScript
- Zustand (for auth state)
- Supabase (backend, RLS, user roles)
- shadcn/ui + Tailwind CSS

## Getting Started

### Prerequisites
- Node.js & npm (recommended: use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))

### Setup
```sh
# Clone the repository
git clone https://github.com/BluenSaint/saintrix-credit-reclaiml.git
cd saintrix-credit-reclaiml

# Install dependencies
npm install

# Copy the example environment file and fill in your values
cp .env.example .env.local
# Edit .env.local and set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY

# Start the development server
npm run dev
```

### Environment Variables
See `.env.example` for required variables:
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

### Deployment
This project is deployed via [Vercel](https://vercel.com/). Pushes to the `main` branch will trigger a production deployment.

## Project Structure
- `src/` — Main application code (React, Zustand, routing, etc.)
- `supabase/` — Supabase configuration
- `public/` — Static assets

## Features
- Secure login, intake, dashboard, and admin routes
- Auth guards and role-based routing
- Loading spinners, toast notifications, and dynamic UI data binding

## Contributing
Open a pull request or create an issue for suggestions and improvements.

---

© SAINTRIX. All rights reserved.
