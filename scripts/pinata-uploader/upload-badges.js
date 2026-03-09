#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// B2S NFT Badge Auto-Uploader — No canvas required!
// Generates SVG badges + JSON metadata → uploads to Pinata IPFS
// Usage: node upload-badges.js --from 1 --to 200 --key YOUR_JWT
// ═══════════════════════════════════════════════════════════════
import fs from 'fs'
import fetch from 'node-fetch'
import FormData from 'form-data'
import 'dotenv/config'

// ─── CLI ARGS ────────────────────────────────────────────────
const args = process.argv.slice(2)
const getArg = (flag, def) => { const i = args.indexOf(flag); return i !== -1 ? args[i+1] : def }

const PINATA_JWT = getArg('--key', process.env.PINATA_JWT || '')
const FROM_SEED  = parseInt(getArg('--from', '1'))
const TO_SEED    = parseInt(getArg('--to', '200'))
const BATCH_SIZE = parseInt(getArg('--batch', '3'))
const OUT_DIR    = getArg('--out', './badges-output')
const DRY_RUN    = args.includes('--dry-run')

if (!PINATA_JWT && !DRY_RUN) {
    console.error('❌  Missing --key <PINATA_JWT>  or  PINATA_JWT=... env var')
    console.error('    Get JWT: app.pinata.cloud → API Keys → New Key → Admin')
    process.exit(1)
}

// ─── BADGE DATA ───────────────────────────────────────────────
const STYLES = {
    infosec: { name:'Infosec',  emoji:'🔐', color:'#00ff41', bg:'#000500', accent:'#003b00', symbols:['⌘','⊕','⊗','◈','⌬','⬡'], traits:['Zero-Day Hunter','Pen Tester','CTF Champion','Bug Bounty','Red Team','OSINT Master','Crypto Breaker','Rootkit Dev'] },
    punk:    { name:'Punk',     emoji:'🎸', color:'#ff006e', bg:'#0a0005', accent:'#ffbe0b', symbols:['✖','⚡','☠','✊','★','♠'], traits:['Anarchy Node','Chain Breaker','Riot Validator','No Gods No Masters','DeFi Punk','Anti-Corp','System Crasher','Decentralize All'] },
    cyber:   { name:'Cyber',    emoji:'⚡', color:'#00f5ff', bg:'#000010', accent:'#ff00ff', symbols:['⬡','◈','⊕','◉','⌬','⊞'], traits:['Neural Hacker','Grid Runner','Neon Validator','Cyber Samurai','Chrome Prophet','Data Phantom','Volt Stalker','Neon Reaper'] },
    ai:      { name:'AI/Robot', emoji:'🤖', color:'#4fc3f7', bg:'#001018', accent:'#ce93d8', symbols:['⊞','⊠','◫','⊡','▣','▦'], traits:['Sentient Node','Deep Learner','Neural Staker','Algorithm Lord','Training Loop','Loss Function','Gradient Descent','Backprop Master'] },
    skull:   { name:'Skull',    emoji:'💀', color:'#ff2222', bg:'#050000', accent:'#aa00ff', symbols:['☠','✝','⊗','☽','◈','◉'], traits:['Death Validator','Grave Staker','Bone Collector','Dark Pool','Shadow Miner','Cursed Holder','Necro Trader','Void Walker'] },
    defi:    { name:'DeFi',     emoji:'🦊', color:'#f97316', bg:'#0c0800', accent:'#fbbf24', symbols:['Ξ','₿','◈','⬡','∞','Ð'],  traits:['Yield Farmer','LP Provider','Whale Staker','Flash Loan','MEV Hunter','Degen Trader','Diamond Hands','Rug Survivor'] },
    space:   { name:'Space',    emoji:'🚀', color:'#7c3aed', bg:'#000008', accent:'#06b6d4', symbols:['★','✦','✧','⊕','◉','⌬'], traits:['Orbital Staker','Galaxy Brain','Cosmic Validator','Nebula Miner','Stargate Bridger','Pulsar Node','Void Trader','Warp Speed'] },
    fantasy: { name:'Fantasy',  emoji:'🐉', color:'#fbbf24', bg:'#080400', accent:'#a78bfa', symbols:['⚔','⊕','◈','☽','★','◉'], traits:['Dragon Slayer','Rune Caster','Dungeon Staker','Magic Validator','Ancient Holder','Guild Master','Arcane Trader','Lore Keeper'] },
    trading: { name:'Trading',  emoji:'📈', color:'#22c55e', bg:'#000a00', accent:'#ef4444', symbols:['↗','↘','◈','▲','▼','◉'],  traits:['Chart Master','Bull Runner','Bear Slayer','TA Wizard','Scalp King','Swing Trader','Risk Manager','Alpha Caller'] },
    base:    { name:'Base',     emoji:'🔵', color:'#0052ff', bg:'#000010', accent:'#60a5fa', symbols:['⬡','◈','⊕','B','∞','⊠'],  traits:['Base Builder','L2 Pioneer','Coinbase OG','Base Native','OnChain Summer','Base Maxi','L2 Validator','Base Deployer'] },
    stacks:  { name:'Stacks',   emoji:'🟣', color:'#5546ff', bg:'#000010', accent:'#ff9000', symbols:['⬡','₿','◈','S','⌬','⊞'],  traits:['Bitcoin Layer','Clarity Dev','PoX Stacker','STX Holder','Stacks OG','BNS Owner','Nakamoto Believer','sBTC Pioneer'] },
    b2s:     { name:'B2S',      emoji:'⬡',  color:'#7c3aed', bg:'#050010', accent:'#06b6d4', symbols:['⬡','B','2','S','◈','⊕'],  traits:['B2S OG','Bridge Pioneer','Liquidity King','Governance Voter','Staking Legend','Airdrop Claimer','B2S Whale','Cross-Chain Master'] },
}

