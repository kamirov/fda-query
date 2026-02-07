# FDA Query

A web app to query the [openFDA Drug Labels API](https://open.fda.gov/apis/drug/label/) by generic substance names. Enter one or more substance names, choose which fields to display and to count, run the query, and view or filter results. You can share a link to a pre-filled query or download results.

## How it's built

- **Vite 7** + **React 19** + **TypeScript**
- **Tailwind CSS** for styling
- **Radix UI** (via ShadCN components) for UI primitives
- **Lucide React** for icons
- **Sonner** for toasts

The app uses the public [openFDA Drug Labels API](https://open.fda.gov/apis/drug/label/). An optional API key (from [openFDA](https://open.fda.gov/apis/authentication/)) can be used for higher rate limits.

## How to run

**Prerequisites:** Node.js, [pnpm](https://pnpm.io/)

```bash
pnpm install
pnpm dev        # development server
pnpm build      # production build
pnpm preview    # preview production build
```
