import { useRef, useState } from "react"
import { useZoomPinch, type ViewState } from "use-zoom-pinch"

const CANVAS_SIZE = 1000
const MINIMAP_SIZE = 120

const SHAPES = [
  { x: 50, y: 50, w: 180, h: 120, color: "#6366f1" },
  { x: 300, y: 200, w: 150, h: 150, color: "#ec4899" },
  { x: 550, y: 80, w: 200, h: 100, color: "#14b8a6" },
  { x: 150, y: 400, w: 250, h: 80, color: "#f59e0b" },
  { x: 500, y: 350, w: 160, h: 130, color: "#8b5cf6" },
]

function Shapes({ scale = 1 }: { scale?: number }) {
  return (
    <>
      {SHAPES.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: s.x * scale,
            top: s.y * scale,
            width: s.w * scale,
            height: s.h * scale,
            background: s.color,
            borderRadius: 4 * scale,
          }}
        />
      ))}
    </>
  )
}

export default function MinimapDemo() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewState, setViewState] = useState<ViewState>({ x: 0, y: 0, zoom: 1 })

  const { view, panTo } = useZoomPinch({
    containerRef,
    viewState,
    onViewStateChange: setViewState,
    minScale: 0.3,
    maxScale: 5,
  })

  const minimapScale = MINIMAP_SIZE / CANVAS_SIZE
  const container = containerRef.current
  const cw = container?.offsetWidth ?? 600
  const ch = container?.offsetHeight ?? 360

  const vpLeft = (-view.x / view.zoom) * minimapScale
  const vpTop = (-view.y / view.zoom) * minimapScale
  const vpWidth = (cw / view.zoom) * minimapScale
  const vpHeight = (ch / view.zoom) * minimapScale

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = (e.clientX - rect.left) / minimapScale
    const clickY = (e.clientY - rect.top) / minimapScale
    panTo(clickX, clickY, { animate: true })
  }

  return (
    <div style={{ position: "relative" }}>
      <div ref={containerRef} className="demo-canvas" style={{ height: 360 }}>
        <div
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
            transformOrigin: "0 0",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          <Shapes />
        </div>
      </div>

      {/* Minimap */}
      <div
        onClick={handleMinimapClick}
        style={{
          position: "absolute",
          bottom: 12,
          right: 12,
          width: MINIMAP_SIZE,
          height: MINIMAP_SIZE,
          background: "rgba(0,0,0,0.75)",
          borderRadius: 8,
          overflow: "hidden",
          cursor: "pointer",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        {/* Mini shapes */}
        <div style={{ position: "relative", width: MINIMAP_SIZE, height: MINIMAP_SIZE }}>
          <Shapes scale={minimapScale} />
        </div>

        {/* Viewport indicator */}
        <div
          style={{
            position: "absolute",
            left: vpLeft,
            top: vpTop,
            width: vpWidth,
            height: vpHeight,
            border: "2px solid #6366f1",
            borderRadius: 2,
            background: "rgba(99,102,241,0.15)",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  )
}
