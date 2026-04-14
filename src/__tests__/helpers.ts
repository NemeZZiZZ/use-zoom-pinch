import { renderHook, act, type RenderHookResult } from "@testing-library/react"
import { useRef, type RefObject } from "react"
import { useZoomPinch, type UseZoomPinchOptions, type UseZoomPinchReturn } from "../index"

// ── Container setup ────────────────────────────────────────────────

const CONTAINER_RECT: DOMRect = {
  x: 0,
  y: 0,
  left: 0,
  top: 0,
  right: 800,
  bottom: 600,
  width: 800,
  height: 600,
  toJSON() {
    return this
  },
}

export function createContainer(): HTMLDivElement {
  const el = document.createElement("div")
  document.body.appendChild(el)

  el.getBoundingClientRect = () => ({ ...CONTAINER_RECT })
  Object.defineProperty(el, "offsetWidth", { value: 800, configurable: true })
  Object.defineProperty(el, "offsetHeight", { value: 600, configurable: true })

  return el
}

// ── Hook renderer ──────────────────────────────────────────────────

type ZoomPinchOptions = Omit<UseZoomPinchOptions, "containerRef">

interface ZoomPinchRender {
  result: RenderHookResult<UseZoomPinchReturn, ZoomPinchOptions>["result"]
  container: HTMLDivElement
  rerender: (props?: ZoomPinchOptions) => void
  unmount: () => void
}

export function renderZoomPinch(options: ZoomPinchOptions = {}): ZoomPinchRender {
  const container = createContainer()

  const hookResult = renderHook(
    (props: ZoomPinchOptions) => {
      const containerRef = useRef<HTMLDivElement>(container) as RefObject<HTMLDivElement>
      return useZoomPinch({ containerRef, ...props })
    },
    { initialProps: options },
  )

  return {
    result: hookResult.result,
    container,
    rerender: (props?: ZoomPinchOptions) => hookResult.rerender(props ?? options),
    unmount: () => {
      hookResult.unmount()
      container.remove()
    },
  }
}

// ── Event dispatchers ──────────────────────────────────────────────

export function fireWheel(
  el: HTMLElement,
  overrides: Partial<WheelEventInit> & { clientX?: number; clientY?: number } = {},
) {
  const event = new WheelEvent("wheel", {
    bubbles: true,
    cancelable: true,
    deltaX: 0,
    deltaY: 0,
    deltaMode: 0,
    clientX: 400,
    clientY: 300,
    ...overrides,
  })
  act(() => {
    el.dispatchEvent(event)
  })
}

export function firePointerDown(
  el: HTMLElement,
  overrides: Partial<PointerEventInit & MouseEventInit> = {},
) {
  const event = new PointerEvent("pointerdown", {
    bubbles: true,
    cancelable: true,
    pointerId: 1,
    pointerType: "mouse",
    button: 0,
    clientX: 0,
    clientY: 0,
    ...overrides,
  })
  act(() => {
    el.dispatchEvent(event)
  })
}

export function firePointerMove(overrides: Partial<PointerEventInit & MouseEventInit> = {}) {
  const event = new PointerEvent("pointermove", {
    bubbles: true,
    cancelable: true,
    pointerId: 1,
    pointerType: "mouse",
    clientX: 0,
    clientY: 0,
    ...overrides,
  })
  act(() => {
    window.dispatchEvent(event)
  })
}

export function firePointerUp(overrides: Partial<PointerEventInit & MouseEventInit> = {}) {
  const event = new PointerEvent("pointerup", {
    bubbles: true,
    cancelable: true,
    pointerId: 1,
    pointerType: "mouse",
    ...overrides,
  })
  act(() => {
    window.dispatchEvent(event)
  })
}

export function fireTouchStart(el: HTMLElement, touches: { x: number; y: number }[]) {
  const touchObjects = touches.map(
    (t, i) =>
      new Touch({
        identifier: i,
        target: el,
        clientX: t.x,
        clientY: t.y,
      }),
  )
  const event = new TouchEvent("touchstart", {
    touches: touchObjects,
    targetTouches: touchObjects,
    changedTouches: touchObjects,
    bubbles: true,
    cancelable: true,
  })
  act(() => {
    el.dispatchEvent(event)
  })
}

export function fireTouchMove(el: HTMLElement, touches: { x: number; y: number }[]) {
  const touchObjects = touches.map(
    (t, i) =>
      new Touch({
        identifier: i,
        target: el,
        clientX: t.x,
        clientY: t.y,
      }),
  )
  const event = new TouchEvent("touchmove", {
    touches: touchObjects,
    targetTouches: touchObjects,
    changedTouches: touchObjects,
    bubbles: true,
    cancelable: true,
  })
  act(() => {
    el.dispatchEvent(event)
  })
}

export function fireTouchEnd(el: HTMLElement, remainingTouches: { x: number; y: number }[] = []) {
  const touchObjects = remainingTouches.map(
    (t, i) =>
      new Touch({
        identifier: i,
        target: el,
        clientX: t.x,
        clientY: t.y,
      }),
  )
  const event = new TouchEvent("touchend", {
    touches: touchObjects,
    targetTouches: touchObjects,
    changedTouches: [],
    bubbles: true,
    cancelable: true,
  })
  act(() => {
    el.dispatchEvent(event)
  })
}
