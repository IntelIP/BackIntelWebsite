# IntelIP Design Language

Version: 0.1.0  
Status: Foundation accepted; visual examples and rendered baselines pending.

## Purpose

This document defines the shared visual language for the IntelIP portfolio site and
future product-facing surfaces. It standardizes the design grammar without forcing
every product to look identical.

Product repositories remain responsible for product-specific workflows and UX. The
portfolio site is responsible for the public project index, project narratives, and
shared IntelIP presentation.

## Audience assumption

- Primary: prospective users, customers, and partners.
- Secondary: technical collaborators and evaluators.

Revisit this assumption before locking final copy, imagery, or conversion paths.

## Visual thesis

Monochrome technical editorial.

The base interface uses black, white, and gray. Product accents provide identity and
orientation without turning the portfolio into a multi-color dashboard. The visual
system should feel precise, calm, credible, and product-led.

## Principles

1. Signal over decoration. Every visual treatment must clarify product, status, or
   action.
2. Shared grammar, distinct products. Grid, type, spacing, interaction, and
   accessibility remain shared; accent, imagery, and product narrative may vary.
3. Monochrome first. Neutral surfaces carry the interface; color remains scarce and
   intentional.
4. Evidence over ornament. Prefer real product screenshots, diagrams, metrics, and
   concrete outcomes over decorative filler.
5. Progressive density. The home page stays scannable; project detail pages can carry
   deeper technical context.
6. Owned components. Use shadcn/ui as a source for primitives, then customize and
   wrap components with IntelIP tokens and product conventions.

## Color system

Values below are initial tokens, not final accessibility approval.

| Role | Light | Dark | Use |
| --- | --- | --- | --- |
| Canvas | `#FFFFFF` | `#0A0A0A` | Page background |
| Surface | `#F5F5F5` | `#151515` | Cards and grouped content |
| Raised surface | `#FFFFFF` | `#1C1C1C` | Menus, dialogs, elevated content |
| Border | `#E5E5E5` | `#292929` | Dividers and control boundaries |
| Primary text | `#171717` | `#F5F5F5` | Headings and important content |
| Muted text | `#737373` | `#A3A3A3` | Supporting copy and metadata |

### Product accents

Product accents are provisional examples. Each accent needs contrast testing in every
role before production use.

| Product | Accent | Intended roles |
| --- | --- | --- |
| N10 IP | `#2563EB` | Product marker, active link, primary CTA, focus treatment |
| Neural | `#16A34A` | Product marker, active link, primary CTA, focus treatment |

Accent rules:

- Keep roughly 90–95% of the interface neutral.
- Do not use product accents as full-page backgrounds.
- Use accents for identity, action, selection, and focus—not decoration everywhere.
- Do not use a product accent as a generic success, warning, or error color.
- Add semantic colors only when meaning requires them; validate their contrast separately.
- Use low-opacity accent surfaces only when text and focus contrast remain clear.

## Typography

Initial font direction: `Inter Variable` for sans-serif content and
`JetBrains Mono Variable` for technical metadata. Self-host fonts when implementation
begins.

### Roles

- Display: large, compact, high-confidence headlines.
- Heading: section and project titles.
- Body: readable descriptions and case-study content.
- UI: navigation, labels, buttons, and controls.
- Mono: repository names, versions, timestamps, status, and technical identifiers.

### Initial rhythm

- Display: `clamp(3rem, 8vw, 7rem)`, weight 600–700, tight line height.
- Section heading: `clamp(2rem, 4vw, 4rem)`, weight 600.
- Body: `1rem`–`1.125rem`, line height around `1.6`.
- Metadata: `0.75rem`–`0.875rem`, mono or restrained uppercase.
- Buttons: `0.875rem`–`1rem`, weight 500–600, sentence case.

Typography rules:

