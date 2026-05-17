export const TRANSITIONS = {
  fast:   'all 0.15s ease',
  normal: 'all 0.3s ease',
  slow:   'all 0.5s ease',
  spring: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
}

export const HOVER_SCALE = {
  sm:  'hover:scale-[1.02]',
  md:  'hover:scale-105',
  lg:  'hover:scale-110',
}

export function fadeIn(delay = 0): React.CSSProperties {
  return {
    animation: `fadeIn 0.5s ease ${delay}s both`,
  }
}
