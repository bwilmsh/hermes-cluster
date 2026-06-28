# AI Studio Scheduler

Clean-room rebuild of an AI personal-assistant day planner. Multi-agent build with four parallel sub-agents (design / backend / agent-service / frontend-wiring). See IMPLEMENTATION.md for the full plan.

## Services
- Frontend: Next.js 14 App Router, TypeScript, Tailwind — port 3000
- Backend:  Express 5 + TypeScript + Prisma 6 + PostgreSQL — port 3001
- Agent:    FastAPI + Python — port 8000

## Run
```bash
npm run install:all   # installs frontend + backend workspaces, agent pip deps
npx prisma migrate dev --name init   # then
npm run dev
```
