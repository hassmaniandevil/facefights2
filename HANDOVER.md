# HANDOVER.md — FaceFights2

> Status: BARELY STARTED

## What This Product Is

FaceFights2 is a Next.js-based rebuild attempt of the FaceFights face-controlled fighting game. It uses a modern stack (Next.js 16, React 19, Tailwind v4) and includes CSS-based fighters and arenas with animation support. It was an intermediate iteration between the original FaceFights and the full v3 rewrite.

## Tech Stack

- **Framework**: Next.js 16.1.6, React 19, TypeScript
- **Face detection**: @mediapipe/tasks-vision, @tensorflow/tfjs
- **State management**: Zustand
- **Styling**: Tailwind CSS v4
- **Video**: mp4-muxer, gif.js
- **Backend**: Supabase (client SDK included)
- **Safety**: nsfwjs
- **IDs**: uuid
- **Deployment**: Vercel (configured, .vercel dir present, .next build exists)

## What Is Built and Working

- Next.js app scaffold with app router (page.tsx, layout.tsx, globals.css)
- Full game engine with:
  - BlendshapeMapper, ExpressionEngine, ExpressionGate
  - CombatEngine, ComboEngine, BotEngine, GameLoop
  - CalibrationEngine, FaceLandmarker integration
  - Core types, constants, EventBus, arenas
- Fighter definitions
- CSS fighters, arenas, and animations with camera fallback
- UI components, rendering system, recording system
- Story mode, metagame, network, audio, and services directories
- Deployed build (.next directory, Vercel config)
- 4 commits total

## What Is Unfinished

- Only basic page (page.tsx) in the app directory -- no routing beyond home
- No backend/API (only Supabase client SDK)
- No multiplayer/PvP
- No user accounts or authentication
- No cosmetics store
- README is still the default create-next-app boilerplate

## Known Bugs

- Camera fallback was recently fixed (may need further testing across browsers)
- CSS fighter rendering may have edge cases on mobile

## Project Structure

```
facefights2/
├── src/
│   ├── app/            # Next.js app router (page.tsx, layout.tsx)
│   ├── core/           # arenas, constants, EventBus, types
│   ├── engine/         # BlendshapeMapper, CombatEngine, ComboEngine, BotEngine, etc.
│   ├── fighters/       # Fighter definitions
│   ├── audio/
│   ├── lib/
│   ├── metagame/
│   ├── network/
│   ├── recording/
│   ├── rendering/
│   ├── services/
│   ├── story/
│   ├── styles/
│   ├── ui/
│   └── utils/
├── public/
├── .next/              # Built output
├── .vercel/            # Vercel deployment config
├── package.json
├── next.config.ts
├── tsconfig.json
└── vercel.json
```

## How to Run It

```bash
npm install
npm run dev     # localhost:3000
npm run build
npm run start
```

## Env Var Names

No .env.example file exists. Supabase credentials are likely needed (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) but not documented.

## Next Steps (In Order)

1. This version is superseded by facefightsv3 -- no further development expected here
2. If resuming: add proper routing and game screens beyond the home page
3. Connect Supabase backend for auth and data persistence
4. Add multiplayer/PvP support
5. Write a proper README

## Key Documentation

- `/Users/hassanyasin/facefights2/package.json` -- Dependencies and scripts
- `/Users/hassanyasin/facefights2/README.md` -- Default Next.js boilerplate (not customised)
