# {PROJECT_NAME} — Design System

## Visual Theme & Atmosphere
- **Mood**: Clean, professional, developer-focused
- **Density**: Comfortable with clear information hierarchy
- **Philosophy**: Function over decoration, accessibility first

## Color Palette & Roles
| Token | Hex | Role |
|-------|-----|------|
| `--color-primary` | `#2563EB` | Primary actions, links, active states |
| `--color-primary-hover` | `#1D4ED8` | Hover state for primary |
| `--color-secondary` | `#059669` | Success states, confirmations |
| `--color-warning` | `#D97706` | Warnings, attention-needed |
| `--color-error` | `#DC2626` | Errors, destructive actions |
| `--color-surface` | `#FFFFFF` | Card and surface backgrounds |
| `--color-surface-secondary` | `#F9FAFB` | Secondary surfaces |
| `--color-border` | `#E5E7EB` | Borders and dividers |
| `--color-text` | `#111827` | Primary text |
| `--color-text-secondary` | `#6B7280` | Secondary/muted text |

## Typography
| Element | Font | Weight | Size |
|---------|------|--------|------|
| Display | Inter / SF Pro | 700 | 2.25rem |
| Heading 1 | Inter / SF Pro | 600 | 1.5rem |
| Heading 2 | Inter / SF Pro | 600 | 1.25rem |
| Body | Inter / SF Pro | 400 | 0.938rem |
| Code | JetBrains Mono / Fira Code | 400 | 0.875rem |
| Small | Inter / SF Pro | 400 | 0.813rem |

## Component Stylings
- **Buttons**: Rounded (8px), padding 0.5rem 1rem, transition 150ms
- **Cards**: White surface, 1px border, 8px radius, 4px shadow on hover
- **Inputs**: 1px border, 8px radius, 12px padding, focus ring 2px primary
- **Navigation**: Text links with underline on hover, active state with primary color
- **Code blocks**: Monospace, secondary surface background, 14px, 16px padding

## Layout Principles
- **Spacing scale**: 4/8/12/16/24/32/48/64px
- **Max content width**: 1200px
- **Grid**: 12-column flexible grid, 16px gap
- **Whitespace**: Generous padding around content sections

## Depth & Elevation
| Level | Shadow |
|-------|--------|
| Surface | `none` |
| Raised | `0 1px 3px rgba(0,0,0,0.1)` |
| Elevated | `0 4px 6px rgba(0,0,0,0.1)` |
| Overlay | `0 10px 15px rgba(0,0,0,0.15)` |

## Do's and Don'ts
- DO use semantic HTML and ARIA labels
- DO ensure minimum 4.5:1 text contrast
- DO NOT use emojis as icons — use SVG icons (Lucide, Heroicons)
- DO NOT remove focus outlines — ensure keyboard navigability
- DO NOT use bright neon colors for backgrounds
- DO use `cursor: pointer` on all clickable elements
- DO respect `prefers-reduced-motion`

## Responsive Behavior
| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | < 640px | Single column, stacked nav |
| Tablet | 640-1024px | 2-column grid, collapsed sidebar |
| Desktop | > 1024px | Full layout, multi-column |

## Agent Prompt Guide
When generating UI, always reference this DESIGN.md for colors, spacing, typography, and component styles. Generate semantic HTML with Tailwind CSS classes. Use Lucide icons. Ensure responsive breakpoints. Include hover, focus, and active states.
