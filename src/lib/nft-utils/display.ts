export function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    Common:    '#94a3b8',
    Uncommon:  '#4ade80',
    Rare:      '#60a5fa',
    Epic:      '#a78bfa',
    Legendary: '#fb923c',
  }
  return colors[rarity] || '#94a3b8'
}

export function getRarityBg(rarity: string): string {
  const bgs: Record<string, string> = {
    Common:    'rgba(148,163,184,0.1)',
    Uncommon:  'rgba(74,222,128,0.1)',
    Rare:      'rgba(96,165,250,0.1)',
    Epic:      'rgba(167,139,250,0.1)',
    Legendary: 'rgba(251,146,60,0.1)',
  }
  return bgs[rarity] || 'rgba(148,163,184,0.1)'
}

export function getBadgeEmoji(name: string): string {
  const emojis: Record<string, string> = {
    'Bronze Staker':    '🥉',
    'Silver Staker':    '🥈',
    'Gold Staker':      '🥇',
    'Diamond Staker':   '💎',
    'Legendary Staker': '👑',
    'Early Adopter':    '🚀',
    'Launch Hero':      '🔥',
    'Power User':       '⚡',
    'Bug Hunter':       '🐛',
  }
  return emojis[name] || '🏅'
}
