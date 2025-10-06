
# AI-Powered Brainstorming Board (minimal demo)

This is a minimal Trello-like brainstorming board with simple AI hooks for idea suggestions, clustering, and summarization.

Setup
- Requires Node 14+.
- Install dependencies: npm install
- Run: npm start (then open http://localhost:3000)
- Optional: set OPENAI_API_KEY to use real AI features.

Client (React) frontend
- A modern React + Vite client has been added in `client/`. To run it:
	- cd client
	- npm install
	- npm run dev

Run both locally
- Start the server in the project root: `npm start`
- Start the client in `client/`: `npm run dev`

Deployment notes
- This app is a minimal Node/Express app and can be deployed to services like Render, Fly.io, or Heroku.
- Environment: set OPENAI_API_KEY to enable real AI suggestions, clustering, and summarization.

New features (polish)
- Improved UI with header, nicer buttons, and responsive layout.
- Export board as Markdown (header button).
- Mood analysis UI hook (button available per card). Server endpoint `/api/mood` can be implemented to use sentiment analysis or OpenAI.

Features
- Simple username login (no password) — creates per-user boards in SQLite.
- Add/Edit/Delete cards, drag-and-drop between columns.
- AI endpoints: /api/suggest, /api/cluster, /api/summarize. If OPENAI_API_KEY not set, responses are mocked.

Notes
- This is a demo scaffold for the assignment. For production, add proper auth, validation, rate-limits, and secrets management.
=======
# AI-Powered-Brainstorming-Board
>>>>>>> 2f3de6e8c7f0d265dad18078999c3702a8896edc
