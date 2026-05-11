const AI_PANEL_WIDTH = 620
const AI_PANEL_HEIGHT = 720
const AI_PANEL_MIN_WIDTH = 420
const AI_PANEL_MIN_HEIGHT = 360
const AI_PANEL_MARGIN = 24
const MOBILE_BREAKPOINT = 1024

export interface AiPanelLayoutState {
  x: number
  y: number
  width: number
  height: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function getMaxLayoutSize() {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  return {
    maxWidth: Math.max(AI_PANEL_MIN_WIDTH, Math.floor(viewportWidth * 0.9)),
    maxHeight: Math.max(AI_PANEL_MIN_HEIGHT, Math.floor(viewportHeight * 0.85)),
  }
}

export function normalizeLayout(
  layout: AiPanelLayoutState,
): AiPanelLayoutState {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const { maxWidth, maxHeight } = getMaxLayoutSize()
  const width = clamp(Math.round(layout.width), AI_PANEL_MIN_WIDTH, maxWidth)
  const height = clamp(
    Math.round(layout.height),
    AI_PANEL_MIN_HEIGHT,
    maxHeight,
  )
  const maxX = Math.max(
    AI_PANEL_MARGIN,
    viewportWidth - width - AI_PANEL_MARGIN,
  )
  const maxY = Math.max(
    AI_PANEL_MARGIN,
    viewportHeight - height - AI_PANEL_MARGIN,
  )
  return {
    width,
    height,
    x: clamp(Math.round(layout.x), AI_PANEL_MARGIN, maxX),
    y: clamp(Math.round(layout.y), AI_PANEL_MARGIN, maxY),
  }
}

function getDefaultLayout(): AiPanelLayoutState {
  const { maxWidth, maxHeight } = getMaxLayoutSize()
  const width = Math.min(AI_PANEL_WIDTH, maxWidth)
  const height = Math.min(AI_PANEL_HEIGHT, maxHeight)
  return normalizeLayout({
    width,
    height,
    x: window.innerWidth - width - AI_PANEL_MARGIN,
    y: AI_PANEL_MARGIN + 48,
  })
}

function getStorageKey(channelId: string): string {
  return `ai-panel-layout:${channelId}`
}

export function loadLayout(channelId: string): AiPanelLayoutState {
  const defaultLayout = getDefaultLayout()
  if (typeof window === 'undefined') {
    return defaultLayout
  }
  try {
    const raw = window.localStorage.getItem(getStorageKey(channelId))
    if (!raw) {
      return defaultLayout
    }
    const parsed = JSON.parse(raw) as Partial<AiPanelLayoutState> | null
    if (
      !parsed ||
      typeof parsed.x !== 'number' ||
      typeof parsed.y !== 'number' ||
      typeof parsed.width !== 'number' ||
      typeof parsed.height !== 'number'
    ) {
      return defaultLayout
    }
    return normalizeLayout({
      x: parsed.x,
      y: parsed.y,
      width: parsed.width,
      height: parsed.height,
    })
  } catch {
    return defaultLayout
  }
}

export function persistLayout(
  channelId: string,
  layout: AiPanelLayoutState,
): void {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(getStorageKey(channelId), JSON.stringify(layout))
}

export const aiPanelLayoutConstants = {
  panelWidth: AI_PANEL_WIDTH,
  panelHeight: AI_PANEL_HEIGHT,
  minWidth: AI_PANEL_MIN_WIDTH,
  minHeight: AI_PANEL_MIN_HEIGHT,
  margin: AI_PANEL_MARGIN,
  mobileBreakpoint: MOBILE_BREAKPOINT,
}