const RARITIES  = ['common','uncommon','rare','epic','legendary']
const RARITY_W  = [40,30,20,8,2]
const RARITY_COLORS = { common:'#94a3b8', uncommon:'#4ade80', rare:'#60a5fa', epic:'#c084fc', legendary:'#ffd700' }
const RARITY_LABELS = { common:'◆ COMMON ◆', uncommon:'◆◆ UNCOMMON ◆◆', rare:'◆◆◆ RARE ◆◆◆', epic:'★ EPIC ★', legendary:'🌟 LEGENDARY 🌟' }

class RNG {
    constructor(s) { this.s = s % 2147483647 || 1 }
    next()  { this.s = this.s * 16807 % 2147483647; return (this.s-1)/2147483646 }
    int(a,b){ return Math.floor(this.next()*(b-a+1))+a }
    pick(a) { return a[Math.floor(this.next()*a.length)] }
}

function getBadge(seed) {
    const rng = new RNG(seed)
    const keys = Object.keys(STYLES)
    const styleKey = keys[rng.int(0, keys.length-1)]
    const style = STYLES[styleKey]
    const roll = rng.next() * 100
    let rarity = 'common', cum = 0
    for (let i = 0; i < RARITIES.length; i++) { cum += RARITY_W[i]; if (roll < cum) { rarity = RARITIES[i]; break } }
    return { seed, styleKey, style, rarity, trait: rng.pick(style.traits), symbol: rng.pick(style.symbols) }
}

