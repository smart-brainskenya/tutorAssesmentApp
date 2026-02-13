# SBK Brand Color Quick Reference

## Brand Colors in Tailwind

### Primary Colors
```css
/* Main Brand Blue */
bg-sbk-blue         /* #3B9DD9 - Primary actions, focus */
text-sbk-blue       /* #3B9DD9 - Primary text, links */
border-sbk-blue     /* #3B9DD9 - Primary borders */

/* Secondary Teal */
bg-sbk-teal         /* #2C7A9E - Hover states, secondary */
text-sbk-teal       /* #2C7A9E - Hover text */
border-sbk-teal     /* #2C7A9E - Secondary borders */

/* Accent Orange */
bg-sbk-orange       /* #F5A623 - Achievements, alerts */
text-sbk-orange     /* #F5A623 - Orange text */
border-sbk-orange   /* #F5A623 - Orange borders */

/* Premium Gold */
bg-sbk-gold         /* #FFC107 - Top achievements */
text-sbk-gold       /* #FFC107 - Gold text */
border-sbk-gold     /* #FFC107 - Gold borders */
```

### Neutral Slate
```css
bg-sbk-slate-50     /* #F8FAFC - Lightest background */
bg-sbk-slate-100    /* #F1F5F9 - Light background */
text-sbk-slate-700  /* #334155 - Strong text */
text-sbk-slate-900  /* #0F172A - Darkest text */
```

## Common Patterns

### Primary Button
```jsx
<Button className="bg-sbk-blue hover:bg-sbk-teal text-white">
  Action
</Button>
```

### Active Navigation Link
```jsx
<a className="text-sbk-blue font-semibold">Active Page</a>
```

### Progress Bar
```jsx
<div className="bg-gradient-to-r from-sbk-blue to-sbk-teal h-1" />
```

### Selected Option
```jsx
<div className={`
  border-2 transition-all
  ${selected 
    ? 'border-sbk-blue bg-blue-50' 
    : 'border-slate-200 hover:border-sbk-blue/30'
  }
`} />
```

### Focus Ring
```jsx
className="focus:ring-4 focus:ring-sbk-blue/10 focus:border-sbk-blue"
```

### Achievement Badge
```jsx
<span className="bg-sbk-gold/20 text-sbk-orange font-bold">🏆 1st Place</span>
```

## Opacity Variants

```css
/* Subtle Tints */
bg-sbk-blue/10      /* 10% opacity - subtle backgrounds */
bg-sbk-blue/20      /* 20% opacity - light backgrounds */
bg-sbk-orange/20    /* 20% opacity - subtle orange */

/* Borders */
border-sbk-blue/30  /* 30% opacity - soft borders */
border-sbk-blue/40  /* 40% opacity - medium borders */

/* Focus Rings */
focus:ring-sbk-blue/10  /* 10% opacity - subtle focus */
```

## Color Palette

| Use | Color | Hex | CSS Class |
|-----|-------|-----|-----------|
| Primary CTA | Blue | #3B9DD9 | `sbk-blue` |
| Hover State | Teal | #2C7A9E | `sbk-teal` |
| Achievements | Orange | #F5A623 | `sbk-orange` |
| Premium | Gold | #FFC107 | `sbk-gold` |
| Light BG | Slate | #F8FAFC | `sbk-slate-50` |
| Dark Text | Slate | #0F172A | `sbk-slate-900` |

## Logo Reference

**Path**: `/assets/logo.png`
**Size**: 2160×2160px (high DPI)
**Format**: PNG with transparency
**Display**: 32-40px height

### Navbar Usage
```jsx
<img 
  src="/assets/logo.png" 
  alt="Smart Brains Kenya Logo"
  className="h-10 w-auto"
/>
```

### Favicon
Automatically served from `index.html`:
```html
<link rel="icon" type="image/png" href="/assets/logo.png" />
```

## Design Guidelines

### DO ✅
- Use brand blue for primary actions
- Apply teal for hover/secondary states
- Use orange for achievements and milestones
- Keep backgrounds neutral (white/slate)
- Add smooth transitions (duration-200)

### DON'T ❌
- Overuse brand colors on backgrounds
- Mix too many brand colors in one section
- Skip transitions for color changes
- Use brand colors for error/warning states
- Break semantic color usage (red for danger)

## Tailwind Config Location

File: `tailwind.config.js`

```javascript
extend: {
  colors: {
    sbk: {
      blue: '#3B9DD9',
      orange: '#F5A623',
      teal: '#2C7A9E',
      gold: '#FFC107',
      slate: { /* ... */ }
    }
  }
}
```

## Examples by Feature

### Assessment Progress
```jsx
<div className="h-1 bg-gradient-to-r from-sbk-blue to-sbk-teal" />
```

### Leaderboard Rank Badge
```jsx
rank === 1 
  ? 'bg-sbk-gold/20 text-sbk-orange'  // 1st
  : rank === 2 
  ? 'bg-slate-300 text-slate-700'     // 2nd
  : 'bg-sbk-orange/20 text-sbk-orange' // 3rd
```

### Results Score Color
```jsx
{percentage >= 60 
  ? 'text-sbk-blue'      // Success
  : 'text-sbk-orange'    // Needs improvement
}
```

### Navigation Hover
```jsx
className="text-slate-600 hover:text-sbk-blue transition-colors"
```

---

**Brand Colors Last Updated**: February 13, 2026
**Version**: 1.0
**Status**: Active and In Use
