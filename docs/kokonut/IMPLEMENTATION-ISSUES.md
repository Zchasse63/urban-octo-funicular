# Kokonut UI Implementation Issues Tracker

This document tracks issues discovered during the UI migration that need review after all phases are complete.

## Known Component Limitations

### 1. HoldButton (kokonutui/hold-button.tsx)
**Status:** RESOLVED
**Issue:** Demo component with hardcoded behavior
- Hardcoded text: "Hold me" / "Release" (line 130)
- No `onComplete` or `onConfirm` callback prop
- No `children` prop for custom button text
- Icons are hardcoded based on variant (Trash2Icon for red, etc.)

**Resolution:** Modified HoldButton to add:
- `children` prop for custom button text
- `onConfirm` callback that fires when hold animation completes
- `holdingText` prop for custom "releasing" text (default: "Release")
- `icon` prop to override default icons (pass `null` for no icon)

---

### 2. SmoothDrawer (kokonutui/smooth-drawer.tsx)
**Status:** Modified for PodBrain
**Issue:** Original was a demo widget with hardcoded pricing content
- Modified to accept `children` prop
- Modified to accept `side` prop (left/right/bottom)
- Works correctly now for mobile navigation

**Resolution:** Complete - component was adapted during Phase 2

---

### 3. layoutId Collisions (Phase 2)
**Status:** Resolved
**Issue:** Mobile and desktop sidebars both used `layoutId="activeNav"`
- Caused animation conflicts at 768px breakpoint
- Motion couldn't determine ownership during viewport resize

**Resolution:** Split into `activeNav-mobile` and `activeNav-desktop` layoutIds

---

### 4. ActionSearchBar (kokonutui/action-search-bar.tsx)
**Status:** RESOLVED
**Issue:** Demo component with hardcoded behavior
- No `value`, `onChange`, `onSearch` props for controlled input
- No `placeholder` prop customization
- No `onActionSelect` callback for action selection
- Hardcoded label "Search Commands"

**Resolution:** Modified ActionSearchBar to add:
- `value` prop for controlled input
- `onChange` callback when input changes
- `onSearch` callback when search is submitted
- `onActionSelect` callback when an action is clicked
- `placeholder` prop for custom placeholder text
- `label` prop for custom label (optional, can be undefined to hide)
- `className` prop for styling
- Exported `Action` interface for type reuse

---

## Components to Verify Post-Implementation

After all 10 phases complete, manually verify:

1. [ ] **DangerButton** - Does hold-to-confirm work correctly?
2. [ ] **Mobile drawer** - Smooth slide animation, no stuttering
3. [ ] **Nav morphing** - Active indicator morphs between items
4. [ ] **Page transitions** - Entrance animation on route change
5. [ ] **HealthGauge** - Ring animation and number counting
6. [ ] **AlertCard** - Enter/exit animations with AnimatePresence
7. [ ] **InteractiveCard** - Cursor-aware dot pattern effect
8. [x] **Reduced Motion** - Enable OS reduced motion preference and verify all animations respect it (useReducedMotion added to 11 components)
9. [x] **Focus Indicators** - Tab through all interactive elements, verify visible focus rings (focus-visible styles added to sidebar, app-shell, buttons)
10. [x] **Screen Reader** - Test with VoiceOver/NVDA, verify aria-labels and live regions (aria-live, aria-label, aria-expanded, aria-controls, role attributes added)
11. [x] **Keyboard Navigation** - Verify all interactive elements accessible via keyboard (tabindex preserved, focus indicators visible)

---

## Phases Completed

- [x] Phase 1: Foundation (CSS tokens, motion.ts)
- [x] Phase 2: Layout & Navigation
- [x] Phase 3: Cards & Surfaces
- [x] Phase 4: Buttons & Interactions
- [x] Phase 5: Forms & Search
- [x] Phase 6: Loading & AI States
- [x] Phase 7: Backgrounds & Atmosphere
- [x] Phase 8: Lists & Collections
- [x] Phase 9: Page-Specific Updates
- [x] Phase 10: Polish & Accessibility

---

## Notes

- Kokonut UI components are MIT licensed and can be modified
- Pro components (card-02, modal-01) may have different licensing
- Always check component API before wrapping - some are demos, not production-ready