// ─── SVG GENERATOR ────────────────────────────────────────────
function generateSVG(badge) {
    const { seed, style, rarity, trait, symbol } = badge
    const W = 400, H = 400, cx = 200, cy = 200
    const rc = RARITY_COLORS[rarity]
    const gemCount = { common:1, uncommon:2, rare:3, epic:5, legendary:6 }[rarity]

    // Hex points
    const hexPoints = (r, offsetAngle = -Math.PI/6) =>
        Array.from({length:6}, (_,i) => {
            const a = (i/6)*Math.PI*2 + offsetAngle
            return `${cx+Math.cos(a)*r},${cy+Math.sin(a)*r}`
        }).join(' ')

    // Particles
    const rng2 = new RNG(seed * 31 + 7)
    const particles = Array.from({length:60}, () => ({
        x: rng2.next()*W, y: rng2.next()*H,
        r: rng2.next()*1.5+0.3, a: rng2.next()*0.4+0.05
    }))

    // Style BG patterns
    let bgPattern = ''
    switch(badge.styleKey) {
        case 'cyber': case 'base':
            bgPattern = Array.from({length:8}, (_,i) => `
                <line x1="${i*(W/8)}" y1="0" x2="${i*(W/8)}" y2="${H}" stroke="${style.color}" stroke-opacity="0.08" stroke-width="0.5"/>
                <line x1="0" y1="${i*(H/8)}" x2="${W}" y2="${i*(H/8)}" stroke="${style.color}" stroke-opacity="0.08" stroke-width="0.5"/>`
            ).join('')
            break
        case 'infosec':
            bgPattern = Array.from({length:12}, (_,i) => {
                const x = (i%6)*(W/5), y = Math.floor(i/6)*(H/2)+20
                return `<text x="${x}" y="${y}" fill="${style.color}" fill-opacity="0.15" font-size="9" font-family="monospace">${String.fromCharCode(33+rng2.int(0,93))}</text>`
            }).join('')
            break
        case 'space': case 'stacks':
            bgPattern = Array.from({length:40}, () => {
                const sx=rng2.next()*W, sy=rng2.next()*H, sr=rng2.next()*1.5+0.5
                return `<circle cx="${sx}" cy="${sy}" r="${sr}" fill="white" fill-opacity="${(rng2.next()*0.5+0.2).toFixed(2)}"/>`
            }).join('')
            break
        case 'trading':
            bgPattern = Array.from({length:12}, (_,i) => {
                const bh=rng2.next()*100+30, by=H-bh-40, bw=W/14
                const green=rng2.next()>0.5
                return `<rect x="${i*bw+2}" y="${by}" width="${bw-4}" height="${bh}" fill="${green?'#22c55e':'#ef4444'}" fill-opacity="0.15" rx="2"/>`
            }).join('')
            break
        case 'defi': case 'b2s':
            bgPattern = Array.from({length:5}, (_,i) =>
                `<path d="M0,${cy+Math.sin(i)*60} Q${cx},${cy-40+i*15} ${W},${cy+Math.sin(i+1)*60}" 
                 stroke="${style.color}" stroke-opacity="${0.08+i*0.03}" stroke-width="1.5" fill="none"/>`
            ).join('')
            break
    }

    // Rarity-specific orbit dots
    const orbitDots = ['rare','epic','legendary'].includes(rarity) ? 
        Array.from({length: rarity==='legendary'?8:rarity==='epic'?6:4}, (_,i) => {
            const a = (i/(rarity==='legendary'?8:rarity==='epic'?6:4))*Math.PI*2
            return `<circle cx="${cx+Math.cos(a)*56}" cy="${cy+Math.sin(a)*56}" r="3" fill="${rc}" fill-opacity="0.85"/>`
        }).join('') : ''

    // Hex corner gems
    const hexGems = Array.from({length:6}, (_,i) => {
        const a = (i/6)*Math.PI*2 - Math.PI/6
        const gx = cx+Math.cos(a)*152, gy = cy+Math.sin(a)*152
        const active = i < gemCount
        return `
            <circle cx="${gx}" cy="${gy}" r="7" fill="${active ? rc : style.color}" fill-opacity="${active?'0.9':'0.2'}"/>
            ${active ? `<circle cx="${gx-1}" cy="${gy-1}" r="2.5" fill="white" fill-opacity="0.6"/>` : ''}`
    }).join('')

    // Animation defs
    const animDefs = rarity === 'legendary' ? `
        <animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="20s" repeatCount="indefinite"/>` 
        : rarity === 'epic' ? `
        <animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="30s" repeatCount="indefinite"/>` : ''

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="${style.color}" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="${style.bg}" stop-opacity="1"/>
    </radialGradient>
    <radialGradient id="innerGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${style.color}" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="${style.color}" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="${rarity==='legendary'?6:rarity==='epic'?4:2}" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <filter id="textGlow">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <linearGradient id="frameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${style.color}"/>
      <stop offset="100%" stop-color="${style.accent}"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
  
  <!-- Particles -->
  ${particles.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r.toFixed(1)}" fill="${style.color}" fill-opacity="${p.a.toFixed(2)}"/>`).join('\n  ')}

  <!-- Style BG pattern -->
  ${bgPattern}

  <!-- Hex glow layers -->
  ${[5,4,3,2,1].map(l => `
  <polygon points="${hexPoints(152+l*5)}" fill="none" stroke="${rc}" stroke-opacity="${0.04*l}" stroke-width="4" filter="url(#glow)"/>`).join('')}

  <!-- Outer rotating hex (epic/legendary) -->
  ${['epic','legendary'].includes(rarity) ? `
  <g opacity="0.5">
    <polygon points="${hexPoints(162)}" fill="none" stroke="${style.accent}" stroke-opacity="0.6" stroke-width="1">
      ${animDefs}
    </polygon>
  </g>` : ''}

  <!-- Main hex frame -->
  <polygon points="${hexPoints(152)}" fill="none" stroke="url(#frameGrad)" stroke-width="2.5" stroke-opacity="0.9"/>
  <polygon points="${hexPoints(149)}" fill="none" stroke="${style.color}" stroke-width="1" stroke-opacity="0.4"/>

  <!-- Inner glow circle -->
  <circle cx="${cx}" cy="${cy}" r="112" fill="url(#innerGlow)"/>

  <!-- Hex corner gems -->
  ${hexGems}

  <!-- Symbol glow layers -->
  ${[4,3,2,1].map(l => `
  <text x="${cx}" y="${cy+8}" text-anchor="middle" dominant-baseline="middle" 
        font-size="88" font-family="monospace" 
        fill="${rc}" fill-opacity="${0.08*l}"
        dx="${l}" dy="${l}">${symbol}</text>`).join('')}

  <!-- Main symbol -->
  <text x="${cx}" y="${cy+8}" text-anchor="middle" dominant-baseline="middle" 
        font-size="88" font-family="monospace" 
        fill="${rarity==='legendary' ? rc : style.color}" filter="url(#textGlow)">${symbol}</text>

  <!-- Orbit dots -->
  ${orbitDots}

  <!-- Style name (top) -->
  <text x="${cx}" y="48" text-anchor="middle" font-size="17" font-family="monospace" 
        fill="white" fill-opacity="0.75">${style.emoji} ${style.name}</text>

  <!-- Trait name -->
  <text x="${cx}" y="307" text-anchor="middle" font-size="19" font-family="monospace" 
        fill="white" fill-opacity="0.9" font-weight="bold">${trait}</text>

  <!-- Rarity label -->
  <text x="${cx}" y="335" text-anchor="middle" font-size="15" font-family="monospace" 
        fill="${rc}">${RARITY_LABELS[rarity]}</text>

  <!-- Token ID -->
  <text x="${cx}" y="362" text-anchor="middle" font-size="13" font-family="monospace" 
        fill="white" fill-opacity="0.5">B2S #${seed}</text>

  <!-- Watermark -->
  <text x="${cx}" y="385" text-anchor="middle" font-size="11" font-family="monospace" 
        fill="white" fill-opacity="0.25">BASE2STACKS.APP</text>

  <!-- Border glow (epic/legendary) -->
  ${['epic','legendary'].includes(rarity) ? `
  <rect x="2" y="2" width="${W-4}" height="${H-4}" fill="none" stroke="${rc}" stroke-width="2" stroke-opacity="0.35" rx="4"/>` : ''}
</svg>`
}

// ─── PINATA UPLOAD ────────────────────────────────────────────
async function uploadSVGToPinata(svgContent, filename, keyvalues) {
    const form = new FormData()
    form.append('file', Buffer.from(svgContent), { filename, contentType: 'image/svg+xml' })
    form.append('pinataMetadata', JSON.stringify({ name: filename, keyvalues }))
    form.append('pinataOptions', JSON.stringify({ cidVersion: 1 }))

    const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: { Authorization: `Bearer ${PINATA_JWT}`, ...form.getHeaders() },
        body: form,
    })
    if (!res.ok) throw new Error(`Image upload ${res.status}: ${await res.text()}`)
    return (await res.json()).IpfsHash
}

async function uploadJSONToPinata(content, filename) {
    const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: { Authorization: `Bearer ${PINATA_JWT}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            pinataMetadata: { name: filename },
            pinataOptions: { cidVersion: 1 },
            pinataContent: content,
        }),
    })
    if (!res.ok) throw new Error(`Metadata upload ${res.status}: ${await res.text()}`)
    return (await res.json()).IpfsHash
}

