# Environment configuration

Copy `.env.example` to `.env.local` in this directory and configure local values.
Never commit populated environment files. Injected deployment variables take
precedence over local files. The API, operator commands and Convex CLI wrapper use
the shared loader at `src/config/env.js`.

Vercel settings remain in Vercel. Auxiliary local environment files can also live
here; they are loaded only when explicitly selected by a command.
