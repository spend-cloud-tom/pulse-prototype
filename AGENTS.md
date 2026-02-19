# AGENTS.md — Pulse Prototype

This file provides guidance for AI coding agents operating in this repository.

## Project Overview

Pulse is a React 18 + TypeScript prototype for a role-based care administration dashboard.
It uses Vite (SWC), shadcn/ui (Radix + Tailwind + CVA), Supabase (Postgres + Realtime),
framer-motion for animations, and react-router-dom v6 for routing.

## Build / Lint / Test Commands

```bash
npm run dev          # Start dev server on port 8080
npm run build        # Production build (vite build)
npm run build:dev    # Development build (vite build --mode development)
npm run lint         # ESLint across all .ts/.tsx files
npm run test         # Run all tests once (vitest run)
npm run test:watch   # Run tests in watch mode (vitest)
```

### Running a Single Test

```bash
npx vitest run src/test/example.test.ts          # Run one file
npx vitest run -t "should pass"                  # Run by test name
npx vitest run src/components/                   # Run all tests in a directory
```

### Test Configuration

- Framework: Vitest with jsdom environment
- Globals: `describe`, `it`, `expect` are available globally (no import needed)
- Setup file: `src/test/setup.ts` (loads jest-dom matchers + matchMedia polyfill)
- Test file pattern: `src/**/*.{test,spec}.{ts,tsx}`
- Libraries available: `@testing-library/react`, `@testing-library/jest-dom`
- Path alias `@/` works in tests (configured in `vitest.config.ts`)

## Project Structure

```
src/
  App.tsx                    # Root component with routing and providers
  main.tsx                   # React entry point (createRoot)
  index.css                  # Global CSS, Tailwind imports, CSS variables
  components/
    ui/                      # shadcn/ui primitives (button, card, dialog, etc.)
    views/                   # Role-specific dashboard views (AnoukView, RohanView, etc.)
    zones/                   # Layout zone components (ActionZone, ProgressZone, etc.)
    *.tsx                    # Domain components (PulseCard, OmniDock, RoleToggle, etc.)
  pages/                     # Route-level pages (Landing, Index, NotFound)
  hooks/                     # Custom hooks (useSignals, useMaintenanceTickets, etc.)
  lib/
    utils.ts                 # cn() Tailwind class merge utility
    decisionTypes.ts         # Signal classification logic, risk config
  context/
    RoleContext.tsx           # Global role/persona state + data provider
  data/
    types.ts                 # Core domain types (Role, Signal, SignalStatus, etc.)
    mockData.ts              # Static mock/seed data
  integrations/supabase/
    client.ts                # Supabase client init (auto-generated, do not edit)
    types.ts                 # Database schema types (auto-generated, do not edit)
  test/
    setup.ts                 # Vitest setup
    example.test.ts          # Placeholder test
```

## Code Style Guidelines

### TypeScript Configuration

- Strict mode is OFF (`strict: false`, `noImplicitAny: false`, `strictNullChecks: false`)
- Target: ES2020, Module: ESNext, JSX: react-jsx
- Unused variables/parameters are allowed (ESLint rule `@typescript-eslint/no-unused-vars: off`)

### Imports

- Always use the `@/` path alias for internal imports (e.g., `@/components/ui/button`)
- Relative imports are only acceptable in entry files (`main.tsx`) or co-located data files
- Ordering convention (no blank-line separators required):
  1. React core (`useState`, `useEffect`, etc.)
  2. Third-party libraries (`framer-motion`, `lucide-react`, `react-router-dom`)
  3. Internal imports via `@/` (components, hooks, context, data, lib)
- Use `import type` for type-only imports when importing from generated files:
  `import type { Tables } from '@/integrations/supabase/types'`

### Components

- Use **arrow function** components: `const MyComponent = () => { ... };`
- Use **`export default ComponentName`** at the bottom of the file for pages, views,
  zones, and domain components
