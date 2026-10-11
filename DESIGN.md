---
name: "Arcade Night"
description: "Esports broadcast in dark mode. Near-black surfaces, sharp display serif paired with a square mono, knife-edge corners, a single high-voltage lime accent. Built for tournaments and launch events."
tags: [dark, gaming, event, bold, premium]
colors:
  primary:   "#eef0e6"
  secondary: "#8a8f80"
  tertiary:  "#eef0e6"
  neutral:   "#11120f"
  surface:   "#0a0b08"
typography:
  display: "Big Shoulders Display"
  body:    "JetBrains Mono"
  mono:    "JetBrains Mono"
  scale:
    hero: "5.5rem / 0.92 / 800 / -0.02em"
    h1:   "3rem / 1 / 800 / -0.015em"
    h2:   "1.875rem / 1.15 / 700 / -0.01em"
    body: "0.9375rem / 1.55 / 400 / 0"
radius:
  sm: 0px
  md: 0px
  lg: 2px
  pill: 9999px
shadows:
  card:   "rgba(238,240,230,0.06) 0 0 0 1px"
  button: none
borders:
  card:    "1px solid rgba(238,240,230,0.06)"
  divider: rgba(238,240,230,0.06)
buttons:
  primary:
    background: #c8ff3a
    color: #0a0b08
    border: none
    shape: sharp
    padding: 12px 22px
    font: 700 / 0.8125rem
  secondary:
    background: transparent
    color: #eef0e6
    border: 1px solid rgba(238,240,230,0.18)
    shape: sharp
    padding: 12px 22px
    font: 600 / 0.8125rem
  outline:
    background: transparent
    color: #c8ff3a
    border: 1px solid #c8ff3a
    shape: sharp
    padding: 12px 22px
    font: 600 / 0.8125rem
  ghost:
    background: transparent
    color: #8a8f80
    border: none
    shape: sharp
    padding: 12px 18px
    font: 600 / 0.75rem
charts:
  variant: flat
  stroke_width: 2
  fill_opacity: 0.18
  gridlines: false
  bar_gap: 4px
  highlight: single
  dot_marker: false
fonts_url: "https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap"
dependencies: ["lucide-react"]
---

# Arcade Night

## AI Build Instructions

> **Read this section before writing any code.** The rules below
> are non-negotiable. Every value used in the UI must come from this
> file's frontmatter — never substitute, approximate, or invent new
> colors, fonts, radii, or shadows. If a value is missing, ask the
> user before adding one.

### 1 · Your role

You are building UI for a project that has adopted **Arcade Night** as its
design system. Treat `DESIGN.md` as the single source of truth.
Your job is to translate the user's product requirements into
components and pages that look like they were designed by the same
person who authored this file.

### 2 · Token compliance

- Pull every color, font family, radius, shadow, and spacing value
  from the frontmatter at the top of this file.
- Use semantic roles (e.g. `primary`, `accent`, `muted`) — never
  hard-code hex values that bypass the system.
- When a token can be expressed as a CSS variable, declare it once
  in your global stylesheet and reference it everywhere downstream.
- The Google Fonts `<link>` is provided in the Typography section.
  Add it to `<head>` before any component renders.

### 3 · Component recipes

Use these recipes verbatim when building the corresponding component.

#### Buttons

Four variants are defined. Pick one — never blend variants or invent a fifth.

- **Primary** — sharp shape, bg `#c8ff3a`, text `#0a0b08`, padding `12px 22px`, weight `700`.
- **Secondary** — sharp shape, text `#eef0e6`, border `1px solid rgba(238,240,230,0.18)`, padding `12px 22px`, weight `600`.
- **Outline** — sharp shape, text `#c8ff3a`, border `1px solid #c8ff3a`, padding `12px 22px`, weight `600`.
- **Ghost** — sharp shape, text `#8a8f80`, padding `12px 18px`, weight `600`.

Reach for **primary** as the single dominant CTA per screen.
**Secondary** for the supporting action. **Outline** for tertiary
actions in toolbars. **Ghost** for inline links and table actions.

#### Cards

- Background: `#0a0b08`
- Border: `1px solid rgba(238,240,230,0.06)`
- Shadow: `rgba(238,240,230,0.06) 0 0 0 1px`
- Radius: `radius.lg` (`2px`)
- Internal padding: `20px` for compact cards, `24–28px` for content cards.

