# 1lyAgent UI Design System

## Concept: Sovereign AI Commerce Terminal

**Vision**: A living dashboard that shows an autonomous AI agent making economic decisions in real-time. Every transaction visible. Every decision transparent. Bloomberg terminal meets AI sovereignty.

## Aesthetic Direction

**Neo-Brutalist Terminal + Solana Ecosystem**
- Sharp edges, hard shadows, high contrast
- Monospace everything for that "raw data" feel
- Grid-based layout with intentional breaks
- Terminal-style activity logs
- Glowing state indicators (purple/green for Solana)
- Transparent overlays showing system internals

## Typography

### Primary: JetBrains Mono
- Monospace throughout for consistency
- Use font-weight variation (300-800) for hierarchy
- Headers: 800 weight, tracking-tight
- Body: 400 weight
- Code/Data: 500 weight

### Accent: Space Grotesk (for marketing copy only)
- Agent tagline, hero statements
- 700 weight

## Color System

### Dark Theme (Primary)
```css
--bg-terminal: #0a0a0a
--bg-panel: #111111
--bg-panel-hover: #1a1a1a
--border: #222222
--border-active: #333333

--text-primary: #ffffff
--text-secondary: #888888
--text-tertiary: #555555

--accent-solana: #14F195 (Solana green)
--accent-purple: #9945FF (Solana purple)
--accent-warning: #ff6b6b
--accent-success: #14F195

--status-new: #9945FF
--status-processing: #fbbf24
--status-paid: #14F195
--status-fulfilled: #14F195
--status-failed: #ff6b6b
```

## Component Patterns

### Cards/Panels
- 1px solid borders
- Hard shadows (4px offset, no blur)
- Transparent backgrounds with 5% white overlay
- Glowing border on active state

### Buttons
- Uppercase text
- Tracking-wider
- Sharp corners
- 3px solid border
- Hard shadow on hover
- Animated state transitions

### Status Indicators
- Inline pills with glow effect
- Pulsing animation for "processing" states
- Color-coded by status
- Monospace labels

### Activity Log
- Terminal-style scrolling feed
- Timestamp + Event + Data in columns
- Syntax-highlighted JSON for payloads
- Auto-scroll with manual override

### Real-time Updates
- Smooth number countups
- Slide-in animations for new items
- Glow pulse on state change
- Terminal "flicker" effect on updates

## Layout Grid

### Desktop (1440px+)
```
┌─────────────────────────────────────────┐
│           HEADER (1lyAgent)             │
├───────────────┬─────────────────────────┤
│   REQUEST     │    COFFEE MODULE        │
│   MODULE      │                         │
│   (40%)       │    (30%)                │
├───────────────┼─────────────────────────┤
│   ACTIVITY LOG (100%)                   │
└─────────────────────────────────────────┘
```

### Mobile (< 768px)
- Stack vertically
- Fixed header
- Collapsible sections

## Motion Design

### Page Load
1. Grid lines draw in (0.8s ease-out)
2. Panels fade up with stagger (100ms delay each)
3. Status indicators pulse in
4. Activity log scrolls to latest

### State Changes
- Payment link created: Green glow pulse + sound effect
- Payment confirmed: Success animation (confetti particles)
- Agent thinking: Pulsing border on request card
- New activity: Slide in from right with highlight fade

### Micro-interactions
- Button hover: Shadow extends
- Card hover: Slight lift + border glow
- Input focus: Border expands outward
- Copy action: Checkmark morph animation

## Distinctive Elements

1. **"Agent Status" Heartbeat**: Floating indicator showing agent online/thinking/executing
2. **Live USDC Balance**: Animated counter with sparkle effect on increase
3. **Payment Flow Visualization**: Animated line connecting request → payment → fulfillment
4. **Terminal Window**: Activity log styled as actual terminal with PS1 prompt
5. **Solana Transaction Links**: Direct links to Solscan with external icon
6. **"Sovereign Mode" Toggle**: Shows agent's decision-making process in real-time

## Implementation Notes

- Use CSS Grid for layout
- Framer Motion for React animations
- CSS variables for theming
- No component library - custom everything
- Responsive breakpoints: 640px, 768px, 1024px, 1440px
