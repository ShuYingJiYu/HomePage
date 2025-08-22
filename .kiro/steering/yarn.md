---
inclusion: always
---

# Project Development Guidelines

## Package Management
- Always use **yarn** as the package manager for this project
- Use `yarn add` for dependencies and `yarn add -D` for dev dependencies
- Run scripts with `yarn <script-name>` (e.g., `yarn dev`, `yarn build`)

## Tech Stack & Architecture
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system
- **Routing**: React Router DOM v6
- **Internationalization**: react-i18next
- **Build Tool**: Vite with custom configuration

## Code Organization
- Use the established folder structure in `src/`:
  - `components/` - Reusable UI components
  - `pages/` - Route-level components
  - `hooks/` - Custom React hooks
  - `utils/` - Utility functions
  - `types/` - TypeScript type definitions
- External data and configuration go in `data/` and `config/` directories

## Import Conventions
- Use path aliases defined in `tsconfig.json`:
  - `@/` for `./src/`
  - `@/components/` for components
  - `@/pages/` for pages
  - `@/hooks/` for hooks
  - `@/utils/` for utilities
  - `@/types/` for type definitions
  - `@/data/` for data files
  - `@/config/` for configuration

## Styling Guidelines
- Use Tailwind CSS classes for styling
- Follow the custom color palette (primary, secondary, gray variants)
- Use custom animations: `fade-in`, `slide-up`, `slide-down`, `bounce-gentle`
- Prefer utility classes over custom CSS when possible

## Development Workflow
- Run `yarn dev` for development server
- Run `yarn dev:fresh` to fetch fresh data and start development
- Use `yarn lint` and `yarn format` before committing
- Run `yarn type-check` to verify TypeScript compilation
- Build with `yarn build` (includes SEO generation and type checking)

## Code Quality
- Follow TypeScript strict mode conventions
- Use ESLint and Prettier configurations provided
- Ensure all components are properly typed
- Handle internationalization with react-i18next
- Include proper SEO meta tags using react-helmet-async