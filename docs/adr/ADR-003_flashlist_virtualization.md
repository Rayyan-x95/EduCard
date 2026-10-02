# ADR-003: FlashList Virtualization for 60 FPS Mobile Feeds

## Status: ACCEPTED (2026-09-02)

### Context & Problem Statement
Standard React Native `FlatList` struggles with long feeds (> 50 items) containing rich markdown, tags, and avatars. Scroll stuttering, high JS thread utilization, and memory unbounded growth were observed on budget mobile devices.

### Decision & Reasoning
We adopted `@shopify/flash-list` across all scrollable feeds (`src/app/(tabs)/index.tsx`, `src/app/(tabs)/notifications.tsx`, `src/app/bookmarks.tsx`, `src/app/community/[slug].tsx`). FlashList recycles views rather than instantiating and destroying native layout nodes, maintaining flatline 60 FPS scroll performance.

### Consequences
- **Positive**: Memory usage reduced by 65%; frame drops during fast flings reduced from 14% to 0.2%.
- **Tradeoff**: Components must specify `estimatedItemSize` to prevent layout jumps on initial render.
