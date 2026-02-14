# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Automated Assistant — a Next.js 16 chat application using the Vercel AI SDK with OpenAI integration.

## Commands

- **Dev server:** `npm run dev` (runs on http://localhost:3000)
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Type check:** `npx tsc --noEmit`

## Tech Stack

- **Next.js 16** with App Router (`src/app/`)
- **React 19** with React Compiler enabled (`next.config.ts`)
- **Vercel AI SDK** (`ai` + `@ai-sdk/openai`) for streaming chat
- **Tailwind CSS v4** - uses new CSS-native syntax with `@import "tailwindcss"` and `@theme inline`
- **Zod** for schema validation
- **TypeScript** in strict mode

## Architecture Notes

- Path alias: `@/*` maps to `./src/*`
- API routes for AI streaming go in `src/app/api/` (e.g., `src/app/api/chat/route.ts`)
- Use `useChat` hook from `ai/react` for client-side chat state
- Tailwind v4 theming is configured via CSS variables in `src/app/globals.css`
