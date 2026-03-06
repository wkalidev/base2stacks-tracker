import { NextRequest } from 'next/server';
import { ChatGroq } from '@langchain/groq';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

// ── Custom B2S Tools (sans CDP pour l'instant) ────────────────────────────────
const checkBalanceTool = tool(
  async ({ address }) => {
    try {
      const res = await fetch(
        `https://api.mainnet.hiro.so/extended/v1/address/${address}/balances`
      );
      const data = await res.json();
      const stx = parseInt(data.stx?.balance || '0') / 1_000_000;
      return `Wallet ${address}: ${stx.toFixed(6)} STX`;
    } catch {
      return 'Unable to fetch balance right now.';
    }
  },
  {
    name: 'check_stacks_balance',
    description: 'Check STX balance of a Stacks wallet address',
    schema: z.object({ address: z.string().describe('Stacks wallet address') }),
  }
);

const getPoolStatsTool = tool(
  async () => {
    try {
      const res = await fetch(
        'https://api.mainnet.hiro.so/v2/contracts/call-read/SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96/b2s-liquidity-pool-v5/get-reserves',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sender: 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96', arguments: [] }),
        }
      );
      if (!res.ok) return 'Pool stats: B2S/STX liquidity pool is live on mainnet at SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-liquidity-pool-v5';
      return 'B2S Liquidity Pool is active on Stacks mainnet. Fee: 0.25%. Use add-liquidity to provide liquidity.';
    } catch {
      return 'B2S Liquidity Pool is live on Stacks mainnet. Contract: SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-liquidity-pool-v5';
    }
  },
  {
    name: 'get_pool_stats',
    description: 'Get B2S liquidity pool statistics',
    schema: z.object({}),
  }
);

const getBridgeActivityTool = tool(
  async () => {
    try {
      const res = await fetch(
        'https://api.mainnet.hiro.so/extended/v1/address/SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96/transactions?limit=5'
      );
      const data = await res.json();
      const txs = data.results?.slice(0, 5).map((tx: { tx_id: string; tx_status: string; burn_block_time_iso: string }) =>
        `• ${tx.tx_id.slice(0, 12)}... | ${tx.tx_status} | ${new Date(tx.burn_block_time_iso).toLocaleDateString()}`
      ).join('\n') || 'No recent transactions';
      return `Recent B2S contract activity:\n${txs}`;
    } catch {
      return 'Bridge tracker is live! Base ↔ Stacks cross-chain activity is being tracked on-chain.';
    }
  },
  {
    name: 'get_bridge_activity',
    description: 'Get recent cross-chain bridge activity for B2S',
    schema: z.object({}),
  }
);

const getRewardsInfoTool = tool(
  async () => {
    return `B2S Staking Rewards Info:
• Base APY: 12.5%
• Contract: SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-rewards-distributor-v3
• Daily rewards: 144 blocks/day cycle
• Minimum stake: 1 B2S token
• To stake: call (stake amount) on the rewards contract`;
  },
  {
    name: 'get_rewards_info',
    description: 'Get B2S staking rewards and APY information',
    schema: z.object({}),
  }
);

const getNFTBadgesTool = tool(
  async ({ address }) => {
    try {
      const res = await fetch(
        `https://api.mainnet.hiro.so/extended/v1/tokens/nft/holdings?principal=${address}&asset_identifiers=SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-badges::b2s-badge`
      );
      const data = await res.json();
      const count = data.total || 0;
      return count > 0
        ? `Found ${count} B2S badge(s) for ${address}`
        : `No B2S badges found for ${address}. Earn badges by staking $B2S tokens!`;
    } catch {
      return `B2S Badges contract: SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-badges\nBadge types: Bronze/Silver/Gold/Diamond/Legendary Staker, Early Adopter, Launch Hero, and more!`;
    }
  },
  {
    name: 'get_nft_badges',
    description: 'Get B2S NFT badges for a wallet address',
    schema: z.object({ address: z.string().describe('Stacks wallet address') }),
  }
);

// ── Agent singleton ───────────────────────────────────────────────────────────
let agentExecutor: Awaited<ReturnType<typeof createReactAgent>> | null = null;

function getAgent() {
  if (agentExecutor) return agentExecutor;

  const llm = new ChatGroq({
    model:       'llama-3.3-70b-versatile',
    temperature: 0,
    apiKey:      process.env.GROQ_API_KEY!,
  });

  agentExecutor = createReactAgent({
    llm,
    tools: [checkBalanceTool, getPoolStatsTool, getBridgeActivityTool, getRewardsInfoTool, getNFTBadgesTool],
    messageModifier: `
You are B2S Agent, an AI assistant for the Base2Stacks Bridge Tracker ecosystem.
You help users manage their $B2S tokens, NFT badges, and cross-chain bridge activity.

Your capabilities:
- 💰 Check Stacks wallet balances
- 🏅 Check B2S NFT badges (Bronze/Silver/Gold/Diamond/Legendary Staker, Early Adopter, etc.)
- 🌉 Track cross-chain bridge activity between Base and Stacks
- 📊 Get B2S liquidity pool stats (0.25% fee AMM)
- 💎 Explain staking rewards (12.5% APY)
- 💡 Provide DeFi strategy recommendations

Key contracts on Stacks mainnet:
- B2S Token:       SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-token
- B2S Governance:  SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-governance
- B2S Liquidity:   SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-liquidity-pool-v5
- B2S Rewards:     SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-rewards-distributor-v3
- B2S Badges NFT:  SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-badges
- B2S Marketplace: SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-marketplace

Be concise, helpful and friendly. Use emojis to make responses more readable.
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
    agent:   'B2S Agent',
    network: 'Stacks Mainnet',
    model:   'llama-3.3-70b-versatile (Groq)',
  });
}