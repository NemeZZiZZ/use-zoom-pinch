// Polyfill PointerEvent for jsdom
if (typeof PointerEvent === "undefined") {
  class PointerEventPolyfill extends MouseEvent {
    readonly pointerId: number
    readonly pointerType: string
    readonly width: number
    readonly height: number
    readonly pressure: number
    readonly tiltX: number
    readonly tiltY: number

    constructor(type: string, init: PointerEventInit & MouseEventInit = {}) {
      super(type, { bubbles: true, cancelable: true, ...init })
      this.pointerId = init.pointerId ?? 0
      this.pointerType = init.pointerType ?? "mouse"
      this.width = init.width ?? 1
      this.height = init.height ?? 1
      this.pressure = init.pressure ?? 0
      this.tiltX = init.tiltX ?? 0
      this.tiltY = init.tiltY ?? 0
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).PointerEvent = PointerEventPolyfill
}

// Polyfill Touch / TouchEvent for jsdom
if (typeof Touch === "undefined") {
  class TouchPolyfill {
    readonly identifier: number
    readonly target: EventTarget
    readonly clientX: number
    readonly clientY: number
    readonly pageX: number
    readonly pageY: number
    readonly screenX: number
    readonly screenY: number

    constructor(init: {
      identifier: number
      target: EventTarget
      clientX?: number
      clientY?: number
      pageX?: number
      pageY?: number
      screenX?: number
      screenY?: number
    }) {
      this.identifier = init.identifier
      this.target = init.target
      this.clientX = init.clientX ?? 0
      this.clientY = init.clientY ?? 0
      this.pageX = init.pageX ?? 0
      this.pageY = init.pageY ?? 0
      this.screenX = init.screenX ?? 0
      this.screenY = init.screenY ?? 0
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).Touch = TouchPolyfill

  class TouchEventPolyfill extends UIEvent {
    readonly touches: TouchList
    readonly targetTouches: TouchList
    readonly changedTouches: TouchList

    constructor(
      type: string,
      init: {
        touches?: Touch[]
        targetTouches?: Touch[]
        changedTouches?: Touch[]
        bubbles?: boolean
        cancelable?: boolean
      } = {},
    ) {
      super(type, { bubbles: init.bubbles ?? true, cancelable: init.cancelable ?? true })

      const toTouchList = (arr: Touch[] = []): TouchList => {
        return {
          length: arr.length,
          item: (i: number) => arr[i] ?? null,
          [Symbol.iterator]: () => arr[Symbol.iterator](),
          ...Object.fromEntries(arr.map((t, i) => [i, t])),
        } as unknown as TouchList
      }

      this.touches = toTouchList(init.touches)
      this.targetTouches = toTouchList(init.targetTouches)
      this.changedTouches = toTouchList(init.changedTouches)
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).TouchEvent = TouchEventPolyfill
}

// Polyfill ResizeObserver for jsdom
if (typeof ResizeObserver === "undefined") {
  class ResizeObserverPolyfill {
    callback: ResizeObserverCallback
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).ResizeObserver = ResizeObserverPolyfill
}
