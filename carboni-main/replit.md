# Overview

This is a complete full-stack TypeScript carbon footprint tracking application built with a modern web stack. The application allows users to log daily activities related to transport, energy consumption, and food choices, then calculates and tracks their carbon emissions over time using EPA 2025 emission factors. Users can set goals, view leaderboards, and monitor their environmental impact through interactive charts and dashboards.

# Recent Changes

## July 17, 2025
- Built complete carbon footprint tracking system with Replit Auth
- Implemented activity logging with real-time CO2 calculations
- Added comprehensive dashboard with emissions charts and personalized tips
- Created leaderboard system for community comparison
- Built goal setting and progress tracking features
- Fixed validation schema issues and TypeScript errors
- Resolved navigation component React warnings

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

The application follows a clean separation between client and server, with shared type definitions and schemas. It uses a monorepo structure with TypeScript throughout, modern React patterns, and PostgreSQL for data persistence.

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Radix UI components with Tailwind CSS styling using the shadcn/ui design system
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Charts**: Chart.js for emissions visualization

## Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Replit Auth integration with OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple

# Key Components

## Database Schema
The application uses PostgreSQL with the following main tables:
- `users` - User profiles and authentication data
- `activities` - Daily carbon emission activities (transport, energy, food)
- `goals` - User-defined emission reduction targets
- `achievements` - Gamification rewards for reaching milestones
- `sessions` - Authentication session storage

## API Structure
RESTful endpoints organized around main features:
- `/api/auth/*` - Authentication flow with Replit Auth
- `/api/activities` - CRUD operations for emission activities
- `/api/goals` - Goal setting and tracking
- `/api/dashboard` - Aggregated analytics data
- `/api/leaderboard` - Community comparison features

## Carbon Calculation Engine
Built-in emission factors for various activities:
- **Transport**: Car (gasoline/electric), bus, train, bike, walking
- **Energy**: Electricity and natural gas consumption
- **Food**: Beef, chicken, and vegetable servings

Each activity automatically calculates CO2 equivalent emissions using EPA 2025 data.

# Data Flow

1. **User Authentication**: Replit Auth handles OAuth flow, stores user data in PostgreSQL
2. **Activity Logging**: Users input daily activities through forms, emissions calculated server-side
3. **Data Aggregation**: Dashboard queries aggregate emissions by category and time period
4. **Visualization**: Chart.js renders emission trends and category breakdowns
5. **Goal Tracking**: System compares actual emissions against user-defined targets
6. **Leaderboard**: Rankings calculated from total emissions across all users

# External Dependencies

## Core Dependencies
- **Database**: Neon PostgreSQL serverless database
- **Authentication**: Replit's OpenID Connect service
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **Charts**: Chart.js for data visualization
- **Validation**: Zod for runtime type checking

## Development Tools
- **TypeScript**: Full type safety across client/server
- **Tailwind CSS**: Utility-first styling with custom design tokens
- **ESBuild**: Fast server bundling for production
- **Drizzle Kit**: Database migrations and schema management

# Deployment Strategy

The application is designed for Replit deployment with environment-based configuration:

## Development
- Vite dev server with HMR for client-side development
- tsx for server-side TypeScript execution
- Database migrations run via `drizzle-kit push`

## Production
- Client built to static assets via Vite
- Server bundled with ESBuild targeting Node.js ESM
- Session storage and user data persisted in PostgreSQL
- Environment variables required: `DATABASE_URL`, `SESSION_SECRET`, `REPL_ID`

The build process creates a single Node.js application serving both the API and static frontend assets, optimized for serverless deployment environments.