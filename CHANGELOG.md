# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
For pre-1.0 releases (`0.x.y`), minor version bumps may include breaking changes.

## [0.4.0] — 2026-07-13

### Breaking

These changes affect `resetView`, the keyboard `0` key, and `doubleTap` modes
`"reset"` / `"toggle"`. Apps that relied on the previous hardcoded reset target
should adjust.

- **`resetView()` now returns to `initialViewState`** instead of the hardcoded
  `{ x: 0, y: 0, zoom: 1, rotation: 0 }`. If `initialViewState` is not provided,
  the default `{ 0, 0, 1 }` is still used.
- **Keyboard `0`** resets to `initialViewState` (was: hardcoded reset).
- **`doubleTap` `"reset"` and `"toggle"`** modes animate back to `initialViewState`,
  preserving the initial `x` / `y` / `zoom` / `rotation`. Previously they reset to
  `{ 0, 0, 1 }` and silently dropped rotation.

### Added

- **`setView(view, { skipConstraints: true })`** — bypasses bounds clamping, axis
  locking, and snap-to-grid for precise programmatic positioning (even outside
  bounds). Only affects `setView`; gestures are always constrained.
- **`activationKeys.rotate`** is now honored (previously declared in the type but
  ignored). Rotation via touch pinch, the Safari `GestureEvent`, and keyboard
  `[` / `]` is gated by the configured activation key.
- **`cursor.zooming`** is now applied while wheel-zooming, and the cursor restores
  to `idle` once the debounced zoom-end fires (previously the option was unused).
- **Exported math helpers** `clamp`, `distance`, `angleBetween` for manual
  coordinate conversion.
- **Debounced `ResizeObserver`** (150ms) for `fitToContent` auto-resize, so window
  resize no longer yanks the viewport on every intermediate frame.
- **Unified `onTransformEnd`** now fires after `doubleTap` and after **inertia
  fully settles** (previously it fired only after pan/zoom/pinch end, and during
  inertia it fired too early at pointer-up).

### Fixed

- **Wheel `preventDefault` ordering** — the wheel handler no longer calls
  `preventDefault()` when it will not handle the event. Previously, with
  `activationKeys.zoom` set but the key not held, or with the relevant gesture
  disabled, the hook still suppressed the browser's native wheel behavior
  (page scroll, ctrl+wheel page zoom).
- **`animateTo` with `duration <= 0`** no longer poisons the view with `NaN`.
  It now jumps to the target immediately.
- **`activationKeys` no longer "stick"** when the user alt-tabs while holding a
  modifier — pressed keys are cleared on `window blur` and `visibilitychange`.
- **`contextmenu` is suppressed** when `panButton: 2` (right mouse), making
  right-button panning usable.

### Tests

- Added `src/__tests__/bugfixes.test.ts` with 27 tests covering all fixes above,
  including wheel `preventDefault` ordering, the duration guard, `skipConstraints`,
  blur-clear, and `onTransformEnd` consistency after double-tap and inertia.
- Fixed a dead test for rotation snap (it had no assertions); replaced with a real
  pinch-gesture-based assertion.
- Updated existing tests to match the new `resetView` / `initialViewState` semantics.

## [0.3.0]

### Added

- Bounds bounce (rubber-band overscroll with snap-back), axis locking, cursor
  management, `wheelMode`, rotation snap levels, activation keys, `onTransformEnd`,
  navigation helpers (`panTo`, `panBy`, `zoomTo`, `fitToRect`), double-tap zoom,
  inertia, animated transitions, controlled mode.
- Test coverage thresholds and `eslint-plugin-react-hooks`.
- README improvements and bundle-size badge.

### Fixed

- Initial release bug fixes.

## [0.1.0]

- Initial release: `useZoomPinch` React hook.