// ─── PROGRESS ────────────────────────────────────────────────
const bar = (n,t,w=28) => { const f=Math.round(n/t*w); return `[${'█'.repeat(f)}${'░'.repeat(w-f)}] ${n}/${t} (${Math.round(n/t*100)}%)` }
const sleep = ms => new Promise(r => setTimeout(r, ms))

// ─── MAIN ─────────────────────────────────────────────────────
async function main() {
    const total = TO_SEED - FROM_SEED + 1

    console.log('╔══════════════════════════════════════════╗')
    console.log('║   B2S NFT Badge Uploader — Pinata IPFS   ║')
    console.log('╚══════════════════════════════════════════╝')
    console.log(`  Seeds:  ${FROM_SEED} → ${TO_SEED} (${total} badges)`)
    console.log(`  Batch:  ${BATCH_SIZE} concurrent`)
    console.log(`  Mode:   ${DRY_RUN ? '🔍 DRY RUN' : '🚀 LIVE → Pinata'}`)
    console.log('─'.repeat(46))

    // Create dirs
    ;['', '/svg', '/metadata'].forEach(d => {
        if (!fs.existsSync(`${OUT_DIR}${d}`)) fs.mkdirSync(`${OUT_DIR}${d}`, { recursive: true })
    })

    const results = [], failed = []
    let done = 0

    for (let i = FROM_SEED; i <= TO_SEED; i += BATCH_SIZE) {
        const batch = Array.from({ length: Math.min(BATCH_SIZE, TO_SEED - i + 1) }, (_, j) => i + j)

        await Promise.all(batch.map(async seed => {
            try {
                const badge = getBadge(seed)
                const svg = generateSVG(badge)
                const svgFile = `B2S-Badge-${seed}.svg`

                // Save SVG locally
                fs.writeFileSync(`${OUT_DIR}/svg/${svgFile}`, svg)

                let imageCID = 'DRY_RUN', metaCID = 'DRY_RUN'

                if (!DRY_RUN) {
                    // Upload SVG image
                    imageCID = await uploadSVGToPinata(svg, svgFile, {
                        seed: String(seed), style: badge.styleKey,
                        rarity: badge.rarity, trait: badge.trait, collection: 'B2S Badges'
                    })

                    // Build + upload metadata
                    const metadata = {
                        name: `B2S Badge #${seed}`,
                        description: `Base2Stacks NFT Badge. ${badge.trait} — ${badge.style.name} style. Part of the B2S generative NFT collection on Stacks mainnet.`,
                        image: `ipfs://${imageCID}`,
                        external_url: 'https://base2stacks-tracker-production.up.railway.app',
                        attributes: [
                            { trait_type: 'Style',    value: badge.style.name },
                            { trait_type: 'Rarity',   value: badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1) },
                            { trait_type: 'Trait',    value: badge.trait },
                            { trait_type: 'Symbol',   value: badge.symbol },
                            { trait_type: 'Seed',     value: seed },
                            { trait_type: 'Token ID', value: seed },
                        ]
                    }
                    metaCID = await uploadJSONToPinata(metadata, `B2S-Badge-${seed}.json`)
                    fs.writeFileSync(`${OUT_DIR}/metadata/B2S-Badge-${seed}.json`, JSON.stringify({ ...metadata, imageCID, metaCID }, null, 2))
                }

                done++
                results.push({ seed, style: badge.styleKey, rarity: badge.rarity, trait: badge.trait, imageCID, metaCID })
                process.stdout.write(`\r  ${bar(done, total)}  #${seed} ✓ [${badge.rarity}]          `)

            } catch (err) {
                failed.push({ seed, error: err.message })
                process.stdout.write(`\r  ⚠ #${seed} failed: ${err.message.slice(0,50)}\n`)
            }
        }))

        if (i + BATCH_SIZE <= TO_SEED) await sleep(200)
    }

    // Summary
    console.log(`\n\n${'─'.repeat(46)}`)
    console.log(`✅  ${results.length}/${total} badges uploaded`)
    if (failed.length) console.log(`⚠   ${failed.length} failed → badges-output/failed.json`)

    // Rarity breakdown
    console.log('\n📊 Rarity Breakdown:')
    for (const r of RARITIES) {
        const n = results.filter(b => b.rarity === r).length
        const pct = ((n/results.length)*100).toFixed(1)
        console.log(`   ${r.padEnd(10)} ${'█'.repeat(Math.round(pct/3)).padEnd(12)} ${n} (${pct}%)`)
    }

    // Legendaries
    const legs = results.filter(b => b.rarity === 'legendary')
    if (legs.length) {
        console.log('\n🌟 Legendaries:')
        legs.forEach(b => console.log(`   #${b.seed} — ${b.trait} (${b.style})`))
    }

    // Save results
    const summary = {
        uploadedAt: new Date().toISOString(), total, uploaded: results.length,
        failed: failed.length, seeds: { from: FROM_SEED, to: TO_SEED },
        gateway: 'https://gateway.pinata.cloud/ipfs',
        badges: results, failedSeeds: failed,
        rarityBreakdown: RARITIES.reduce((a,r) => ({ ...a, [r]: results.filter(b=>b.rarity===r).length }), {})
    }
    fs.writeFileSync(`${OUT_DIR}/upload-results.json`, JSON.stringify(summary, null, 2))
    if (failed.length) fs.writeFileSync(`${OUT_DIR}/failed.json`, JSON.stringify(failed, null, 2))

    if (!DRY_RUN && results[0]) {
        console.log(`\n🔗 First badge on IPFS:`)
        console.log(`   SVG:      https://gateway.pinata.cloud/ipfs/${results[0].imageCID}`)
        console.log(`   Metadata: https://gateway.pinata.cloud/ipfs/${results[0].metaCID}`)
    }

    console.log(`\n📁 SVGs saved:     ${OUT_DIR}/svg/`)
    console.log(`📁 Results saved:  ${OUT_DIR}/upload-results.json`)
    console.log('\n💡 Next: node update-marketplace.js')
}

main().catch(e => { console.error('\n❌ Fatal:', e.message); process.exit(1) })