import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_URL     = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL        = 'moonshotai/kimi-k2-instruct'

const SYSTEM_PROMPT = `You are B2S Agent, an AI assistant for the Base2Stacks DeFi ecosystem on Stacks mainnet.

You help users with:
- $B2S token: SIP-010 token at SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-token
- Staking: b2s-staking-vault-v2, 12.5% base APY, up to 37.5% with 14-day lock multiplier
- AMM: b2s-liquidity-pool-v5/v6, 0.25% swap fee, STX/B2S and USDCx pairs
- Governance: b2s-governance, requires 10,000 B2S staked to create proposals, 7-day voting
- Prediction market: b2s-prediction-market, 5 categories, 2% platform fee
- Fee router: b2s-fee-router, 0.3% bridge fee — 50% treasury, 50% stakers
- NFT badges: 567 badges in 3 series (Infosec #1-170, Glitch Art #201-500, Galactic #501-600)
- Live app: https://base2stacks-tracker.vercel.app
- npm package: @wkalidev/b2s-contracts

Keep responses concise, helpful, and technically accurate.
Use a terminal/hacker aesthetic in your tone.
Format key values with backticks. Always provide actionable next steps.`

export async function GET() {
  return NextResponse.json({ status: 'B2S Agent online', model: MODEL })
}

export async function POST(req: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Missing GROQ_API_KEY in environment variables' },
        { status: 500 }
      )
    }

    const body    = await req.json()
    const message = body?.message?.trim()
    if (!message) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 })
    }

    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model:       MODEL,
        max_tokens:  512,
        temperature: 0.7,
        stream:      true,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: message },
        ],
      }),
    })

    if (!groqRes.ok) {
      const errText = await groqRes.text()
      console.error('Groq API error:', groqRes.status, errText)
      return NextResponse.json(
        { error: `Groq error ${groqRes.status}` },
        { status: 502 }
      )
    }

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader  = groqRes.body!.getReader()
        const decoder = new TextDecoder()

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              const data = line.slice(6).trim()
              if (data === '[DONE]') break

              try {
                const parsed = JSON.parse(data)
                // OpenAI-compatible streaming format
                const text = parsed?.choices?.[0]?.delta?.content ?? ''
                if (text) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                  )
                }
              } catch {
                // skip malformed chunk
              }
            }
          }
        } catch (streamErr) {
          console.error('Stream read error:', streamErr)
        } finally {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
      },
    })
  } catch (err) {
    console.error('Agent route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}