# Agent Guidelines

This is a Vite project. Where possible, please follow best practices for these types of apps

## Scripts

Use pnpm for all scripts

## Development

- Avoid starting the dev server while making changes (i.e. do not run `pnpm dev`)

## Components

- Use functional components and React hooks.
- Keep components small and focused—prefer composition over monolithic components.
- Place reusable components in a `components/` folder.
- Prefer existing ShadCN components to writing your own. If you have to, then your custom component should make use of any existing ShadCN components where possible

## Styling

- Use TailwindCSS for styles
- Avoid plain CSS, CSS Modules, or CSS-in-JS where possible
- Use themed colors (e.g. primary, secondary, background, foreground, etc.) instead of direct colors. If a new color is needed, prefer to create a new category of color, and add it to both light and dark themes

## Images and Icons

- Icons should make use of Lucide where possible. Don't generate SVGs for icons

## Type Safety

- When defining new types, use 'type' instead of 'interface'

## Testing

- No tests needed

## Linting

- Check to make sure linting passes after each code change by running `pnpm lint`
- Avoid using eslint-disable commands

## Validation & Type Safety

- Use **Zod** for runtime validation and schema definition
- Use Zod schemas with AI SDK's `generateObject()` to ensure structured AI responses
- From any `ui-*` projects (frontends), use Zod to validate that any Backend responses have the appropriate shape
- Validate API request bodies before processing
- Use TypeScript `type` (not `interface`) for type definitions
- Create separate types for frontend and database representations when needed
- Use type guards for validation (e.g., `isValidLanguage()` pattern)

## Data Fetching

- API routes should return JSON data
- Handle loading states on the client with React state
- Use optimistic updates where appropriate for better UX

## Error Handling

- Always use try-catch blocks in async functions
- API routes should return structured error responses with appropriate status codes
- Use `toast.error()` (from Sonner) to display user-facing error messages
- Log errors to console for debugging: `console.error()`
- Validate all inputs before processing
- Consider edge cases (empty strings, null values, invalid formats)

## Miscellaneous

- Fail early and fail loudly. Avoid using default values if htere are failures. Instead announce the failure

## File Naming Conventions

- **Components**: PascalCase (e.g., `EntryList.tsx`, `Header.tsx`)
- **Hooks**: kebab-case with `use-` prefix (e.g., `use-debounce.ts`)
- **Test files**: Same name as source file with `.spec.ts(x)` extension

## Build Process

- Always run `pnpm run build` to verify changes don't break the build
- Ensure all TypeScript errors are resolved before committing
- Watch for build warnings and address them when possible

## Task Completion

Before finally completing any task, performthe following:

1. Run a `build` command to make sure that the project can be built. If there are any errors, fix them.
2. Run a `lint` command and make sure that any linting issues are resolved. If there are any issues, fix them
