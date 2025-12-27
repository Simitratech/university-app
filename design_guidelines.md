# University App Design Guidelines

## Design Approach
**Reference-Based:** iOS 26 + Apple HIG with glassmorphism aesthetic
**Justification:** App-like PWA requiring familiar iOS patterns with modern translucent UI treatment

## Core Visual Identity

### Glassmorphism Implementation
- Translucent card backgrounds with `backdrop-blur-xl` throughout
- Background opacity: 70-85% for cards, 60% for overlays
- Border treatment: 1px white/black borders at 10-20% opacity
- Layered depth: Multiple blur levels for hierarchy (blur-sm, blur-md, blur-xl)
- Frosted glass effect on all major containers, modals, and navigation

### Typography
**Fonts:** System stack via Tailwind: `font-sans` (matches Apple devices)
**Hierarchy:**
- Headers: `text-3xl` to `text-5xl`, `font-bold`, tight tracking
- Body: `text-base`, `font-normal`, relaxed line-height
- Labels: `text-sm`, `font-medium`, uppercase for category tags
- Data/Stats: `text-2xl` to `text-4xl`, `font-semibold`, tabular numbers

### Spacing System
**Tailwind units:** Consistently use 4, 6, 8, 12, 16, 24 for rhythm
- Card padding: `p-6` to `p-8`
- Section spacing: `space-y-6` or `gap-6`
- Component margins: `mb-4`, `mt-6`, `mx-4`
- Touch targets: Minimum `h-12` for all interactive elements

### Layout Structure

**Mobile-First Grid:**
- Home dashboard: Single column card stack with `space-y-4`
- Stats/metrics: 2-column grid (`grid-cols-2 gap-4`) for data pairs
- Lists: Full-width cards with internal flex layouts
- Forms: Full-width inputs with generous `py-3 px-4`

**Navigation:**
- Bottom tab bar (iOS-style): 5 icons max, fixed bottom, blur background
- Top header: Minimal, shows page title + action button, sticky with blur
- Safe area padding: `pb-20` for bottom tab clearance, `pt-safe` for notch

## Component Library

### Cards (Primary Container)
- Rounded: `rounded-2xl` or `rounded-3xl`
- Background: `bg-white/80 dark:bg-gray-900/80`
- Backdrop: `backdrop-blur-xl`
- Border: `border border-white/20 dark:border-white/10`
- Shadow: `shadow-lg` for elevation
- Padding: `p-6` standard

### Progress Indicators
- **Pie Charts:** Segment colors: Green (completed), Yellow (in-progress), Red (remaining)
- **Progress Bars:** Rounded ends `rounded-full`, height `h-3`, animated fills
- **Percentage Badges:** Circular, large typography, colored backgrounds

### Buttons
- Primary: Solid colored, `rounded-full`, `px-8 py-3`, `font-semibold`
- On-image buttons: `backdrop-blur-md bg-white/20` with white text, no hover effects
- Icon buttons: Circular `w-12 h-12`, centered icon
- All buttons: Minimum tap target 44px

### Data Display
- **Stats Cards:** Large number on top, label below, icon accent
- **List Items:** Swipeable on mobile, status indicators (colored dots)
- **Tables:** Minimal borders, alternating row backgrounds at 5% opacity
- **Badges:** Pill-shaped `rounded-full px-3 py-1`, colored by status

### Forms & Inputs
- Input fields: `rounded-xl`, `bg-white/60 dark:bg-gray-800/60`, `backdrop-blur-md`
- Focus states: Colored ring `ring-2 ring-blue-500`
- Labels: Floating or above, `text-sm font-medium`
- Validation: Inline error text in red, success in green

### Modals & Overlays
- Full-screen or bottom sheet on mobile
- Background: `backdrop-blur-lg bg-black/40`
- Content card: Centered, glassmorphic treatment
- Dismiss: Swipe down or X button

## Color Strategy (Theme-Aware)

**Status Colors:**
- Success/A Grade: `bg-green-500`, `text-green-600`
- Warning/B Grade: `bg-yellow-500`, `text-yellow-600`
- Attention/C Grade: `bg-orange-500`, `text-orange-600`
- Critical/D-F: `bg-red-500`, `text-red-600`
- Info: `bg-blue-500`, `text-blue-600`

**Dark Mode (Default):**
- Background: Deep gradient `bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900`
- Cards: `bg-gray-900/80` with white borders at 10% opacity
- Text: `text-white` primary, `text-gray-300` secondary

**Light Mode:**
- Background: Soft gradient `bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50`
- Cards: `bg-white/80` with gray borders
- Text: `text-gray-900` primary, `text-gray-600` secondary

## Animations
- **Micro-interactions only:** Smooth transitions `transition-all duration-300`
- Card taps: Subtle scale `active:scale-98`
- Page transitions: Slide animations (iOS-style)
- Loading states: Skeleton screens with shimmer effect
- Pull-to-refresh: Native iOS bounce behavior

## Page-Specific Layouts

**Home Dashboard:** Vertical scroll, greeting header, pie chart hero card (large, centered), 2x2 stats grid, upcoming items list, daily checkmarks row

**Degree Progress:** Full-width progress header, filterable class list, completion timeline, add/import buttons floating

**Study Timer:** Full-screen Pomodoro UI, large countdown, start/pause centered, session history cards below

**Money Module:** Summary card (income/expenses/emergency %), breakdown lists, credit card carousel (horizontal scroll)

**Happiness Journal:** Daily entry card at top, scrollable history of past entries with dates

## Images
**No hero images required** - This is a data-driven app, not marketing. Use:
- Iconography: SF Symbols style for categories (study, money, gym, happiness)
- Illustrations: Subtle 3D renders for empty states only
- Charts: Generated SVG visualizations for all data displays