import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://essible.pages.dev',
  build: {
    // Keep all CSS in external files so the Content-Security-Policy can stay strict.
    inlineStylesheets: 'never',
  },
  markdown: {
    // Prism marks tokens with classes; the default highlighter uses inline styles, which the CSP blocks.
    syntaxHighlight: 'prism',
  },
  devToolbar: {
    enabled: false,
  },
  vite: {
    build: {
      // Emit every asset as a file: inlined data: URLs would be blocked by the CSP (font-src 'self').
      assetsInlineLimit: 0,
      // The CSS minifier folds animation-timeline into the animation shorthand, which
      // browsers reject, so scroll-driven animations silently disappear. Keep CSS unminified.
      cssMinify: false,
    },
  },
});
