import { describe, expect, it } from 'vitest'
import { create } from 'zustand'

describe('subscribe()', () => {
  it('should correctly have access to subscribe', () => {
    const { subscribe } = create(() => ({ value: 1 }))
    expect(typeof subscribe).toBe('function')
  })
})
