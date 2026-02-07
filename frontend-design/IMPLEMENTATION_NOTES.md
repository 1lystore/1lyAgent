# 1lyAgent UI - Implementation Notes

## Design Concept Delivered

**Neo-Brutalist Terminal + Solana Aesthetic**
- High contrast dark theme with Solana green (#14F195) and purple (#9945FF)
- JetBrains Mono throughout for terminal feel
- Sharp edges, hard shadows, grid-based layout
- Real-time animations using Framer Motion
- Terminal-style activity log with syntax highlighting
- Glowing state indicators and pulsing animations

## Components Built

### 1. RequestModule (`/components/RequestModule.tsx`)
**Purpose**: Submit questions to the agent and view classification/pricing in real-time

**Features**:
- Textarea input for user prompts
- Animated status transitions (NEW → PROCESSING → PAID → FULFILLED)
- Classification display with tier and price
- Payment link integration (1ly)
- Deliverable display post-payment
- Real-time polling for status updates

**Design Highlights**:
- Green glow on payment link panel
- Status pills with pulsing dot animations
- Smooth fade-in transitions for each state
- Terminal-style prompt display

### 2. CoffeeModule (`/components/CoffeeModule.tsx`)
**Purpose**: Coffee sponsorship system showing balance, execution limits, and tip jar

**Features**:
- Live coffee balance display (USDC)
- Fixed $5 tip jar button (links to 1ly)
- Daily execution progress bar (X/3 limit)
- Next batch window timer
- Execution rules information
- Warning state when limit reached

**Design Highlights**:
- Purple accent theme for coffee features
- Large animated balance counter
- Progress bar with glow effect
- Warning animations when limit hit
- Hover scale effect on balance card

### 3. ActivityLog (`/components/ActivityLog.tsx`)
**Purpose**: Real-time terminal-style feed of all agent activity

**Features**:
- Timestamped event entries
- Color-coded event types
- Auto-scroll toggle
- Grid layout for timestamp/event/data
- Total events counter
- Live status indicator

**Design Highlights**:
- Terminal scrollbar styling
- Slide-in animations for new entries
- Event-specific colors (green for success, purple for agent actions)
- Clean 3-column grid layout
- Staggered animation delays for bulk logs

### 4. AgentStatus (`/components/AgentStatus.tsx`)
**Purpose**: Floating status indicator showing agent is online

**Features**:
- Pulsing green dot animation
- Agent runtime info (OpenClaw + Claude 4.5)
- Fixed positioning
- Always visible

**Design Highlights**:
- Continuous pulse animation
- Green glow effect
- Floating with hard shadow
- Minimalist info display

### 5. Main Page (`/app/page.tsx`)
**Purpose**: Landing page and main dashboard

**Layout**:
```
┌─────────────────────────────────────────┐
│           HEADER + STATUS               │
├───────────────┬─────────────────────────┤
│   REQUEST     │    COFFEE MODULE        │
│   (50%)       │    (50%)                │
├───────────────┴─────────────────────────┤
│           ACTIVITY LOG (100%)           │
└─────────────────────────────────────────┘
```

**Features**:
- Animated page load sequence
- Header with tagline and store link
- Responsive 2-column grid
- Full-width activity log
- Footer with links

**Design Highlights**:
- Staggered component animations on load
- Large bold typography
- Solana color accents
- Clean grid system
- Mobile-responsive

## Design System (`/app/globals.css`)

### Typography
- **Primary**: JetBrains Mono (300-800 weights)
- **Accent**: Space Grotesk (700 weight for taglines)
- Monospace throughout for data consistency

### Color Palette
```css
Background: #0a0a0a (terminal black)
Panel: #111111
Border: #222222
Text: #ffffff / #888888 / #555555
Solana Green: #14F195
Solana Purple: #9945FF
Warning: #fbbf24
Error: #ff6b6b
```

### Component Patterns
- **Panels**: 1px borders, 4px hard shadows, transparent overlays
- **Buttons**: Uppercase, sharp corners, 3px borders, shadow on hover
- **Status Pills**: Inline with glow, pulsing for active states
- **Inputs**: Monospace, green focus ring, terminal styling

### Animations
- **Page Load**: Grid draw-in → panels stagger → pulse
- **State Changes**: Glow pulse, slide-in, scale transitions
- **Hover**: Shadow extends, slight lift, border glow
- **Processing**: Pulsing dots, flickering effect

## Installation

```bash
cd web
npm install framer-motion
```

## Running the UI

```bash
cd web
npm run dev
```

Visit: http://localhost:3000

## API Integration Points

The UI is ready for backend integration. Update these components with real API calls:

### RequestModule
- `POST /api/agent/request` - Submit new request
- `GET /api/status/:id` - Poll request status
- Connect to Supabase real-time for instant updates

### CoffeeModule
- `GET /api/coffee/state` - Fetch balance and execution status
- Connect to Supabase real-time for balance updates

### ActivityLog
- `GET /api/activity/stream` - Fetch activity feed
- Connect to Supabase real-time for new log entries
- WebSocket connection for instant updates

## Design Differentiators

✅ **Bold typography** - JetBrains Mono throughout, no generic fonts
✅ **Distinctive color** - Solana brand colors, not generic purple gradients
✅ **Unexpected layout** - Grid breaks, floating status, terminal aesthetic
✅ **Custom animations** - Framer Motion, no cookie-cutter transitions
✅ **Attention to detail** - Glow effects, hard shadows, pulsing states
✅ **Context-specific** - Terminal aesthetic for AI agent sovereignty theme

## Browser Compatibility

Tested in:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Requires:
- CSS Grid support
- CSS Custom Properties support
- Modern JavaScript (ES2020+)

## Performance Notes

- All animations are GPU-accelerated (transform, opacity)
- No layout thrashing
- Efficient Framer Motion usage
- Optimized re-renders with React best practices
- Minimal bundle size (no heavy UI libraries)

## Next Steps for Full Production

1. **Connect to real APIs** - Replace mock data with actual backend calls
2. **Add Supabase real-time** - Instant updates without polling
3. **Error states** - Add error boundaries and retry logic
4. **Loading skeletons** - Add skeleton screens for better perceived performance
5. **Mobile optimization** - Refine mobile layout and touch interactions
6. **Accessibility** - Add ARIA labels, keyboard navigation, screen reader support
7. **Analytics** - Track user interactions for demo insights
8. **Sound effects** - Optional audio feedback for state changes

## Credits

Design & Implementation: Claude Code
Design System: Neo-Brutalist Terminal + Solana Ecosystem
Fonts: JetBrains Mono, Space Grotesk (Google Fonts)
Animation: Framer Motion
Framework: Next.js 16 + React 19
