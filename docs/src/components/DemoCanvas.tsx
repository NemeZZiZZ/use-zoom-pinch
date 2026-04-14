import { useRef, useState } from "react"
import { useZoomPinch, type ViewState } from "use-zoom-pinch"

const SHAPES = [
  { x: 290, y: -20, w: 160, h: 130, color: "#6366f1", label: "Drag to pan" },
  { x: 500, y: 20, w: 150, h: 120, color: "#ec4899", label: "Pinch to zoom" },
  { x: 310, y: 190, w: 170, h: 100, color: "#14b8a6", label: "Scroll to pan" },
  { x: 500, y: 160, w: 180, h: 120, color: "#8b5cf6", label: "Double-tap\nzoom" },
  { x: 340, y: 300, w: 150, h: 100, color: "#f59e0b", label: "Ctrl+Scroll\n= zoom" },
  { x: 460, y: 260, w: 160, h: 90, color: "#ef4444", label: "Inertia!" },
  { x: 340, y: 80, w: 170, h: 90, color: "#06b6d4", label: "Two-finger\nrotate" },
]

const GRID_SIZE = 50
const GRID_EXTENT = 2000

function Grid() {
  const lines = []
  for (let i = -GRID_EXTENT; i <= GRID_EXTENT; i += GRID_SIZE) {
    lines.push(
      <line
        key={`h${i}`}
        x1={-GRID_EXTENT}
        y1={i}
        x2={GRID_EXTENT}
        y2={i}
        className="demo-grid-line"
      />,
      <line
        key={`v${i}`}
        x1={i}
        y1={-GRID_EXTENT}
        x2={i}
        y2={GRID_EXTENT}
        className="demo-grid-line"
      />,
    )
  }
  lines.push(
    <line key="ax" x1={-GRID_EXTENT} y1={0} x2={GRID_EXTENT} y2={0} className="demo-grid-axis" />,
    <line key="ay" x1={0} y1={-GRID_EXTENT} x2={0} y2={GRID_EXTENT} className="demo-grid-axis" />,
  )
  return <g>{lines}</g>
}

export default function DemoCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewState, setViewState] = useState<ViewState>({ x: 0, y: 0, zoom: 1 })

  const { view, zoomIn, zoomOut, resetView, rotateBy } = useZoomPinch({
    containerRef,
    viewState,
    onViewStateChange: setViewState,
    gestures: { rotate: true },
  })

  return (
    <div className="demo-wrapper not-content">
      {/* Toolbar */}
      <div className="demo-toolbar">
        <span className="demo-toolbar-label">Live Demo</span>
        <div className="demo-btn-group">
          <button onClick={() => zoomIn(1.5, { animate: true })} className="demo-btn">
            + <span className="demo-btn-text">Zoom In</span>
          </button>
          <button onClick={() => zoomOut(1.5, { animate: true })} className="demo-btn">
            - <span className="demo-btn-text">Zoom Out</span>
          </button>
          <button onClick={() => rotateBy(-90, { animate: true })} className="demo-btn">
            ↺
          </button>
          <button onClick={() => rotateBy(90, { animate: true })} className="demo-btn">
            ↻
          </button>
          <button onClick={() => resetView({ animate: true })} className="demo-btn">
            Reset
          </button>
        </div>
        <span className="demo-info">
          {Math.round(view.zoom * 100)}% &middot; {Math.round(view.rotation ?? 0)}° &middot; (
          {view.x.toFixed(0)}, {view.y.toFixed(0)})
        </span>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="demo-canvas">
        <div
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom}) rotate(${view.rotation ?? 0}deg)`,
            transformOrigin: "0 0",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          <svg
            width={GRID_EXTENT * 2}
            height={GRID_EXTENT * 2}
            viewBox={`${-GRID_EXTENT} ${-GRID_EXTENT} ${GRID_EXTENT * 2} ${GRID_EXTENT * 2}`}
            style={{ position: "absolute", top: -GRID_EXTENT, left: -GRID_EXTENT }}
          >
            <Grid />
          </svg>

          {/* Origin marker */}
          <div
            style={{
              position: "absolute",
              left: -4,
              top: -4,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#ef4444",
              margin: 0,
            }}
          />

          {/* How to use card */}
          <div className="demo-card" style={{ left: 20, top: 30, width: 260, height: 200 }}>
            <div className="demo-card-title">How to use</div>
            <div>
              <kbd className="demo-kbd">Scroll</kbd> Pan the canvas
            </div>
            <div>
              <kbd className="demo-kbd">Ctrl</kbd>+<kbd className="demo-kbd">Scroll</kbd> Zoom
            </div>
            <div>
              <kbd className="demo-kbd">Drag</kbd> Pan the canvas
            </div>
            <div>
              <kbd className="demo-kbd">Pinch</kbd> Zoom (touch)
            </div>
            <div>
              <kbd className="demo-kbd">Double-tap</kbd> Toggle zoom
            </div>
            <div>
              <kbd className="demo-kbd">Two-finger twist</kbd> Rotate
            </div>
          </div>

          {/* Image */}
          <div
            style={{
              position: "absolute",
              left: 20,
              top: 260,
              width: 340,
              height: 220,
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
              userSelect: "none",
            }}
          >
            <img
              src="/use-zoom-pinch/landscape.svg"
              alt="Landscape"
              width={340}
              height={220}
              draggable={false}
              style={{ display: "block" }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "20px 14px 10px",
                background: "linear-gradient(transparent, rgba(0,0,0,0.5))",
                color: "#fff",
                fontFamily: "system-ui, sans-serif",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Zoom in to see the details
            </div>
          </div>

          {/* Shapes */}
          {SHAPES.map((s, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: s.x,
                top: s.y,
                width: s.w,
                height: s.h,
                background: s.color,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontFamily: "system-ui, sans-serif",
                fontWeight: 600,
                fontSize: 14,
                textAlign: "center",
                padding: 12,
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                userSelect: "none",
                whiteSpace: "pre-line",
              }}
            >
              {s.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
