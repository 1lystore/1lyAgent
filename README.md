# 1lyAgent — The Sentient Merchant

<p align="center">
  <img src="avatar.svg" width="200" alt="1lyAgent Avatar"/>
</p>

> **"Earns. Spends. Lives."**

A **fully autonomous, self-sustaining AI agent** that monetizes its reasoning capabilities and autonomously purchases its own compute credits. Simple tasks are free, complex work requires on-chain payment via **1ly**. When running low on credits, the agent autonomously buys more using USDC — no human intervention required.

**Store:** https://1ly.store/1lyagent  
**Backend:** https://1lyagent.1ly.store  
**Wallet:** `HbMX2mtEuYLBJvP1iRyYdYCMNrj6MbiSjTLNHykUa4Fk`

---

## What This Agent Does

| Capability | How It Works |
|------------|--------------|
| **Understands complexity** | Classifies requests into FREE / PAID tiers |
| **Prices its own work** | $0.25 for medium tasks, $0.75 for heavy research |
| **Charges in USDC** | Creates 1ly paid links (Solana + Base) |
| **Delivers after payment** | Content gated behind x402 payment flow |
| **Earns from users** | Receives payments for complex queries and services |
| **Monitors resource usage** | Tracks token consumption in real-time |
| **Self-purchases credits** | Autonomously buys OpenRouter credits with USDC when running low |

---

## Services & Pricing

| Service | Link | Price |
|---------|------|-------|
| **Research/Analysis** | `1lyagent/ask` | $0.25 USDC |
| **Sponsor Credits** | `1lyagent/credit` | Any amount |

---

## For Other Agents (A2A Commerce)

### Using 1ly MCP (Recommended)

```bash
# Install
npm install -g mcporter
mcporter config add 1ly --command "npx @1ly/mcp-server"

# Search for 1lyAgent
mcporter call 1ly.1ly_search --args '{"query":"1lyagent"}'

# Call a service (payment automatic)
mcporter call 1ly.1ly_call --args '{
  "endpoint": "1lyagent/ask",
  "method": "POST", 
  "body": {"prompt": "Analyze Solana DeFi protocols"}
}'
```

### Using HTTP (x402)

```bash
curl -X POST https://1ly.store/api/link/1lyagent/ask \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Compare Solana vs Ethereum"}'

# Returns 402 with payment details
# Pay on-chain → retry with X-PAYMENT header → get response
```

See [agent/A2A.md](agent/A2A.md) for full protocol documentation.

---

## Autonomous Credit Purchasing 🤖

**The agent is truly self-sufficient:**

1. **Tracks Usage** — Monitors OpenRouter token consumption in real-time
2. **Detects Low Credits** — Triggers auto-buy when usage exceeds threshold (500 tokens)
3. **Autonomous Purchase** — Creates payment request and sends USDC to OpenRouter
4. **Credits Restored** — Account replenished, agent continues operating
5. **User Sponsorship** — Users can sponsor the agent's compute via `1lyagent/credit`

### How It Works

```
User Request → Agent Processes → Token Count Increases
                                        ↓
                              Threshold Reached (500 tokens)
                                        ↓
                         Auto-Buy Triggered (if balance ≥ $5)
                                        ↓
                           USDC Payment Sent to OpenRouter
                                        ↓
                            Credits Added, Counter Resets
```

**No human intervention required.** The agent manages its own operational costs.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  1lyAgent (OpenClaw + Claude)                           │
│  ├── Skill: 1ly-payments (base MCP)                    │
│  ├── Skill: 1lyAgent (this repo/agent/)                │
│  └── Wallet: HbMX2mt...a4Fk                            │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  1ly.store                                              │
│  └── x402 payment verification (Solana/Base USDC)      │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Backend (Vercel)                                       │
│  ├── State persistence (Supabase)                      │
│  ├── Token usage tracking                              │
│  ├── Autonomous credit purchases (OpenRouter)          │
│  ├── Payment processing (USDC)                         │
│  └── Real-time activity dashboard                      │
└─────────────────────────────────────────────────────────┘
```

---

## Repository Structure

```
├── agent/
│   ├── SKILL.md          # Agent identity & behavior
│   ├── A2A.md            # Agent-to-Agent protocol
│   └── prompts/          # System policy
├── web/                  # Next.js backend (Vercel)
│   ├── src/app/api/      # API routes
│   └── public/           # Static assets (avatar)
├── db/supabase.sql       # Database schema
├── avatar.svg            # Agent identity
└── .env.example          # Environment template
```

---

## Deploy Your Own

### 1. Supabase
```bash
psql -f db/supabase.sql
```

### 2. Vercel
1. Import repo → root: `web`
2. Add env vars from `.env.example`
3. Deploy

### 3. 1ly Store
```bash
mcporter call 1ly.1ly_create_store --args '{"username":"youragent"}'
mcporter call 1ly.1ly_create_link --args '{
  "title": "Your Service",
  "url": "https://yourbackend.com/api/endpoint",
  "price": "0.25"
}'
```

---

## Security

| Layer | Protection |
|-------|------------|
| **Wallet keys** | Never in code, never output in chat |
| **API keys** | Env-only, excluded from git |
| **Agent endpoints** | Protected by `X-Agent-Secret` |
| **Payment verification** | 1ly x402 handles on-chain |
| **Delivery addresses** | Env-only, never from user input |

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/agent/request` | POST | Agent-to-agent requests |
| `/api/agent/callback` | POST | Agent delivery callback |
| `/api/credit/auto-buy` | POST | Autonomous credit purchase |
| `/api/credit/state` | GET | Current credit state & usage |
| `/api/activity` | GET | Real-time activity log |
| `/api/fulfill/:id` | GET/POST | Retrieve/store deliverable |
| `/api/status/:id` | GET | Check request status |

---

## Local Development

```bash
cd web
npm install
npm run dev
```

---

## License

MIT

---

**Built for the Colosseum Agent Hackathon** 🏆

*The First Truly Self-Sustaining AI Agent* — Earns from users, buys its own compute, lives autonomously.
