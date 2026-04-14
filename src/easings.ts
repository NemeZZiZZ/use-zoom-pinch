import type { EasingFunction } from "./types"

export const linear: EasingFunction = (t) => t

export const easeOut: EasingFunction = (t) => 1 - (1 - t) ** 3

export const easeInOut: EasingFunction = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
