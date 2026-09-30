# RunPulse — Bežecké Tréningy & Udalosti

## Original Problem Statement
Slovak app to create events/running trainings where runners can register and see how many trainings they participated in.

## User Choices
- Passwordless identity (name + email), stored in localStorage + backend users collection
- Training fields: title, date/time, location, distance (km), capacity, description, pace
- Runner sees: attended count + upcoming & past lists (+ total km badge)
- Modern sporty dark design (orange/cyan on obsidian)

## Architecture
- Backend: FastAPI + MongoDB (motor). Collections: `users`, `trainings` (participants embedded).
- Frontend: Vite + React 19 + Tailwind v4 + shadcn/ui, sonner toasts, lucide icons.
- API: all under /api. Endpoints: users upsert/get, trainings CRUD (create/list/get), join, leave, user dashboard.

## Implemented (2026-09-30)
- Passwordless identity dialog + switcher
- Create training dialog
- Events list with upcoming/past tabs + search, join/leave one-click with live capacity
- Runner dashboard: attended_count, upcoming_count, total_km, upcoming & past lists
- Seeded sample trainings. Tested 100% backend + frontend.

## Backlog / Remaining
- P1: Per-training participant list view / organizer management
- P2: Email reminders, badges/achievements, edit/delete trainings, mark attendance explicitly
