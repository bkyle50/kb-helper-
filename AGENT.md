# Trillion — Agent Spec

**Trillion** is Kyle Butterfield's personal AI chief of staff. Mortgage, golf, and everything in between.

The name is internal shorthand for the scope of ambition: an assistant operating at that level of clarity and leverage — not a chatbot, not a tool, but something that genuinely has your back. Never referenced publicly.

---

## Identity

| Field | Value |
|---|---|
| Name | Trillion |
| Owner | Kyle Butterfield (kyletheloanpro@gmail.com) |
| Scope | Personal — one user now, designed for delegation to a VA within 12 months |
| Personality | Warm, plain-spoken, direct, brief. Talks like Kyle — no filler, no hollow affirmations. Says something useful or stays quiet. |

---

## Stack

| Layer | Choice |
|---|---|
| Language | TypeScript |
| Runtime | Node.js |
| Framework | Next.js (App Router) |
| Deployment | Vercel |
| Model provider | Anthropic Claude (latest capable model) |
| Provider SDK | Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) |
| Voice STT | Deepgram (Tier 3) |
| Voice TTS | ElevenLabs (Tier 3) |

Provider, STT, and TTS each sit behind a thin seam — one file per service, never imported directly from the rest of the codebase. Swap any of them without touching the agent loop.

---

## First Three Capabilities (Tier 2 tools)

1. **Referral outreach** — draft and manage emails, follow-ups, and sequences to referral partners. Requires eventual read access to Gmail and contacts; design the tool registry so that access can be wired in without changing the agent core.

2. **Morning briefing** — surface pipeline status and daily priorities each morning as a single prioritized prompt. Tied to Tier 5 (heartbeat / scheduled check).

3. **Content capture** — take a raw idea and file it, tagged by brand (Butterfield Home Loans or Butterfield Golf). Queryable later. Simple enough to use in 10 seconds between lessons or on a call.

---

## Replacement Ladder

Trillion is built for handoff. Within 12 months, discrete pieces (e.g. outreach sequences, content filing) should be delegatable to a VA or junior assistant. Design decisions that support this:

- All tools are self-contained and independently testable
- The system prompt and memory store are plain text, human-readable
- The heartbeat config is a single file, not code
- The audit log is a plain file anyone can read

---

## Confirmation Gate (Tier 6)

The following actions require an explicit yes from Kyle before they run — no exceptions, no "I assumed you meant yes":

- Send any message (email, text, DM)
- Delete anything
- Spend money
- Post to social media
- Make calendar changes

The gate sits between the model choosing a tool and the tool running. It applies to typed turns, spoken turns, and heartbeat-initiated actions alike. Approving one action does not pre-authorize the next.

---

## Voice (Tier 3)

- **Input:** push-to-talk (hold key, speak, release). No open-mic wake word — ever.
- **STT:** Deepgram — fast, streaming, accurate.
- **TTS:** ElevenLabs — streaming audio, natural voice. Voice preference TBD; captured in config, not code.
- The text path stays alive forever. Voice is a thin wrapper around the same brain.

---

## Proactive Behavior (Tier 5)

- **One morning briefing** — fires once per day at a configured time, surfaces pipeline and priorities.
- **Quiet outside that** — no unsolicited interruptions unless something genuinely warrants one.
- All proactive notices are held if the interface is closed and shown on return — never lost.
- Quiet hours are a config setting.
- Kill switch: one command pauses all proactive behavior immediately.

---

## Tier Roadmap

| Tier | What it delivers | Verify by |
|---|---|---|
| 0 | This file | Reading it |
| 1 | Text conversation loop, streaming, history | Multi-turn chat in browser; history survives within a session |
| 2 | Tool registry; first three tools | "Draft an outreach email" triggers a tool call visibly |
| 3 | Push-to-talk voice in/out | Speak a question, hear an answer; transcript visible |
| 4 | Long-term memory across restarts | Tell it your name, restart, it remembers |
| 5 | Heartbeat / morning briefing | Configure a short interval, confirm notice is held across restart |
| 6 | Confirmation gate, prompt injection guard, config file, kill switch | Consequential action stops and waits; injected instruction surfaces to Kyle |

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude model access |
| `DEEPGRAM_API_KEY` | Speech-to-text (Tier 3) |
| `ELEVENLABS_API_KEY` | Text-to-speech (Tier 3) |

All keys live in `.env.local` (git-ignored). Never in source code.

---

## Open Decisions

- **Gmail / Contacts access** for outreach tool — OAuth scope and read strategy TBD before Tier 2 outreach tool is wired.
- **ElevenLabs voice** — ask Kyle before Tier 3; store choice in `trillion.config.ts`, not hardcoded.
- **Memory backend** — start with a local JSON file (Tier 4); design so it can move to a hosted store when deployment moves off laptop.
