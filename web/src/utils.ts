import { RateUnit } from './types'

const byteUnit = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s']
const bitUnit = ['bps', 'Kbps', 'Mbps', 'Gbps', 'Tbps']
const rateBase = 1000

export function formatByteRate(rate: number) {
  let level = 0
  while (rate > rateBase) {
    rate = rate / rateBase
    level++
  }

  return `${rate.toFixed(2)} ${byteUnit[level]}`
}

export function formatBitRate(rate: number) {
  let level = 0
  while (rate > rateBase) {
    rate = rate / rateBase
    level++
  }

  return `${rate.toFixed(2)} ${bitUnit[level]}`
}

export type RateFormatter = (rate: number) => string

export const rateFormatters: Record<RateUnit, RateFormatter> = {
  // rate mul 8 since rate unit it byte
  bit: (rate) => formatBitRate(rate * 8),
  byte: formatByteRate,
}

/**
 * 规范化baseURL，移除末尾的斜杠
 */
export function normalizeBaseURL(baseURL: string): string {
  // 移除末尾所有连续的"/"
  return baseURL.replace(/\/+$/, '')
}
