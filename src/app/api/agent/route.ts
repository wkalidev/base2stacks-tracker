import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const CONTRACT = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96';
const HIRO     = 'https://api.mainnet.hiro.so';

// ── Tool definitions ──────────────────────────────────────────────────────────
const tools: Anthropic.Tool[] = [
  {
    name: 'check_balance',
    description: 'Check STX and B2S token balance of a Stacks wallet',
    input_schema: {
      type: 'object' as const,
      properties: { address: { type: 'string', description: 'Stacks wallet address SP...' } },
      required: ['address'],
    },
  },
  {
    name: 'get_price',
    description: 'Get live price of STX, BTC or other crypto from CoinGecko',
    input_schema: {
      type: 'object' as const,
      properties: { coin: { type: 'string', description: 'Coin symbol: stx, btc, eth...' } },
      required: ['coin'],
    },
  },
  {
    name: 'get_pool_stats',
    description: 'Get B2S liquidity pool statistics and recent activity',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'get_wallet_transactions',
    description: 'Get recent transactions for a Stacks wallet address',
    input_schema: {
      type: 'object' as const,
      properties: {
        address: { type: 'string', description: 'Stacks wallet address' },
        limit:   { type: 'number', description: 'Number of transactions (default 5, max 20)' },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_bridge_activity',
    description: 'Get recent cross-chain bridge activity Base ↔ Stacks',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'get_staking_info',
    description: 'Get staking APY info and calculate projected earnings',
    input_schema: {
      type: 'object' as const,
      properties: { amount: { type: 'number', description: 'Amount of B2S to stake for earnings calculation' } },
      required: [],
    },
  },
  {
    name: 'get_nft_badges',
    description: 'Get B2S NFT badges held by a wallet address',
    input_schema: {
      type: 'object' as const,
      properties: { address: { type: 'string', description: 'Stacks wallet address' } },
      required: ['address'],
    },
  },
  {
    name: 'get_governance_info',
    description: 'Get B2S DAO governance info, proposals and voting activity',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'get_defi_strategy',
    description: 'Get personalized DeFi strategy recommendations for B2S ecosystem',
    input_schema: {
      type: 'object' as const,
      properties: {
        riskLevel: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Risk tolerance' },
        amount:    { type: 'number', description: 'Investment amount in USD' },
      },
      required: ['riskLevel'],
    },
  },
  {
    name: 'get_network_status',
    description: 'Get current Stacks network status and block height',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
];

// ── Tool execution ────────────────────────────────────────────────────────────
async function executeTool(name: string, input: Record<string, any>): Promise<string> {
  try {
    switch (name) {

      case 'check_balance': {
        const { address } = input;
        const res  = await fetch(`${HIRO}/extended/v1/address/${address}/balances`);
        const data = await res.json();
        const stx  = (parseInt(data.stx?.balance || '0') / 1_000_000).toFixed(4);
        const ft   = data.fungible_tokens || {};
        const b2sKey = Object.keys(ft).find(k => k.includes('b2s-token'));
        const b2s  = b2sKey ? (parseInt(ft[b2sKey].balance || '0') / 1_000_000).toFixed(2) : '0.00';
        return `💰 Wallet ${address.slice(0, 8)}...\n• STX: ${stx} STX\n• B2S: ${b2s} $B2S`;
      }

      case 'get_price': {
        const { coin } = input;
        const id  = coin.toLowerCase() === 'stx' ? 'blockstack' : coin.toLowerCase() === 'btc' ? 'bitcoin' : coin.toLowerCase();
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`);
        const data = await res.json();
        const price  = data[id]?.usd;
        const change = data[id]?.usd_24h_change?.toFixed(2);
        if (!price) return `Price not found for ${coin}`;
        const arrow = parseFloat(change) >= 0 ? '📈' : '📉';
        return `${arrow} ${coin.toUpperCase()}: $${price.toFixed(4)} (${change}% 24h)`;
      }

      case 'get_pool_stats': {
        const res  = await fetch(`${HIRO}/extended/v1/address/${CONTRACT}/transactions?limit=10`);
        const data = await res.json();
        const swaps = data.results?.filter((tx: any) => tx.contract_call?.function_name === 'swap').length || 0;
        return `💧 B2S Liquidity Pool:\n• Status: ✅ Live\n• Contract: b2s-liquidity-pool-v5\n• Fee: 0.25%\n• Recent swaps: ${swaps}\n• Pairs: B2S/STX, B2S/USDCx, STX/USDCx`;
      }

      case 'get_wallet_transactions': {
        const { address, limit = 5 } = input;
        const res  = await fetch(`${HIRO}/extended/v1/address/${address}/transactions?limit=${limit}`);
        const data = await res.json();
        if (!data.results?.length) return `No transactions found for ${address}`;
        const txs = data.results.map((tx: any) => {
          const fn     = tx.contract_call?.function_name || tx.tx_type;
          const status = tx.tx_status === 'success' ? '✅' : '❌';
          const date   = new Date(tx.burn_block_time_iso).toLocaleDateString();
          return `${status} ${fn} — ${date} (${tx.tx_id.slice(0, 10)}...)`;
        }).join('\n');
        return `📋 Last ${limit} txs for ${address.slice(0, 8)}...:\n${txs}`;
      }

      case 'get_bridge_activity': {
        const res  = await fetch(`${HIRO}/extended/v1/address/${CONTRACT}/transactions?limit=10`);
        const data = await res.json();
        const bridges = data.results?.filter((tx: any) => tx.contract_call?.function_name === 'record-bridge') || [];
        if (!bridges.length) return '🌉 No recent bridge txs.\nBridge Base ↔ Stacks via Stargate, deBridge, or Across.';
        const list = bridges.slice(0, 5).map((tx: any) =>
          `• ${tx.sender_address?.slice(0, 8)}... → ${tx.tx_id.slice(0, 10)}... (${new Date(tx.burn_block_time_iso).toLocaleDateString()})`
        ).join('\n');
        return `🌉 Recent bridge activity:\n${list}`;
      }

      case 'get_staking_info': {
        const { amount } = input;
        const apy     = 12.5;
        const daily   = amount ? (amount * apy / 100 / 365).toFixed(4) : null;
        const monthly = amount ? (amount * apy / 100 / 12).toFixed(2)  : null;
        const yearly  = amount ? (amount * apy / 100).toFixed(2)        : null;
        return `💎 B2S Staking:\n• Base APY: ${apy}%\n• Max APY: 37.5% (3x lock multiplier)\n• Contract: b2s-staking-vault-v2\n• Min stake: 1 $B2S${amount ? `\n\n📊 For ${amount} $B2S:\n• Daily: ${daily} $B2S\n• Monthly: ${monthly} $B2S\n• Yearly: ${yearly} $B2S` : ''}`;
      }

      case 'get_nft_badges': {
        const { address } = input;
        const res  = await fetch(
          `${HIRO}/extended/v1/tokens/nft/holdings?principal=${address}&asset_identifiers=${CONTRACT}.b2s-badges::b2s-badge`
        );
        const data  = await res.json();
        const count = data.total || 0;
        return count > 0
          ? `🏅 ${count} B2S badge(s) for ${address.slice(0, 8)}...\nTypes: Bronze/Silver/Gold/Diamond/Legendary`
          : `🏅 No badges yet for ${address.slice(0, 8)}...\nEarn by staking:\n• Bronze: 100 $B2S\n• Silver: 500\n• Gold: 1,000\n• Diamond: 5,000\n• Legendary: 10,000+`;
      }

      case 'get_governance_info': {
        const res  = await fetch(`${HIRO}/extended/v1/address/${CONTRACT}/transactions?limit=20`);
        const data = await res.json();
        const votes     = data.results?.filter((tx: any) => tx.contract_call?.function_name === 'vote').length || 0;
        const proposals = data.results?.filter((tx: any) => tx.contract_call?.function_name === 'create-proposal').length || 0;
        return `🏛️ B2S Governance:\n• Contract: b2s-governance\n• Recent votes: ${votes}\n• Recent proposals: ${proposals}\n• Min to vote: 1,000 $B2S\n• Min to propose: 10,000 $B2S`;
      }

      case 'get_defi_strategy': {
        const { riskLevel, amount } = input;
        const strategies: Record<string, string> = {
          low:    `🛡️ Low Risk${amount ? ` ($${amount})` : ''}:\n1. Stake $B2S → 12.5% APY\n2. Claim 5 $B2S daily\n3. Hold for governance\nEst: 12-15% APY`,
          medium: `⚖️ Medium Risk${amount ? ` ($${amount})` : ''}:\n1. 50% stake B2S → 12.5% APY\n2. 50% B2S/STX LP → 0.25% fees\n3. Compound daily rewards\nEst: 15-25% APY`,
          high:   `🚀 High Risk${amount ? ` ($${amount})` : ''}:\n1. Max LP position B2S/STX + USDCx\n2. Compound daily rewards into LP\n3. Bridge STX from Base for arb\n4. Participate in prediction market\nEst: 25-40% APY (impermanent loss risk)`,
        };
        return strategies[riskLevel] || strategies.medium;
      }

      case 'get_network_status': {
        const res  = await fetch(`${HIRO}/extended/v1/status`);
        const data = await res.json();
        return `🌐 Stacks Network:\n• Status: ${data.status || 'ok'}\n• Block: #${data.stacks_tip_height || 'N/A'}\n• Network: Mainnet\n• API: api.mainnet.hiro.so`;
      }

      default:
        return 'Unknown tool';
    }
  } catch (err) {
    return `Error running ${name}: ${String(err)}`;
  }
}

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM = `You are B2S Agent, a smart AI assistant for the Base2Stacks DeFi ecosystem on Stacks blockchain.
You are helpful, concise, and use emojis to make responses readable.

## Capabilities:
- 💰 Check STX + B2S wallet balances
- 📈 Live crypto prices (STX, BTC, ETH...)
- 💧 Liquidity pool stats (B2S/STX, B2S/USDCx, STX/USDCx)
- 📋 Wallet transaction history
- 🌉 Cross-chain bridge activity (Base ↔ Stacks)
- 💎 Staking info + APY calculator (12.5% base, up to 37.5%)
- 🏅 NFT badges (200 unique, 3 Legendaries)
- 🏛️ Governance DAO info
- 🚀 Personalized DeFi strategy advice
- 🌐 Stacks network status

## Key contracts (SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96):
- b2s-token: Main $B2S token, daily claim 5 $B2S
- b2s-liquidity-pool-v5: AMM 0.25% fee
- b2s-staking-vault-v2: 12.5% APY staking
- b2s-rewards-distributor-v3: Daily rewards
- b2s-governance: DAO voting
- b2s-prediction-market: Prediction bets
- b2s-badges: SIP-009 NFT badges
- b2s-marketplace: NFT sales (2.5% fee)

## Bridge partners:
- deBridge: https://app.debridge.com/r/32893
- Rango: https://rango.vip/a/o9pwCm

## Rules:
- Always use tools to fetch real data
- If user mentions SP... address, use it in tool calls
- Be concise — max 5-6 lines unless detail is needed
- Always suggest next steps
- Respond in the same language as the user`;

// ── POST handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json();
    if (!message) return Response.json({ error: 'Message required' }, { status: 400 });

    const messages: Anthropic.MessageParam[] = [
      ...history,
      { role: 'user', content: message },
    ];

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let response = await client.messages.create({
            model:      'claude-sonnet-4-6',
            max_tokens: 1024,
            system:     SYSTEM,
            tools,
            messages,
          });

          // Agentic loop
          while (response.stop_reason === 'tool_use') {
            const toolUses    = response.content.filter(b => b.type === 'tool_use');
            const toolResults: Anthropic.ToolResultBlockParam[] = [];

            for (const tu of toolUses) {
              if (tu.type !== 'tool_use') continue;
              const result = await executeTool(tu.name, tu.input as Record<string, any>);
              toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: result });
            }

            messages.push({ role: 'assistant', content: response.content });
            messages.push({ role: 'user',      content: toolResults });

            response = await client.messages.create({
              model:      'claude-sonnet-4-6',
              max_tokens: 1024,
              system:     SYSTEM,
              tools,
              messages,
            });
          }

          const text = response.content
            .filter(b => b.type === 'text')
            .map(b => (b as Anthropic.TextBlock).text)
            .join('');

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();

        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
      },
    });

  } catch (err) {
    console.error('Agent error:', err);
    return Response.json({ error: 'Agent failed' }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({
    status:  'online',
    agent:   'B2S Agent v3',
    model:   'claude-sonnet-4-6',
    network: 'Stacks Mainnet',
    tools:   10,
  });
}