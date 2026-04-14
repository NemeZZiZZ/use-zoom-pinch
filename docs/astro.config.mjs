// @ts-check
import { defineConfig } from "astro/config"
import starlight from "@astrojs/starlight"
import react from "@astrojs/react"

// https://astro.build/config
export default defineConfig({
  site: "https://nemezzizz.github.io",
  base: "/use-zoom-pinch",
  integrations: [
    react(),
    starlight({
      title: "useZoomPinch",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/NemeZZiZZ/use-zoom-pinch",
        },
      ],
      customCss: ["./src/styles/custom.css"],
      sidebar: [
        { label: "Getting Started", slug: "getting-started" },
        {
          label: "Guides",
          items: [
            { label: "Controlled Mode", slug: "guides/controlled-mode" },
            { label: "Animated Transitions", slug: "guides/animated-transitions" },
            { label: "Double-Tap Zoom", slug: "guides/double-tap" },
            { label: "Inertia", slug: "guides/inertia" },
            { label: "Event Filtering", slug: "guides/event-filtering" },
            { label: "Granular Events", slug: "guides/granular-events" },
            { label: "Zoom to Element", slug: "guides/zoom-to-element" },
            { label: "Rotation", slug: "guides/rotation" },
            { label: "Gesture Toggles", slug: "guides/gesture-toggles" },
          ],
        },
        {
          label: "Examples",
          items: [
            { label: "Infinite Canvas", slug: "examples/infinite-canvas" },
            { label: "Image Viewer", slug: "examples/image-viewer" },
            { label: "Minimap Pattern", slug: "examples/minimap" },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "API Reference", slug: "reference/api" },
            { label: "Types", slug: "reference/types" },
          ],
        },
      ],
    }),
  ],
})