#### Tabs

Variant: `underline`. Flat row of labels. Active tab gets a 2px underline in the accent color — no fill.

#### Charts

- Bar/line variant: `flat`
- No gridlines — let the bars/lines carry the data.
- Highlight strategy: `single` — emphasize a single bar/point per chart.

#### Typography pairings

- **Display (`Big Shoulders Display`)** — h1, h2, hero headlines, brand wordmarks.
- **Body (`JetBrains Mono`)** — paragraphs, labels, button text, form inputs.
- **Mono (`JetBrains Mono`)** — code, eyebrows, metadata, numerals in tables.

### 4 · Hard constraints

Never do any of the following without explicit instruction from the user:

- Introduce a new color, font, radius, or shadow that isn't declared above.
- Mix this system with another (e.g. don't paste in Material or Bootstrap defaults).
- Use generic gradient defaults (purple→blue, peach→pink) — they break the system's voice.
- Reach for emoji icons. Use a consistent icon library and size icons in line with body type.
- Add motion that exceeds the system's restraint — keep transitions short (≤200ms) and subtle.

### 5 · Before you finish — verify

Run through this checklist for every screen you produce:

- [ ] Every color used appears in the Colors table above.
- [ ] Headlines use the display font; body copy uses the body font.
- [ ] Buttons match one of the declared variants exactly (shape, padding, weight).
- [ ] Border-radius values come from `radius.sm` / `radius.md` / `radius.lg` / `radius.pill`.
- [ ] Cards and dividers use the declared border + shadow tokens.
- [ ] No values were invented; if you needed something missing, you stopped and asked.

---

## 1. Atmosphere

Arcade Night is the broadcast aesthetic of a competitive event — late-night arenas, scoreboard overlays, the moment before a tournament starts. The page is near-black `#0a0b08` (a hair warmer than pure to feel cinematic), text is bone-white, and one electric lime `#c8ff3a` carries every primary action. There are no gradients, no glows, no rounded corners. The system is sharp by design.

The display face is a condensed industrial sans (Big Shoulders Display) at heavy weights — built for scorecards and arena banners. Body and labels run in JetBrains Mono with uppercase tracking, reinforcing the broadcast-overlay feel. Cards have no shadow; they sit on hairlines at 6% bone, and the only depth comes from the lime accent.

**Signature moves**
- Big Shoulders Display 800 at 88px hero — condensed, athletic, uncompromising
- One lime accent (`#c8ff3a`), used for primary CTA and active state — never decorated, never tinted
- Knife-edge corners (0px radius) on every surface except the small 2px lift on featured cards
- Mono body with uppercase 0.10em tracking — every label reads like a broadcast lower-third
- Cards as 1px bone-on-black hairlines, no fill, no shadow

## 2. Palette

### Core
- **Surface** `#0a0b08` — page background, near-black with a warm cast
- **Surface Lift** `#11120f` — modals, elevated cards
- **Bone** `#eef0e6` — text, headings (never pure white)
- **Bone 60** `rgba(238,240,230,0.6)` — secondary text
- **Hairline** `rgba(238,240,230,0.06)` — every divider, every card edge

### Accent
- **Volt Lime** `#c8ff3a` — primary CTA, active tab, score highlight
- **Volt Lime 12** `rgba(200,255,58,0.12)` — focus ring, hovered tab fill

### Status
- **Live Red** `#ff3b3b` — live indicator only, never as decoration

## 3. Typography

| Role | Font | Size | Weight | Leading | Tracking |
|------|------|------|--------|---------|----------|
| Hero | Big Shoulders Display | 88px | 800 | 0.92 | -0.02em |
| H1 | Big Shoulders Display | 48px | 800 | 1.0 | -0.015em |
| H2 | Big Shoulders Display | 30px | 700 | 1.15 | -0.01em |
| Body | JetBrains Mono | 15px | 400 | 1.55 | 0 |
| Label / UI | JetBrains Mono | 12px | 500 | 1.0 | 0.10em uppercase |
| Score | Big Shoulders Display | 64px | 800 | 1.0 | -0.02em tabular |

Two weights for display: 700 / 800. One weight for body: 400. Labels are always uppercase, always tracked, always mono.

## 4. Buttons

### Primary (Volt)
```css
background: #c8ff3a;
color: #0a0b08;
padding: 12px 22px;
border-radius: 0;
font-family: "JetBrains Mono";
font-weight: 700;
text-transform: uppercase;
letter-spacing: 0.10em;
```

### Secondary (Bone Outline)
- Transparent, 1px bone hairline at 18%, bone text
- Same padding, same uppercase mono treatment

### Outline (Volt)
- Transparent, 1px lime border, lime text — used only for "Watch live" / "Join queue"

## 5. Cards

- Background `#0a0b08` (or `#11120f` for elevated)
- 1px hairline at 6% bone
- NO radius (or 2px on featured)
- NO shadow, ever — the lime accent is the only emphasis allowed

## 6. Charts

Flat solid bars with a 4px gap (broadcast scoreboard rhythm). One bar in volt lime, the rest in 18% bone. No gridlines, no dots — labels are mono uppercase along the baseline. Line charts run at 2px in volt lime with an 18% fill underneath. The chart is a scorecard, not a graph.

## 7. Tabs

Underline at 2px in volt lime for the active state. Inactive tabs are mono uppercase at 60% bone. No pill tabs.

## 8. Spacing

- Base 4px
- Scale: `4, 8, 12, 16, 24, 32, 48, 64, 96`
- Section padding: 96px desktop, 48px mobile — the dark surface needs air

## 9. Do's & don'ts

✅ **Do**
- Use Big Shoulders Display only at 700/800 — anything lighter loses the broadcast weight
- Keep every label uppercase mono with 0.10em tracking
- Reserve the volt lime for one element per screen
- Use sharp 0px radius everywhere except featured cards (2px)

❌ **Don't**
- Use any radius above 2px — the system is sharp by design
- Use a second accent color — Live Red exists ONLY for live indicators
- Use shadows or glows on the lime — flat fill, always
- Use a proportional sans for body — mono carries the broadcast feel

---

## Tokens

> Generated from the same source the live preview renders from.
> Treat the values below as the contract — never substitute approximations.

### Colors

| Role      | Value |
|-----------|-------|
| primary   | `#eef0e6` |
| secondary | `#8a8f80` |
| tertiary  | `#eef0e6` |
| neutral   | `#11120f` |
| surface   | `#0a0b08` |

### Typography

- **Display:** Big Shoulders Display
- **Body:** JetBrains Mono
- **Mono:** JetBrains Mono

| Role | size / leading / weight / tracking |
|------|------------------------------------|
| Hero | 5.5rem / 0.92 / 800 / -0.02em |
| H1   | 3rem / 1 / 800 / -0.015em |
| H2   | 1.875rem / 1.15 / 700 / -0.01em |
| Body | 0.9375rem / 1.55 / 400 / 0 |

### Radius

- sm: `0px`
- md: `0px`
- lg: `2px`
- pill: `9999px`

### Shadows

- **card:** `rgba(238,240,230,0.06) 0 0 0 1px`
- **button:** `none`

### Borders

- **card:** `1px solid rgba(238,240,230,0.06)`
- **divider:** `rgba(238,240,230,0.06)`

### Buttons

Four variants, each fully tokenized. The preview renders from these exact values.

#### Primary

| Property | Value |
|----------|-------|
| shape | `sharp` |
| background | `#c8ff3a` |
| color | `#0a0b08` |
| border | `none` |
| padding | `12px 22px` |
| fontWeight | `700` |
| fontSize | `0.8125rem` |

#### Secondary

| Property | Value |
|----------|-------|
| shape | `sharp` |
| background | `transparent` |
| color | `#eef0e6` |
| border | `1px solid rgba(238,240,230,0.18)` |
| padding | `12px 22px` |
| fontWeight | `600` |
| fontSize | `0.8125rem` |

#### Outline

| Property | Value |
|----------|-------|
| shape | `sharp` |
| background | `transparent` |
| color | `#c8ff3a` |
| border | `1px solid #c8ff3a` |
| padding | `12px 22px` |
| fontWeight | `600` |
| fontSize | `0.8125rem` |

#### Ghost

| Property | Value |
|----------|-------|
| shape | `sharp` |
| background | `transparent` |
| color | `#8a8f80` |
| border | `none` |
| padding | `12px 18px` |
| fontWeight | `600` |
| fontSize | `0.75rem` |

### Charts

| Property | Value |
|----------|-------|
| variant | `flat` |
| strokeWidth | `2` |
| fillOpacity | `0.18` |
| gridlines | `false` |
| barGap | `4px` |
| highlight | `single` |
| dotMarker | `false` |

---

## Pro tokens

> Production-fidelity tokens. States, density, motion, elevation,
> content rules and a measured WCAG contract — derived from the
> resting tokens unless explicitly authored.

### States

#### Button

- **hover** — shadow: `4px 6px 0 0 #eef0e6`, transform: `translateY(-2px) rotate(-1deg)`
- **focus** — outline: `3px solid #eef0e6`, outline-offset: `3px`
- **active** — shadow: `1px 2px 0 0 #eef0e6`, transform: `translateY(1px) scale(0.96)`
- **disabled** — opacity: `0.4`
- **loading** — opacity: `0.7`
- **selected** — bg: `#eef0e6`, color: `#eef0e6`, transform: `rotate(-2deg)`

#### Input

- **hover** — border: `2px solid #eef0e6`
- **focus** — border: `2px solid #eef0e6`, shadow: `3px 3px 0 0 #eef0e6`
- **disabled** — opacity: `0.4`
- **error** — border: `2px solid #EF4444`, shadow: `3px 3px 0 0 #EF4444`

#### Card

- **hover** — shadow: `6px 8px 0 0 #eef0e6`, transform: `translateY(-4px) rotate(-1deg)`
- **selected** — border: `2px solid #eef0e6`, transform: `rotate(-1deg)`
- **dragging** — transform: `rotate(-3deg) scale(1.05)`, opacity: `0.85`

#### Tab

- **hover** — color: `#eef0e6`, transform: `translateY(-1px)`
- **focus** — outline: `3px solid #eef0e6`, outline-offset: `2px`
- **selected** — bg: `#eef0e6`, color: `#eef0e6`, transform: `rotate(-1deg)`

### Density

| Mode | padding × | row × | body | radius × | Use for |
|------|-----------|-------|------|----------|---------|
| compact | 0.72 | 0.78 | 0.8125rem | 0.85 | Information-dense — tables, IDEs, dashboards |
| comfortable | 1 | 1 | 0.9375rem | — | Default — most product UI |
| spacious | 1.35 | 1.3 | 1rem | 1.15 | Editorial — marketing, long-form, settings |

### Motion

**Signature — Bounce.** Exaggerated spring easing with a slight rotational tilt. Every interaction feels physical and playful.

```css
transition: transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1);
```

| Token | Value |
|-------|-------|
| duration.instant | `100ms` |
| duration.fast | `200ms` |
| duration.base | `320ms` |
| duration.slow | `500ms` |
| easing.standard | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| easing.decelerate | `cubic-bezier(0.0, 0, 0.2, 1)` |
| easing.accelerate | `cubic-bezier(0.4, 0, 1, 1)` |
| easing.spring | `cubic-bezier(0.5, 2, 0.4, 1)` |

### Elevation

Five-level scale, system-specific recipe.

| Level | Shadow | Recipe |
|-------|--------|--------|
| level0 | `none` | Flat — the tone separates. |
| level1 | `2px 3px 0 0 #eef0e6` | Hard offset, slight shift. |
| level2 | `4px 6px 0 0 #eef0e6` | Cards — visible offset. |
| level3 | `6px 8px 0 0 #eef0e6` | Dialog — strong offset. |
| level4 | `8px 12px 0 0 #eef0e6` | Modal — maximum offset, scrim required. |

### Content

- **measure:** `62ch` (max line length for body prose)
- **paragraph spacing:** `1.25em`
- **list indent:** `1.5em`
- **list gap:** `0.55em`
- **link:** color `#eef0e6`, underline `always`
- **blockquote:** border `3px solid #eef0e6`, padding `0.8em 1.2em`
- **code:** background `#eef0e6`, color `#eef0e6`

### Accessibility (WCAG 2.1)

**Overall:** AA

| Pair | Ratio | Required | Grade | Suggested fix |
|------|-------|----------|-------|---------------|
| Body text on surface | 17.14:1 | AA | AAA | — |
| Body text on canvas | 16.33:1 | AA | AAA | — |
| Muted text on surface | 5.94:1 | AA | AA | — |
| Accent on surface | 17.14:1 | AA-Large | AAA | — |
| Accent on canvas | 16.33:1 | AA-Large | AAA | — |