- Keep the same primary family across products.
- Use weight, scale, spacing, and composition for hierarchy before adding another font.
- Reserve mono for technical meaning; do not use it for all body copy.
- Avoid random serif, italic, or colored-word treatments.
- Keep reading measure comfortable, generally no wider than 65–75 characters.
- Check long product names, narrow screens, zoom, and text wrapping.

## Layout

- Use a consistent centered container and responsive grid.
- Give the hero one clear message and one primary action.
- Use project cards as evidence containers, not decorative tiles.
- Prefer strong alignment and whitespace over excessive borders or shadows.
- Keep mobile layout intentional; do not merely stack desktop sections.
- Preserve content order and action priority across breakpoints.

## Component policy

### Foundation components

Buttons, links, badges, cards, inputs, dialogs, navigation, tooltips, focus treatments,
and typography primitives may come from shadcn/ui source.

### IntelIP components

Own wrappers and patterns for:

- `ProjectCard`
- `ProjectStatus`
- `ArtifactPreview`
- `ProductAccentMarker`
- `ScreenshotFrame`
- `TechnicalMetadata`
- `ProjectHero`
- `SectionHeader`
- `DesignSpecPreview`

Pages should consume IntelIP components and tokens instead of scattering raw design
values throughout templates.

## Product themes

Each product theme may define:

- Product name and short description.
- Accent and accessible accent foreground.
- Logo or mark.
- Screenshot and media treatment.
- Optional product-specific narrative tone.

Each product theme must inherit the shared neutral foundation, typography, spacing,
interaction, and accessibility rules.

### Product proof layer

Each featured project should have one tangible visual artifact near its summary:

- A product screenshot or browser-frame image for the default state.
- A short demo video for motion, interaction, or a workflow that a still image cannot
  explain.
- A quiet fallback frame when the product is private, unfinished, or not yet ready to
  publish.

Media supports the product story; it does not become a second visual language. Keep the
frame, caption, status, duration, and action treatment shared. Use the product accent on
the frame marker, progress signal, or play affordance only. Never let an unverified
placeholder imply a shipped feature.

## Initial page recipes

### Portfolio home

Clear thesis, featured projects, project index, capability/context section, and one
primary contact or exploration action.

### Project detail

Outcome first, product accent marker, real product evidence, capabilities, current
status, links, and technical context.

### Design page

Color swatches, typography specimen, component states, neutral theme, dark theme, and
product accent examples. This page demonstrates the system; it does not replace this
document.

## Content model

Project entries should eventually use a validated content schema with at least:

`name`, `slug`, `tagline`, `status`, `visibility`, `category`, `accent`, `repo`,
`demo`, `image`, `featured`, and `updatedAt`.

Private, internal, paused, and archived work must not appear publicly by accident.

## Accessibility and validation

- Validate text, control, focus, and accent contrast in light and dark themes.
- Provide visible `:focus-visible` treatment.
- Cover default, hover, focus, disabled, loading, empty, error, and long-content states.
- Test mobile and desktop layouts with real project names and descriptions.
- Review rendered output, not source code alone.
- Establish approved screenshots and a baseline manifest before claiming visual parity.

## Reference inputs

These references inform the direction without being copied:

- [Vercel Geist color system](https://vercel.com/geist/colors)
- [Linear UI redesign](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [shadcn/ui Typeset](https://ui.shadcn.com/docs/typeset)

Refero research is pending subscription access. Future visual exploration should compare
multiple references, select one dominant direction, and record a reference lock before
implementation.

## Explicit rejects

- Rainbow project grids.
- Gradient-heavy backgrounds.
- Accent color applied to every heading, border, and icon.
- Generic hero → features grid → pricing → FAQ structure without product justification.
- Decorative font mixing.
- Unvalidated color values or screenshots treated as final baselines.

## Open decisions

1. Confirm primary audience and conversion action.
2. Select final sans and mono families after specimen review.
3. Validate exact product accent values and foreground pairs.
4. Define final container widths, breakpoints, and spacing scale.
5. Create three monochrome visual directions and approve one reference lock.
