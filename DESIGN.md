---
name: "OrderWise Streaming Dark"
description: "Dark, streaming-style UI. Near-black ground, one red accent, pill buttons, rounded cards, bold sans headings. Text-first, calm, high contrast."
tags: [dark, streaming, enterprise, high-contrast, red-accent]
colors:
  bg: "#0A0A0A"
  surface: "#161616"
  surface_inset: "#232323"
  border: "#2A2A2A"
  text_primary: "#FFFFFF"
  text_secondary: "#A8A8A8"
  accent: "#E50914"
  series_reserved: "#8A8A8A"
  ok: "#4ADE80"
  warning: "#F5B544"
  danger: "#FF7A7A"
  alert_bg: "#2B2010"
  alert_border: "#5A4210"
typography:
  headings: "\"Helvetica Neue\", Arial, sans-serif"
  body: "\"Helvetica Neue\", Arial, sans-serif"
  mono: "\"IBM Plex Mono\", monospace"
  scale:
    landing_h1: "60px / 1.02 / 700 / -0.03em"
    dashboard_h1: "34px / 1.15 / 700 / -0.02em"
    section_h2_landing: "32px / 1.2 / 700 / 0"
    section_h2_dashboard: "24px / 1.25 / 700 / 0"
    card_title: "18-20px / 1.3 / 700 / 0"
    body: "15-18px / 1.6 / 400 / 0"
    kpi_value: "34px / 1.0 / 700 / 0"
    button: "15px / 1.0 / 600 / 0"
    mono_label: "12px / 1.0 / 500 / 0"
radius:
  card: 14px
  pill: 999px
  bar: 4px
shadows:
  card: none
  hero_glow: "radial-gradient(circle at center, rgba(229, 9, 20, 0.15) 0%, transparent 70%)"
borders:
  card: "1px solid #2A2A2A"
  roadmap: "1px dashed #2A2A2A"
buttons:
  primary:
    background: "#E50914"
    color: "#FFFFFF"
    border: none
    shape: pill
    min_height: 44px
    weight: 600
  secondary:
    background: transparent
    color: "#FFFFFF"
    border: "1px solid #FFFFFF"
    shape: pill
    min_height: 44px
    weight: 600
  header_action:
    background: transparent
    color: "#FFFFFF"
    border: "1px solid #555555"
    shape: pill
    weight: 500
fonts_url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap"
---

# OrderWise Design System

Dark, streaming-style UI. Near-black ground, one red accent, pill buttons, rounded cards, bold sans headings. Text-first, calm, high contrast.

## 1. Principles
- One accent (red) for primary actions, the badge, the headline highlight and the main chart series only.
- Status colors (green, amber, pink-red) are separate from the accent, so "deferred" never looks like a button.
- Quiet secondary text, strong headings, generous spacing.
- No hard shadows. One soft red glow in the landing hero only.

## 2. Color tokens
| Token | Hex | Use |
|---|---|---|
| --bg | #0A0A0A | Page background |
| --s | #161616 | Cards and panels |
| --s2 | #232323 | Inset rows inside cards |
| --bd | #2A2A2A | Card borders (1px) |
| --t | #FFFFFF | Headings, primary text |
| --t2 | #A8A8A8 | Descriptions, labels |
| --ac | #E50914 | Primary buttons, badge, highlight, "On hand" bars |
| (series) | #8A8A8A | "Reserved" bars |
| --ok | #4ADE80 | Fulfilled, active |
| --wa | #F5B544 | Partial, alerts |
| --no | #FF7A7A | Deferred |
| alert-bg / border | #2B2010 / #5A4210 | Unresolved alerts card |

## 3. Typography
- Headings and body: "Helvetica Neue", Arial, sans-serif.
- Labels, tags, SKUs: IBM Plex Mono 500, 12px. Never for paragraphs.

| Element | Size | Weight |
|---|---|---|
| Landing H1 | 60px / 1.02, tracking -0.03em | 700 |
| Dashboard H1 | 34px, tracking -0.02em | 700 |
| Section H2 | 32px (landing), 24px (dashboard) | 700 |
| Card title | 18-20px | 700 |
| Body | 15-18px / 1.6, --t2 | 400 |
| KPI value | 34px | 700 |
| Button | 15px | 600 |
| Mono label | 12px | 500 |

## 4. Layout
- Container: max-width 1120px, centered, 32px side padding.
- Landing hero: 2 columns (1.1fr / 1fr), gap 56px.
- Stat strip and "How it works": 3 columns, gap 16px.
- Dashboard: KPI row 4 columns, charts 1.6fr / 1fr, modules 4 columns, gap 16px.
- Section spacing: 88px (landing), 24px (dashboard).
- Phones (max 760px): all grids collapse to one column, nav links hide, H1 drops to 38px.

## 5. Shape
- Cards: radius 14px, 1px border, no shadow.
- Buttons and badges: pill (999px), min-height 44px.
- Bars: 4px top radius. Progress bars: 6px tall, pill ends.
- Roadmap row: card with dashed border.

## 6. Components
- Primary button: --ac background, white text, 600.
- Secondary button: transparent, 1px white border, white text.
- Header buttons (Refresh, Log out): secondary with #555 border.
- Badge: --ac pill, white mono text.
- Card: --s background, --bd border, 24px padding.
- Queue row: --s2 background, order name left, mono status right, thin progress bar below in the status color.
- KPI card: small label, 34px value, mono caption. Alert variant uses amber label and alert-bg.
- Donut: ring width 12, total orders centered, legend directly below.
- Module card: "Active" mono label in --ok, title, one-line description. Upcoming modules are collapsed into one dashed "Roadmap" row.
- Footer: top border, two mono lines.

## 7. Content rules
- Sentence case headings. No all-caps.
- No invented stats. Replace placeholder chart values with real data.
- Keep copy short: one line per card description.

## 8. Accessibility
- White (#FFF) and #A8A8A8 both pass 4.5:1 on the dark surfaces.
- Status colors differ in lightness as well as hue.
- Real buttons and links, 44px touch targets, aria-label on the donut.
