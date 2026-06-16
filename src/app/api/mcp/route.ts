import { NextRequest, NextResponse } from 'next/server'

const APP_URL  = 'https://base2stacks-tracker.vercel.app'
const CONTRACT = 'SP1V72500C63KN9E348QDK9X879MASSTN0J3KBQ5N'

const TOOLS = [
  {
    name: 'get_b2s_stats',
    description: 'Get live $B2S token statistics: price, supply, holders, market data.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_staking_info',
    description: 'Get staking options for $B2S: APY tiers (12.5% / 25% / 37.5%), TVL, lock durations.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_bridge_routes',
    description: 'Get available bridge routes between Base Network and Stacks with fees and estimated times.',
    inputSchema: {
      type: 'object',
      properties: {
        direction: {
          type: 'string',
          enum: ['base_to_stacks', 'stacks_to_base'],
          description: 'Bridge direction',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_swap_quote',
    description: 'Get a swap quote for STX/B2S or STX/USDCx pairs via the AMM (0.25% fee, constant product formula).',
    inputSchema: {
      type: 'object',
      properties: {
        tokenIn:  { type: 'string', enum: ['STX', 'B2S', 'USDCx'], description: 'Input token' },
        tokenOut: { type: 'string', enum: ['STX', 'B2S', 'USDCx'], description: 'Output token' },
        amount:   { type: 'number', description: 'Amount to swap' },
      },
      required: ['tokenIn', 'tokenOut', 'amount'],
    },
  },
  {
    name: 'get_leaderboard',
    description: 'Get top stakers and earners on Base2Stacks.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of entries (max 10)', default: 5 },
      },
      required: [],
    },
  },
  {
    name: 'get_nft_badges',
    description: 'Get NFT badge collection info: 567 badges in 3 series (Infosec, Glitch Art, Galactic), 5 rarity tiers.',
    inputSchema: {
      type: 'object',
      properties: {
        series: {
          type: 'string',
          enum: ['infosec', 'glitch', 'galactic', 'all'],
          description: 'Badge series',
        },
      },
      required: [],
    },
  },
]