- shadcn/ui primitives use **named exports** — do not change this pattern
- Props: use `interface FooProps { }` for public components; inline types are acceptable
  for small internal sub-components
- Sub-components defined in the same file also use PascalCase arrow functions

### File Naming

| Category               | Convention   | Example                          |
|------------------------|-------------|----------------------------------|
| Domain components      | PascalCase  | `PulseCard.tsx`, `RoleToggle.tsx` |
| Page components        | PascalCase  | `Landing.tsx`, `Index.tsx`        |
| shadcn/ui primitives   | kebab-case  | `button.tsx`, `alert-dialog.tsx`  |
| shadcn hooks           | kebab-case  | `use-mobile.tsx`, `use-toast.ts`  |
| Custom domain hooks    | camelCase   | `useSignals.ts`                   |
| Data/lib/type files    | camelCase   | `mockData.ts`, `types.ts`         |

Use `.tsx` for files containing JSX; `.ts` for pure logic and types.

### Naming Conventions

- **Components**: PascalCase (`PulseCard`, `AutomationBanner`)
- **Functions**: camelCase (`classifySignal`, `formatTimeAgo`)
- **Event handlers**: prefix with `handle` (`handleSubmit`, `handleResolve`)
- **Hooks**: prefix with `use` (`useRole`, `useSignals`)
- **Variables/state**: camelCase (`activeRole`, `searchQuery`)
- **True constants**: SCREAMING_SNAKE_CASE (`MOBILE_BREAKPOINT`, `TOAST_LIMIT`)
- **Config objects/maps**: camelCase (`riskConfig`, `statusLabels`)
- **Types/interfaces**: PascalCase (`Signal`, `FilterState`)
- **Prop interfaces**: PascalCase suffixed with `Props` (`PulseCardProps`)

### Types

- Define domain types in `src/data/types.ts`; classification types in `src/lib/decisionTypes.ts`
- Use `interface` for component props and object shapes
- Use `type` for unions, aliases, and discriminated unions
- Component-local prop interfaces are not exported unless needed by other files
- Supabase types in `src/integrations/supabase/types.ts` are auto-generated — do not edit

### Styling

- Tailwind CSS with CSS variable theming (HSL values defined in `src/index.css`)
- Always use the `cn()` utility from `@/lib/utils` for conditional/merged classes
- shadcn/ui components use `class-variance-authority` (CVA) for variants
- Color system: semantic tokens (`primary`, `secondary`, `destructive`, `muted`, `accent`,
  `signal-green/amber/red`, `hero-teal/purple/coral`)
- Typography: `font-display` (Nunito) for headings, `font-sans`/`font-ui` for data/UI

### State Management

- **Global state**: `RoleContext` in `src/context/RoleContext.tsx` (role, signals, tickets)
- **Server state**: Custom hooks with Supabase realtime subscriptions (`useSignals`,
  `useMaintenanceTickets`) — these manage their own local state, not React Query
- **Local UI state**: `useState` for component-scoped state
- React Query (`@tanstack/react-query`) provider is set up but not actively used

### Error Handling

- Supabase read operations: log errors with `console.error`, fall back to empty data
- Supabase write operations: log errors with `console.error` and `throw error`
- User-facing feedback: use `toast()` from `sonner` for action confirmations/errors
- Date parsing and similar operations: wrap in `try/catch` with safe fallback
- No React Error Boundaries are used in this codebase

### Supabase Integration

- Client is a typed singleton in `src/integrations/supabase/client.ts` (auto-generated)
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- Hooks use `supabase.channel().on('postgres_changes', ...)` for realtime updates
- Always clean up channels on unmount: `return () => { supabase.removeChannel(channel); }`
- Derive typed aliases from generated types: `type DbSignal = Tables<'signals'>`

### Do Not Edit

- `src/integrations/supabase/client.ts` — auto-generated Supabase client
- `src/integrations/supabase/types.ts` — auto-generated database types
- `src/components/ui/` — shadcn/ui primitives (regenerate via shadcn CLI if updates needed)
