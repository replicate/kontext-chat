# Kontext Chat

A chat app that generates images using Replicate and Cloudflare Workers.

Kontext Chat is powered by [FLUX.1 Kontext Pro](https://replicate.com/black-forest-labs/flux-kontext-pro), a new image model from Black Forest Labs, running on [Replicate](https://replicate.com/black-forest-labs/flux-kontext-pro). The app is built with Hono and React and it deployed on [Cloudflare Workers](https://workers.dev/).

See [kontext-chat.replicate.dev](https://kontext-chat.replicate.dev/) for a live demo.

## Local Development

1. Install dependencies:
   ```sh
   npm install
   ```

1. Get a Replicate API Token:
   - Sign up at https://replicate.com/ and get your REPLICATE_API_TOKEN from your account settings at https://replicate.com/account/api-tokens.

1. Set up your local environment:
   - Create a .dev.vars file in the project root (already present in this repo) and add your token:
     ```
     REPLICATE_API_TOKEN=your-token-here
     ```

1. Start the local dev server:
   ```sh
   npm run dev
   ```
   - The app will be available at http://localhost:8787 by default.

## Deployment to Cloudflare

1. Authenticate Wrangler:
   ```sh
   npx wrangler login
   ```

1. Set your Replicate API token as a secret:
   ```sh
   npx wrangler secret put REPLICATE_API_TOKEN
   ```

1. Deploy:
   ```sh
   npm run deploy
   ```
   - Your app will be deployed to your Cloudflare Workers account.

## Notes

- The frontend is served from the public/ directory.
- The backend is a Cloudflare Worker (entry: src/index.ts).
- The app requires a valid REPLICATE_API_TOKEN to function.
