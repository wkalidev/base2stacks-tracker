import { NextRequest } from 'next/server';
import { ChatGroq } from '@langchain/groq';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const CONTRACT = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96';
const HIRO = 'https://api.mainnet.hiro.so';

// ── 1. Balance STX + B2S token ────────────────────────────────────────────────
const checkBalanceTool = tool(
  async ({ address }) => {
    try {
      const [balRes, b2sRes] = await Promise.all([
        fetch(`${HIRO}/extended/v1/address/${address}/balances`),
        fetch(`${HIRO}/v2/contracts/call-read/${CONTRACT}/b2s-token/get-balance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sender: address, arguments: [`0x${Buffer.from(`(standard-principal "${address}")`).toString('hex')}`] }),
        }),
      ]);
      const balData = await balRes.json();
      const stx = parseInt(balData.stx?.balance || '0') / 1_000_000;
      const fungible = balData.fungible_tokens || {};
      const b2sKey = Object.keys(fungible).find(k => k.includes('b2s-token'));
      const b2s = b2sKey ? parseInt(fungible[b2sKey].balance || '0') / 1_000_000 : 0;
      return `💰 Wallet ${address.slice(0,8)}...\n• STX: ${stx.toFixed(4)} STX\n• B2S: ${b2s.toFixed(2)} $B2S`;
    } catch {
      return 'Unable to fetch balance right now.';
    }
  },
  {
    name: 'check_balance',
    description: 'Check STX and B2S token balance of a Stacks wallet',
    schema: z.object({ address: z.string().describe('Stacks wallet address SP...') }),
  }
);

// ── 2. STX/BTC prix live via CoinGecko ───────────────────────────────────────
const getPriceTool = tool(
  async ({ coin }) => {
    try {
      const id = coin.toLowerCase() === 'stx' ? 'blockstack' : coin.toLowerCase() === 'btc' ? 'bitcoin' : coin.toLowerCase();
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`);
      const data = await res.json();
      const price = data[id]?.usd;
      const change = data[id]?.usd_24h_change?.toFixed(2);
      if (!price) return `Price not found for ${coin}`;
      const arrow = parseFloat(change) >= 0 ? '📈' : '📉';
      return `${arrow} ${coin.toUpperCase()} Price: $${price.toFixed(4)} (${change}% 24h)`;
    } catch {
      return 'Unable to fetch price right now.';
    }
  },
  {
    name: 'get_price',
    description: 'Get live price of STX, BTC or other crypto from CoinGecko',
    schema: z.object({ coin: z.string().describe('Coin symbol: stx, btc, eth...') }),
  }
);

// ── 3. Pool stats réels ────────────────────────────────────────────────────────
const getPoolStatsTool = tool(
  async () => {
    try {
      const res = await fetch(`${HIRO}/extended/v1/address/${CONTRACT}/transactions?limit=10`);
      const data = await res.json();
      const swaps = data.results?.filter((tx: any) => tx.contract_call?.function_name === 'swap').length || 0;
      return `💧 B2S Liquidity Pool Stats:\n• Status: ✅ Live on Stacks Mainnet\n• Contract: b2s-liquidity-pool-v5\n• Swap fee: 0.25%\n• Recent swaps (last 10 txs): ${swaps}\n• Pairs: B2S/STX, B2S/USDCx, STX/USDCx`;
    } catch {
      return '💧 B2S Liquidity Pool is live on Stacks mainnet.\n• Fee: 0.25%\n• Pairs: B2S/STX, B2S/USDCx, STX/USDCx';
    }
  },
  {
    name: 'get_pool_stats',
    description: 'Get B2S liquidity pool statistics and recent activity',
    schema: z.object({}),
  }
);

// ── 4. Transactions récentes d'un wallet ──────────────────────────────────────
const getWalletTxsTool = tool(
  async ({ address, limit }) => {
    try {
      const res = await fetch(`${HIRO}/extended/v1/address/${address}/transactions?limit=${limit || 5}`);
      const data = await res.json();
      if (!data.results?.length) return `No transactions found for ${address}`;
      const txs = data.results.map((tx: any) => {
        const fn = tx.contract_call?.function_name || tx.tx_type;
        const status = tx.tx_status === 'success' ? '✅' : '❌';
        const date = new Date(tx.burn_block_time_iso).toLocaleDateString();
        return `${status} ${fn} — ${date} (${tx.tx_id.slice(0,10)}...)`;
      }).join('\n');
      return `📋 Last ${limit || 5} transactions for ${address.slice(0,8)}...:\n${txs}`;
    } catch {
      return 'Unable to fetch transactions.';
    }
  },
  {
    name: 'get_wallet_transactions',
    description: 'Get recent transactions for a Stacks wallet address',
    schema: z.object({
      address: z.string().describe('Stacks wallet address'),
      limit: z.number().optional().describe('Number of transactions (default 5, max 20)'),
    }),
  }
);

// ── 5. Bridge activity ────────────────────────────────────────────────────────
const getBridgeActivityTool = tool(
  async () => {
    try {
      const res = await fetch(`${HIRO}/extended/v1/address/${CONTRACT}/transactions?limit=10`);
      const data = await res.json();
      const bridges = data.results?.filter((tx: any) =>
        tx.contract_call?.function_name === 'record-bridge'
      ) || [];
      if (!bridges.length) return '🌉 No recent bridge transactions recorded. Bridge between Base ↔ Stacks using Stargate, deBridge, or Across.';
      const list = bridges.slice(0, 5).map((tx: any) =>
        `• ${tx.sender_address?.slice(0,8)}... → ${tx.tx_id.slice(0,10)}... (${new Date(tx.burn_block_time_iso).toLocaleDateString()})`
      ).join('\n');
      return `🌉 Recent bridge activity:\n${list}`;
    } catch {
      return '🌉 Bridge tracker active. Use Stargate, deBridge (affiliate), or Across to bridge to Stacks.';
    }
  },
  {
    name: 'get_bridge_activity',
    description: 'Get recent cross-chain bridge activity',
    schema: z.object({}),
  }
);

// ── 6. Staking info + calcul APY ──────────────────────────────────────────────
const getStakingInfoTool = tool(
  async ({ amount }) => {
    const apy = 12.5;
    const daily = amount ? (amount * apy / 100 / 365).toFixed(4) : null;
    const monthly = amount ? (amount * apy / 100 / 12).toFixed(2) : null;
    const yearly = amount ? (amount * apy / 100).toFixed(2) : null;
    return `💎 B2S Staking Info:
• APY: ${apy}%
• Contract: b2s-staking-vault-v2
• Rewards: b2s-rewards-distributor-v3
• Min stake: 1 $B2S
• Cycle: 144 blocks/day${amount ? `\n\n📊 Projected earnings for ${amount} $B2S:\n• Daily: ${daily} $B2S\n• Monthly: ${monthly} $B2S\n• Yearly: ${yearly} $B2S` : ''}`;
  },
  {
    name: 'get_staking_info',
    description: 'Get staking APY info and calculate projected earnings',
    schema: z.object({
      amount: z.number().optional().describe('Amount of B2S to stake for earnings calculation'),
    }),
  }
);

// ── 7. NFT badges ─────────────────────────────────────────────────────────────
const getNFTBadgesTool = tool(
  async ({ address }) => {
    try {
      const res = await fetch(
        `${HIRO}/extended/v1/tokens/nft/holdings?principal=${address}&asset_identifiers=${CONTRACT}.b2s-badges::b2s-badge`
      );
      const data = await res.json();
      const count = data.total || 0;
      return count > 0
        ? `🏅 Found ${count} B2S badge(s) for ${address.slice(0,8)}...\nBadge types: Bronze/Silver/Gold/Diamond/Legendary Staker, OSINT Master, Bug Bounty, Pen Tester`
        : `🏅 No B2S badges found for ${address.slice(0,8)}...\nEarn badges by staking $B2S! Available: Bronze (100 B2S), Silver (500), Gold (1000), Diamond (5000), Legendary (10000+)`;
    } catch {
      return '🏅 B2S Badges: 200 unique NFTs on Stacks mainnet.\nRarities: Common → Rare → Epic → Legendary\n3 Legendaries: OSINT Master (#38), Bug Bounty (#76), Pen Tester (#114)';
    }
  },
  {
    name: 'get_nft_badges',
    description: 'Get B2S NFT badges for a wallet address',
    schema: z.object({ address: z.string().describe('Stacks wallet address') }),
  }
);

// ── 8. Info gouvernance ───────────────────────────────────────────────────────
const getGovernanceTool = tool(
  async () => {
    try {
      const res = await fetch(`${HIRO}/extended/v1/address/${CONTRACT}/transactions?limit=20`);
      const data = await res.json();
      const votes = data.results?.filter((tx: any) => tx.contract_call?.function_name === 'vote').length || 0;
      const proposals = data.results?.filter((tx: any) => tx.contract_call?.function_name === 'create-proposal').length || 0;
      return `🏛️ B2S Governance:\n• Contract: b2s-governance\n• Recent votes: ${votes}\n• Recent proposals: ${proposals}\n• To vote: stake 1000+ $B2S then call (vote proposal-id true/false)\n• To propose: stake 10,000+ $B2S then call (create-proposal)`;
    } catch {
      return '🏛️ B2S Governance is live!\n• Min to vote: 1,000 $B2S\n• Min to propose: 10,000 $B2S\n• Contract: b2s-governance';
    }
  },
  {
    name: 'get_governance_info',
    description: 'Get B2S DAO governance info, proposals and voting activity',
    schema: z.object({}),
  }
);

// ── 9. DeFi strategy advisor ──────────────────────────────────────────────────
const getStrategyTool = tool(
  async ({ riskLevel, amount }) => {
    const strategies: Record<string, string> = {
      low: `🛡️ Low Risk Strategy (${amount ? `$${amount}` : 'any amount'}):\n1. Buy $B2S on liquidity pool\n2. Stake in b2s-staking-vault-v2 → 12.5% APY\n3. Hold for governance rights\nEstimated: Safe, steady 12.5% yearly`,
      medium: `⚖️ Medium Risk Strategy (${amount ? `$${amount}` : 'any amount'}):\n1. Split 50/50: Stake B2S + Add B2S/STX liquidity\n2. Staking: 12.5% APY\n3. LP fees: 0.25% per swap\n4. Claim daily rewards (5 $B2S/day)\nEstimated: 15-25% APY combined`,
      high: `🚀 High Risk Strategy (${amount ? `$${amount}` : 'any amount'}):\n1. Max LP position B2S/STX + B2S/USDCx\n2. Compound daily rewards back into LP\n3. Bridge STX from Base for arbitrage\n4. Participate in governance for early access\nEstimated: 25-40% APY (with impermanent loss risk)`,
    };
    return strategies[riskLevel] || strategies.medium;
  },
  {
    name: 'get_defi_strategy',
    description: 'Get personalized DeFi strategy recommendations for B2S ecosystem',
    schema: z.object({
      riskLevel: z.enum(['low', 'medium', 'high']).describe('Risk tolerance level'),
      amount: z.number().optional().describe('Investment amount in USD'),
    }),
  }
);

// ── 10. Stacks network status ─────────────────────────────────────────────────
const getNetworkStatusTool = tool(
  async () => {
    try {
      const res = await fetch(`${HIRO}/extended/v1/status`);
      const data = await res.json();
      return `🌐 Stacks Network Status:\n• Status: ${data.status || 'ok'}\n• Chain tip: block #${data.stacks_tip_height || 'N/A'}\n• Network: Mainnet\n• API: ${HIRO}`;
    } catch {
      return '🌐 Stacks Mainnet: Online\nAPI: api.mainnet.hiro.so';
    }
  },
  {
    name: 'get_network_status',
    description: 'Get current Stacks network status and block height',
    schema: z.object({}),
  }
);

// ── Agent singleton ───────────────────────────────────────────────────────────
let agentExecutor: Awaited<ReturnType<typeof createReactAgent>> | null = null;

function getAgent() {
  if (agentExecutor) return agentExecutor;

  const llm = new ChatGroq({
    model:       'llama-3.3-70b-versatile',
    temperature: 0.2,
    apiKey:      process.env.GROQ_API_KEY!,
  });

  agentExecutor = createReactAgent({
    llm,
    tools: [
      checkBalanceTool,
      getPriceTool,
      getPoolStatsTool,
      getWalletTxsTool,
      getBridgeActivityTool,
      getStakingInfoTool,
      getNFTBadgesTool,
      getGovernanceTool,
      getStrategyTool,
      getNetworkStatusTool,
    ],
    messageModifier: `
You are B2S Agent, a smart AI assistant for the Base2Stacks DeFi ecosystem on Stacks blockchain.
You are helpful, concise, and use emojis to make responses readable.

## Your capabilities:
- 💰 Check STX + B2S wallet balances
- 📈 Get live crypto prices (STX, BTC, ETH...)
- 💧 Get liquidity pool stats (B2S/STX, B2S/USDCx, STX/USDCx)
- 📋 Show recent wallet transactions
- 🌉 Track cross-chain bridge activity (Base ↔ Stacks)
- 💎 Staking info + APY calculator (12.5% APY)
- 🏅 Check NFT badges (200 unique, 3 Legendaries)
- 🏛️ Governance DAO info and voting
- 🚀 Personalized DeFi strategy advice
- 🌐 Stacks network status

## Key contracts (Stacks Mainnet — SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96):
- b2s-token-v4          — Main token (Clarity 4)
- b2s-liquidity-pool-v5 — AMM (B2S/STX, B2S/USDCx)
- b2s-liquidity-pool-v6 — USDCx pairs
- b2s-staking-vault-v2  — 12.5% APY staking
- b2s-rewards-distributor-v3 — Daily rewards (5 B2S/day)
- b2s-governance        — DAO voting
- b2s-prediction-market — Prediction bets
- b2s-airdrop-v2        — Airdrop claims
- b2s-fee-router        — 0.3% bridge fees

## Affiliate links (mention when relevant):
- deBridge: https://app.debridge.com/r/32893
- Rango: https://rango.vip/a/o9pwCm
- Jupiter Swap (Solana): https://jup.ag/?ref=j5ft3v5m26eu

## Rules:
- Always use tools to fetch real data before answering
- If user mentions a wallet address (SP...), use it in tool calls
- Be concise — max 5-6 lines per response unless detail is requested
- Always suggest next steps or actions the user can take
- If asked about swapping, recommend the liquidity pool or bridge partners
    `,
  });

  return agentExecutor;
}

// ── API Route ─────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message) return Response.json({ error: 'Message required' }, { status: 400 });

    const agent = getAgent();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const agentStream = await agent.stream(
            { messages: [new HumanMessage(message)] },
            { configurable: { thread_id: 'b2s-agent' } },
          );

          for await (const chunk of agentStream) {
            if (chunk.agent?.messages?.[0]?.content) {
              const text = chunk.agent.messages[0].content as string;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
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
        Connection:      'keep-alive',
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
    agent:   'B2S Agent v2',
    network: 'Stacks Mainnet',
    model:   'llama-3.3-70b-versatile (Groq)',
    tools:   10,
  });
}