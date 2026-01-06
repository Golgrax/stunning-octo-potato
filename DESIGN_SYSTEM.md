# Lumina Café Design System

## Philosophy
Elegant minimalism through monochromatic refinement. Every element serves a purpose, nothing more.

## Color Palette

### Neutrals (Primary)
- **neutral-50**: `#fafafa` - Background
- **neutral-100**: `#f5f5f5` - Subtle backgrounds
- **neutral-200**: `#e5e5e5` - Borders, dividers
- **neutral-300**: `#d4d4d4` - Inactive states
- **neutral-400**: `#a3a3a3` - Placeholder text
- **neutral-500**: `#737373` - Secondary text
- **neutral-600**: `#525252` - Body text
- **neutral-700**: `#404040` - Emphasis
- **neutral-800**: `#262626` - Strong emphasis
- **neutral-900**: `#171717` - Headings, primary text
- **neutral-950**: `#0a0a0a` - Maximum contrast

### Usage
- No colors except neutrals
- Differentiation through weight, opacity, and spacing
- Shadows: `rgba(0,0,0,0.04)` to `rgba(0,0,0,0.12)`

## Typography

### Font Family
- **Primary**: Inter (300, 400, 500, 600)
- **Display**: Inter (200, 300 for large headings)

### Scale
- **Display**: 72px-96px, font-weight 200, tracking 0.2em
- **H1**: 48px-64px, font-weight 300, tracking 0.1em
- **H2**: 32px-40px, font-weight 300
- **H3**: 24px-28px, font-weight 400
- **Body**: 14px-16px, font-weight 300
- **Small**: 12px-13px, font-weight 400

### Letter Spacing
- Display: 0.2em
- Headings: 0.05em-0.1em
- Body: 0.01em
- Uppercase labels: 0.1em-0.15em

## Spacing

### Scale (Tailwind)
- 0.5 (2px), 1 (4px), 2 (8px), 3 (12px), 4 (16px)
- 6 (24px), 8 (32px), 10 (40px), 12 (48px), 16 (64px)

### Padding
- Cards: 24px-32px
- Buttons: 12px-20px horizontal, 10px-12px vertical
- Inputs: 16px horizontal, 12px vertical

## Components

### Cards
- Background: `white/80` with `backdrop-blur-md`
- Border: `neutral-200/60`
- Border radius: 12px (rounded-xl)
- Shadow: `0 2px 8px rgba(0,0,0,0.04)`
- Hover: `0 8px 30px rgba(0,0,0,0.04)` + translate-y-0.5

### Buttons
- **Primary**: bg-neutral-900, text-white
- **Secondary**: bg-white, border-neutral-300
- **Ghost**: transparent, hover bg-neutral-100
- Border radius: 8px (rounded-lg)
- Padding: 12px 20px
- Font weight: 500
- Tracking: 0.05em
- Active state: scale-[0.98]

### Inputs
- Background: white
- Border: neutral-200
- Focus: border-neutral-400, ring-2 ring-neutral-200/50
- Border radius: 8px
- Padding: 12px 16px

### Badges
- Border radius: 9999px (rounded-full)
- Padding: 4px 12px
- Font size: 10px
- Tracking: 0.1em
- Uppercase
- Monochromatic differentiation via opacity

## Interactions

### Transitions
- Duration: 200ms-300ms
- Easing: cubic-bezier(0.4, 0, 0.2, 1)

### Hover States
- Buttons: Slight darkening + shadow increase
- Cards: Border color shift + subtle lift
- Links: Color shift to neutral-900

### Active States
- Scale: 0.98
- Opacity: 0.9

## Layout

### Max Width
- Content: 1280px (max-w-7xl)
- Forms: 640px (max-w-2xl)
- Text: 768px (max-w-3xl)

### Grid
- Product grid: 3 columns on desktop, 2 on tablet, 1 on mobile
- Gap: 24px (gap-6)

## Imagery
- Grayscale filter: Optional for extreme minimalism
- Border radius: 12px
- Aspect ratio: 4:3 for products
- Object fit: cover

## Admin Dashboard

### Sidebar
- Width: 256px (w-64)
- Background: white
- Border: neutral-200

### Charts
- Bars: neutral-300 to neutral-700 gradient
- Grid lines: neutral-200
- Text: neutral-500

### Tables
- Header: bg-neutral-50
- Rows: hover bg-neutral-50
- Borders: neutral-100 dividers

## Accessibility

- Contrast ratio: Minimum 4.5:1 for text
- Focus indicators: 2px ring, neutral-400
- Touch targets: Minimum 44px
