# README visual proof

README visuals show the sample product page at `/projects/tabellio/`. They are
documentation assets, not runtime dependencies: the product page remains
static-first and the live mockup remains local-only.

## Committed assets

- `public/media/portfolio-template-desktop.jpg` — desktop hero capture at a
  wide viewport.
- `public/media/portfolio-template-mobile.jpg` — mobile hero capture at a
  narrow viewport.
- `public/media/portfolio-template-scroll.gif` — lightweight, looping scroll
  through the sample page.
- `public/media/portfolio-template-scroll.mp4` — higher-quality version of the
  same scroll for previews that support video.

## Refresh the captures

1. Run `npm run dev -- --host 127.0.0.1`.
2. Open `/projects/tabellio/` in a browser after the live mockup has hydrated.
3. Capture the hero at desktop and mobile sizes. Save the browser's JPEG
   output to the two committed `.jpg` paths above.
4. Capture 120 desktop frames at `1280 × 720`, using a slow eased scroll from
   the top of the page through the final CTA. Save them as `frame-001.jpg`
   through `frame-120.jpg` in a temporary directory. Keep the viewport and
   framing fixed; do not capture the cursor.
5. Rebuild the GIF and MP4:

```sh
npm run assets:demo -- \
  --frames /tmp/PortfolioTemplateDemoFrames \
  --fps 10 \
  --output-fps 6 \
  --output public/media/portfolio-template-scroll.gif
npm run assets:demo -- \
  --frames /tmp/PortfolioTemplateDemoFrames \
  --fps 10 \
  --output-fps 10 \
  --output public/media/portfolio-template-scroll.mp4
```

The generator uses the system `ffmpeg` binary (`FFMPEG_BIN` can override its
path). The default 120 frames at 10 fps produce a 12-second demo. GIF output
defaults to a lightweight 640px, 48-color, 6 fps rendition; MP4 keeps a larger
frame and higher frame rate. Keep the animation between 10 and 20 seconds,
legible, and representative of the current sample page. Review the captures
before committing them.
