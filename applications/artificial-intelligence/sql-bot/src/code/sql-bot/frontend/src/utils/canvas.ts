// @ts-expect-error eslint-disable-next-line @typescript-eslint/ban-ts-comment
import SnowflakeID from 'snowflake-id'

const snowflake = new SnowflakeID({
  mid: 42,
  offset: (2010 - 1970) * 365 * 24 * 3600 * 1000,
})

export const guid = (prefix?: string) => {
  if (prefix) {
    return `${prefix}_${snowflake.generate()}`
  } else {
    return snowflake.generate()
  }
}

export interface CanvasItem {
  _dragId: string | number
  x: number
  y: number
  sizeX: number
  sizeY: number

  [key: string]: any
}

export type CanvasCoord = {
  x1: number
  y1: number
  x2: number
  y2: number
  c1: number
  c2: number
  el: {
    x: number
    y: number
    sizeX: number
    sizeY: number
    _dragId: string | number
    [key: string]: any
  }
}

export type DashboardInfo = {
  dataState: string
  optType: string
  id: number
  name: string
  pid: number
  status: number
  type: string
  mobileLayout: boolean
}
