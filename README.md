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

## Backend Setup (Supabase)

### 1. Database Migration
- Go to your Supabase project > SQL Editor
- Paste and run the contents of `supabase/schema.sql` to create all tables and RLS policies

### 2. Auth & Roles
- Enable email/password auth in Supabase Auth settings
- By default, users are assigned `role = "client"` (see Edge Function below)
- Promote admin users by updating their `user_metadata.role` to `admin` in the dashboard or via SQL

### 3. Storage Bucket
- Create a bucket named `documents`
- Set storage policies so clients can only access their own files (see below)

### 4. Environment Variables
- Copy `.env.example` to `.env.local` and fill in your Supabase project values

### 5. Validation Checklist
- [ ] Log in as a client, confirm you can only see your own data
- [ ] Log in as an admin, confirm you can see all data
- [ ] Upload a document, confirm storage RLS works (client can only access their own)
- [ ] Intentionally break a DB call in the frontend, confirm error handling (toast, no crash)

### 6. Frontend Error Handling Checklist
- [ ] Wrap every Supabase call in `try/catch`
- [ ] Show user-friendly toasts on failure
- [ ] Do not allow app crashes on bad Supabase responses

### 7. Pushing Backend to GitHub
- Add/commit `supabase/schema.sql`, `.env.example`, and this updated `README.md`
- Push to `main` on https://github.com/BluenSaint/saintrix-credit-reclaiml.git

---

© SAINTRIX. All rights reserved.