export async function GET() {
  return NextResponse.json({
    name:     'B2S DeFi Agent MCP Server',
    version:  '1.0.0',
    protocol: 'MCP 2024-11-05',
    tools:    TOOLS.map(t => ({ name: t.name, description: t.description })),
    status:   'healthy',
    endpoint: `${APP_URL}/api/mcp`,
    contracts: {
      token:   `${CONTRACT}.b2s-token-v4`,
      staking: `${CONTRACT}.b2s-staking-vault-v2`,
      amm:     `${CONTRACT}.b2s-liquidity-pool-v6`,
    },
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    }

    const { method, params, id } = body

    if (method === 'initialize') {
      return NextResponse.json({
        jsonrpc: '2.0', id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities:    { tools: {} },
          serverInfo:      { name: 'b2s-defi-mcp', version: '1.0.0' },
        },
      })
    }

    if (method === 'tools/list') {
      return NextResponse.json({ jsonrpc: '2.0', id, result: { tools: TOOLS } })
    }

    if (method === 'tools/call') {
      const { name, arguments: args } = params

      if (name === 'get_b2s_stats') {
        const res  = await fetch(`${APP_URL}/api/market`, { next: { revalidate: 60 } })
        const data = res.ok ? await res.json() : {}
        return NextResponse.json({
          jsonrpc: '2.0', id,
          result: {
            content: [{
              type: 'text',
              text: JSON.stringify({ ...data, contract: `${CONTRACT}.b2s-token-v4`, decimals: 6, max_supply: '10000000' }, null, 2),
            }],
          },
        })
      }

      if (name === 'get_staking_info') {
        return NextResponse.json({
          jsonrpc: '2.0', id,
          result: {
            content: [{
              type: 'text',
              text: JSON.stringify({
                tiers: [
                  { apy: '12.5%', lock: 'None',     multiplier: '1x', vault: `${CONTRACT}.b2s-staking-vault-v2` },
                  { apy: '25%',   lock: '70 days',  multiplier: '2x', vault: `${CONTRACT}.b2s-staking-vault-v2` },
                  { apy: '37.5%', lock: '365 days', multiplier: '3x', vault: `${CONTRACT}.b2s-staking-vault-v2` },
                ],
                compound_frequency: 'daily',
                min_stake:          '1 B2S',
                app:                `${APP_URL}/#staking`,
              }, null, 2),
            }],
          },
        })
      }

      if (name === 'get_bridge_routes') {
        const direction = args?.direction || 'base_to_stacks'
        return NextResponse.json({
          jsonrpc: '2.0', id,
          result: {
            content: [{
              type: 'text',
              text: JSON.stringify({
                direction,
                routes: [
                  { name: 'Stargate',  fee: '0.3%', time: '5-10 min',  supported_tokens: ['USDC', 'ETH'] },
                  { name: 'deBridge', fee: '0.3%', time: '2-5 min',   supported_tokens: ['USDC', 'ETH', 'MATIC'] },
                  { name: 'Across',    fee: '0.2%', time: '1-3 min',   supported_tokens: ['USDC', 'ETH', 'WBTC'] },
                ],
                bridge_fee_contract: `${CONTRACT}.b2s-fee-router`,
                app: `${APP_URL}/#bridge`,
              }, null, 2),
            }],
          },
        })
      }

      if (name === 'get_swap_quote') {
        const validTokens = ['STX', 'B2S', 'USDCx']
        const { tokenIn = 'STX', tokenOut = 'B2S', amount = 10 } = args || {}
        if (!validTokens.includes(tokenIn) || !validTokens.includes(tokenOut)) {
          return NextResponse.json({ jsonrpc: '2.0', id, error: { code: -32602, message: 'Invalid token pair' } })
        }
        if (typeof amount !== 'number' || amount <= 0 || amount > 1000000) {
          return NextResponse.json({ jsonrpc: '2.0', id, error: { code: -32602, message: 'Invalid amount' } })
        }
        return NextResponse.json({
          jsonrpc: '2.0', id,
          result: {
            content: [{
              type: 'text',
              text: JSON.stringify({
                tokenIn, tokenOut, amountIn: amount,
                fee:     '0.25%',
                amm:     `${CONTRACT}.b2s-liquidity-pool-v6`,
                formula: 'x*y=k (constant product)',
                note:    'Exact output depends on current pool reserves. Connect wallet for live quote.',
                app:     `${APP_URL}/#swap`,
              }, null, 2),
            }],
          },
        })
      }

      if (name === 'get_leaderboard') {
        return NextResponse.json({
          jsonrpc: '2.0', id,
          result: {
            content: [{
              type: 'text',
              text: JSON.stringify({
                leaderboard_url: `${APP_URL}/#leaderboard`,
                note:            'Live leaderboard available in the app. Data from on-chain staking vault.',
                contract:        `${CONTRACT}.b2s-staking-vault-v2`,
              }, null, 2),
            }],
          },
        })
      }

      if (name === 'get_nft_badges') {
        const series = args?.series || 'all'
        return NextResponse.json({
          jsonrpc: '2.0', id,
          result: {
            content: [{
              type: 'text',
              text: JSON.stringify({
                total: 567,
                series: {
                  infosec:  { range: '1-170',    count: 170, theme: 'Cybersecurity & hacking' },
                  glitch:   { range: '201-500',  count: 300, theme: 'Digital glitch art' },
                  galactic: { range: '501-600',  count: 100, theme: 'Space & cosmos' },
                },
                rarities:        ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'],
                storage:         'IPFS via Pinata (multi-gateway fallback)',
                marketplace_fee: '2.5%',
                contract:        `${CONTRACT}.b2s-marketplace`,
                filter:          series,
                app:             `${APP_URL}/#nft`,
              }, null, 2),
            }],
          },
        })
      }

      return NextResponse.json({ jsonrpc: '2.0', id, error: { code: -32601, message: `Tool not found: ${name}` } })
    }

    if (method === 'ping') {
      return NextResponse.json({ jsonrpc: '2.0', id, result: {} })
    }

    return NextResponse.json({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } })
  } catch {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } },
      { status: 400 },
    )
  }
}
