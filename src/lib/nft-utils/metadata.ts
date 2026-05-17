export interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes: { trait_type: string; value: string }[]
}

export function buildMetadata(name: string, description: string, image: string, type: string, rarity: string): NFTMetadata {
  return { name, description, image, attributes: [
    { trait_type: 'Type',   value: type   },
    { trait_type: 'Rarity', value: rarity },
  ]}
}
