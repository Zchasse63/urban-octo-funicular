# Audiogram Generation

## Overview

Audiograms are short video clips (15-60 seconds) that combine podcast audio with
a visual waveform, background image, and optional text overlay. They are used for
social media promotion on platforms like Instagram, TikTok, Twitter, and YouTube.

## Architecture

### Rendering Pipeline

1. **Clip Selection** — User selects a time range from the episode
2. **Audio Extraction** — Extract audio segment from the source file via FFmpeg
3. **Waveform Generation** — Compute audio waveform data for visualization
4. **Composition** — Render a Remotion composition combining:
   - Background image (show artwork or custom)
   - Waveform animation synchronized to audio
   - Optional text overlay (quote or captions)
   - Branding elements
5. **Export** — Render to MP4 or WebM via Remotion's renderer

### Required Dependencies

```bash
npm install @remotion/renderer @remotion/cli @remotion/media-utils remotion
```

These are heavy dependencies (~200MB+). They should only be installed when
audiogram generation is actively needed. Consider adding them as optional
peer dependencies.

### Remotion Composition Structure

```
src/lib/audiogram/
  types.ts              — Configuration and result type definitions
  README.md             — This file
  # TODO: Implement the following
  composition.tsx       — Main Remotion composition component
  waveform.tsx          — Waveform visualization React component
  text-overlay.tsx      — Text overlay React component
  render.ts             — Server-side rendering using @remotion/renderer
  presets.ts            — Style presets (minimal, waveform, captions)
```

### Server-Side Rendering

Remotion supports server-side rendering via `@remotion/renderer`. The render
process:

1. Prepare a Remotion bundle (can be pre-built at deploy time)
2. Call `renderMedia()` with the composition, audio URL, and config
3. Output is written to a temp file, then uploaded to Supabase Storage
4. Return the public URL to the client

### Integration with Trigger.dev

Since rendering is CPU-intensive (30-120 seconds), it should run as a
background job via Trigger.dev:

```typescript
// trigger/audiogram-render.ts
export const audiogramRenderJob = task({
  id: 'audiogram-render',
  run: async (payload: AudiogramConfig) => {
    // 1. Download audio segment
    // 2. Generate waveform data
    // 3. Render via Remotion
    // 4. Upload to storage
    // 5. Return result
  }
});
```

### Output Formats

| Format | Use Case            | Quality | File Size |
|--------|---------------------|---------|-----------|
| MP4    | Universal playback  | High    | Medium    |
| WebM   | Web-optimized       | High    | Small     |

### Dimension Presets

| Preset    | Dimensions  | Aspect Ratio | Platform               |
|-----------|-------------|--------------|------------------------|
| Square    | 1080x1080   | 1:1          | Instagram Feed, FB     |
| Portrait  | 1080x1920   | 9:16         | Stories, Reels, TikTok |
| Landscape | 1920x1080   | 16:9         | YouTube, Twitter       |

## Estimated Implementation Time

- Remotion composition and styles: **3-5 days**
- Server-side rendering pipeline: **2-3 days**
- Trigger.dev job integration: **1-2 days**
- Storage and URL management: **1 day**
- UI for clip selection and preview: **2-3 days**
- Testing and optimization: **2-3 days**

**Total: ~12-17 engineering days**

## Cost Considerations

- Remotion rendering is CPU-bound; a 30-second clip takes ~30-60s to render
- Cloud rendering may incur compute costs (consider Remotion Lambda for AWS)
- Storage costs for generated videos (~5-20MB per audiogram)
- Consider caching rendered audiograms to avoid re-rendering
