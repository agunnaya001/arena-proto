/**
 * Arena Champions catalogue. The token IDs and image paths here mirror
 * `public/nfts/metadata.json`, which is the source of truth for the NFT
 * collection. Use this catalogue to render any fighter consistently across
 * the app (marketplace cards, mint preview, profile).
 */
export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary'

export interface FighterTemplate {
  tokenId:   string
  slug:      string
  name:      string
  className: string
  rarity:    Rarity
  image:     string  // absolute path under public/
  stats: {
    strength:     number
    speed:        number
    intelligence: number
  }
}

export const FIGHTERS: readonly FighterTemplate[] = [
  { tokenId: '1', slug: 'cyber-samurai',   name: 'Kaede',      className: 'Samurai',  rarity: 'Epic',      image: '/nfts/cyber-samurai.png',   stats: { strength: 78, speed: 92, intelligence: 71 } },
  { tokenId: '2', slug: 'neon-brawler',    name: 'Rook',       className: 'Brawler',  rarity: 'Common',    image: '/nfts/neon-brawler.png',    stats: { strength: 88, speed: 64, intelligence: 42 } },
  { tokenId: '3', slug: 'quantum-mage',    name: 'Vex',        className: 'Mage',     rarity: 'Rare',      image: '/nfts/quantum-mage.png',    stats: { strength: 38, speed: 71, intelligence: 96 } },
  { tokenId: '4', slug: 'chrome-assassin', name: 'Mira',       className: 'Assassin', rarity: 'Epic',      image: '/nfts/chrome-assassin.png', stats: { strength: 67, speed: 99, intelligence: 74 } },
  { tokenId: '5', slug: 'void-titan',      name: 'Crusher-IX', className: 'Titan',    rarity: 'Legendary', image: '/nfts/void-titan.png',      stats: { strength: 100, speed: 38, intelligence: 62 } },
  { tokenId: '6', slug: 'pulse-knight',    name: 'Aster',      className: 'Knight',   rarity: 'Rare',      image: '/nfts/pulse-knight.png',    stats: { strength: 84, speed: 70, intelligence: 76 } },
] as const

/**
 * Resolve any tokenId to a fighter template. Hashes onto the catalogue so
 * brand-new on-chain mints (tokenId = 7, 8, …) still render a sensible image.
 */
export function fighterByTokenId(tokenId: string | number): FighterTemplate {
  const n = typeof tokenId === 'number' ? tokenId : Number.parseInt(tokenId, 10)
  if (!Number.isFinite(n) || n <= 0) return FIGHTERS[0]
  return FIGHTERS[(n - 1) % FIGHTERS.length]
}

export function fighterImage(tokenId: string | number, base = ''): string {
  const f = fighterByTokenId(tokenId)
  // base is typically import.meta.env.BASE_URL (already trailing-slashed)
  return `${base.replace(/\/$/, '')}${f.image}`
}
