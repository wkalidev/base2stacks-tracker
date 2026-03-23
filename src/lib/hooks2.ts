import { useState, useEffect } from 'react'

export function useOnline(): boolean {
  const [online, setOnline] = useState(true)
  useEffect(() => {
    const on  = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online',  on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}

export function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return size
}

export function useScrollPosition(): number {
  const [pos, setPos] = useState(0)
  useEffect(() => {
    const update = () => setPos(window.scrollY)
    window.addEventListener('scroll', update)
    return () => window.removeEventListener('scroll', update)
  }, [])
  return pos
}
