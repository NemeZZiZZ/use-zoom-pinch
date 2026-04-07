import { useRef, useState } from "react"
import { useZoomPinch, type ViewState } from "use-zoom-pinch"

const SHAPES = [
  { x: 400, y: 100, w: 200, h: 150, color: "#6366f1", label: "Drag to pan" },
  { x: 400, y: 300, w: 180, h: 180, color: "#ec4899", label: "Pinch to zoom" },
  { x: 250, y: 550, w: 250, h: 120, color: "#14b8a6", label: "Scroll to pan" },
  { x: 700, y: 100, w: 160, h: 200, color: "#f59e0b", label: "Ctrl+Scroll = zoom" },
  { x: 650, y: 350, w: 220, h: 140, color: "#8b5cf6", label: "Works on mobile!" },
  { x: 50, y: 350, w: 300, h: 100, color: "#ef4444", label: "Try touch gestures" },
  { x: 50, y: 500, w: 150, h: 100, color: "#06b6d4", label: "~2 KB gzipped" },
]

const GRID_SIZE = 50
const GRID_EXTENT = 2000

const CODE_EXAMPLE = `import { useRef } from "react"
import { useZoomPinch } from "use-zoom-pinch"

function Canvas() {
  const ref = useRef<HTMLDivElement>(null)
  const { view } = useZoomPinch({ containerRef: ref })

  return (
    <div ref={ref} style={{ overflow: "hidden", touchAction: "none" }}>
      <div style={{
        transform: \`translate(\${view.x}px, \${view.y}px) scale(\${view.zoom})\`,
        transformOrigin: "0 0",
      }}>
        {/* Your content */}
      </div>
    </div>
  )
}`

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
        stroke="#e2e8f0"
        strokeWidth={1}
      />,
      <line
        key={`v${i}`}
        x1={i}
        y1={-GRID_EXTENT}
        x2={i}
        y2={GRID_EXTENT}
        stroke="#e2e8f0"
        strokeWidth={1}
      />,
    )
  }
  lines.push(
    <line
      key="ax"
      x1={-GRID_EXTENT}
      y1={0}
      x2={GRID_EXTENT}
      y2={0}
      stroke="#cbd5e1"
      strokeWidth={2}
    />,
    <line
      key="ay"
      x1={0}
      y1={-GRID_EXTENT}
      x2={0}
      y2={GRID_EXTENT}
      stroke="#cbd5e1"
      strokeWidth={2}
    />,
  )
  return <g>{lines}</g>
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewState, setViewState] = useState<ViewState>({ x: 0, y: 0, zoom: 1 })
  const [enabled, setEnabled] = useState(true)
  const [showCode, setShowCode] = useState(false)

  const { view, centerZoom, resetView } = useZoomPinch({
    containerRef,
    viewState,
    onViewStateChange: setViewState,
    enabled,
  })

  const zoomPercent = Math.round(view.zoom * 100)

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#0f172a",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 16px",
          background: "#1e293b",
          borderBottom: "1px solid #334155",
          color: "#e2e8f0",
          fontFamily: "system-ui, sans-serif",
          fontSize: 14,
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        <a
          href="https://github.com/NemeZZiZZ/use-zoom-pinch"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontWeight: 700, fontSize: 16, color: "#e2e8f0", textDecoration: "none" }}
        >
          useZoomPinch
        </a>
        <span style={{ color: "#64748b", fontSize: 13 }}>
          Lightweight React hook for pan, pinch & zoom
        </span>
        <span style={{ color: "#64748b" }}>|</span>

        <button onClick={() => centerZoom(view.zoom * 1.5)} style={btnStyle}>
          + Zoom In
        </button>
        <button onClick={() => centerZoom(view.zoom / 1.5)} style={btnStyle}>
          - Zoom Out
        </button>
        <button onClick={resetView} style={btnStyle}>
          Reset
        </button>
        <button
          onClick={() => setShowCode((v) => !v)}
          style={{ ...btnStyle, background: showCode ? "#4f46e5" : "#334155" }}
        >
          {"</>"} Code
        </button>

        <span
          style={{
            color: "#94a3b8",
            fontVariantNumeric: "tabular-nums",
            minWidth: 56,
            textAlign: "center",
          }}
        >
          {zoomPercent}%
        </span>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            Enabled
          </label>
          <a
            href="https://github.com/NemeZZiZZ/use-zoom-pinch"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#818cf8",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            GitHub
          </a>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        {/* Canvas */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            overflow: "hidden",
            cursor: enabled ? "grab" : "default",
            background: "#f8fafc",
            position: "relative",
            touchAction: "none",
          }}
        >
          <div
            style={{
              transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
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

            {/* How to use card */}
            <div
              style={{
                position: "absolute",
                left: 50,
                top: 100,
                width: 280,
                height: 200,
                background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
                borderRadius: 12,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                color: "#cbd5e1",
                fontFamily: "system-ui, sans-serif",
                fontSize: 14,
                lineHeight: 2,
                padding: "20px 24px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
                userSelect: "none",
              }}
            >
              <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 16, marginBottom: 4 }}>
                How to use
              </div>
              <div>
                <span style={kbdStyle}>Scroll</span> Pan the canvas
              </div>
              <div>
                <span style={kbdStyle}>Ctrl</span>+<span style={kbdStyle}>Scroll</span> Zoom
              </div>
              <div>
                <span style={kbdStyle}>Drag</span> Pan the canvas
              </div>
              <div>
                <span style={kbdStyle}>Pinch</span> Zoom (touch)
              </div>
            </div>

            {/* Image */}
            <div
              style={{
                position: "absolute",
                left: 550,
                top: 530,
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
                userSelect: "none",
              }}
            >
              <img
                src={`${import.meta.env.BASE_URL}landscape.svg`}
                alt="Landscape"
                width={400}
                height={260}
                draggable={false}
                style={{ display: "block" }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "24px 16px 12px",
                  background: "linear-gradient(transparent, rgba(0,0,0,0.5))",
                  color: "#fff",
                  fontFamily: "system-ui, sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Zoom in to see the details
              </div>
            </div>

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
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontFamily: "system-ui, sans-serif",
                  fontWeight: 600,
                  fontSize: 15,
                  textAlign: "center",
                  padding: 16,
                  boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
                  userSelect: "none",
                }}
              >
                {s.label}
              </div>
            ))}

            <div
              style={{
                position: "absolute",
                left: -4,
                top: -4,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#ef4444",
              }}
            />
          </div>

          {/* Coordinates overlay */}
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: 16,
              background: "rgba(15, 23, 42, 0.85)",
              color: "#94a3b8",
              padding: "8px 14px",
              borderRadius: 8,
              fontFamily: "monospace",
              fontSize: 12,
              lineHeight: 1.6,
              backdropFilter: "blur(8px)",
              pointerEvents: "none",
            }}
          >
            x: {view.x.toFixed(1)} &nbsp; y: {view.y.toFixed(1)} &nbsp; zoom: {view.zoom.toFixed(3)}
          </div>
        </div>

        {/* Code panel */}
        {showCode && (
          <div
            style={{
              width: 420,
              flexShrink: 0,
              background: "#1e293b",
              borderLeft: "1px solid #334155",
              overflow: "auto",
              padding: 20,
              fontFamily: "ui-monospace, Consolas, monospace",
              fontSize: 13,
              lineHeight: 1.6,
              color: "#e2e8f0",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: 14,
                fontWeight: 600,
                color: "#94a3b8",
              }}
            >
              Quick Start
            </div>
            <div
              style={{
                background: "#0f172a",
                borderRadius: 8,
                padding: 16,
                overflow: "auto",
                border: "1px solid #334155",
              }}
            >
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {CODE_EXAMPLE}
              </pre>
            </div>
            <div
              style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: 13,
                color: "#94a3b8",
                lineHeight: 1.6,
              }}
            >
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: "#e2e8f0" }}>
                  npm install use-zoom-pinch
                </span>
              </div>
              <div>
                Supports controlled & uncontrolled modes, mouse, trackpad, and touch. ~2 KB gzipped.
                TypeScript-first.
              </div>
            </div>
            <a
              href="https://github.com/NemeZZiZZ/use-zoom-pinch"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                color: "#818cf8",
                textDecoration: "none",
                fontFamily: "system-ui, sans-serif",
                fontSize: 14,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              View on GitHub
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: "#334155",
  color: "#e2e8f0",
  border: "1px solid #475569",
  borderRadius: 6,
  padding: "4px 12px",
  cursor: "pointer",
  fontSize: 13,
  fontFamily: "system-ui, sans-serif",
}

const kbdStyle: React.CSSProperties = {
  background: "#334155",
  padding: "1px 6px",
  borderRadius: 4,
  fontSize: 12,
  fontFamily: "ui-monospace, Consolas, monospace",
  marginRight: 4,
}
