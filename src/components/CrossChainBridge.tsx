'use client';

export default function CrossChainBridge() {
  return (
    <div className="cross-chain-bridge">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">🌉 Cross-Chain Bridge</h2>
        <p className="text-white/60">Bridge ETH, USDC, BNB, SOL and more → Stacks ecosystem</p>
      </div>

      {/* Supported chains */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { chain: 'Ethereum', icon: '⟠', color: 'from-blue-500/20 to-indigo-500/20', border: 'border-blue-500/30' },
          { chain: 'Base',     icon: '🔵', color: 'from-blue-400/20 to-cyan-500/20',  border: 'border-cyan-500/30' },
          { chain: 'BNB',      icon: '🟡', color: 'from-yellow-500/20 to-orange-500/20', border: 'border-yellow-500/30' },
          { chain: 'Polygon',  icon: '💜', color: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30' },
        ].map(c => (
          <div key={c.chain} className={`bg-gradient-to-br ${c.color} rounded-lg p-4 border ${c.border} text-center`}>
            <div className="text-3xl mb-2">{c.icon}</div>
            <p className="text-white font-semibold text-sm">{c.chain}</p>
            <p className="text-white/50 text-xs">Supported</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { step: '1', title: 'Select Source', desc: 'Choose your chain and token (ETH, USDC, BNB...)', icon: '🔗' },
          { step: '2', title: 'Bridge',        desc: 'Li.Fi finds the best route across 20+ bridges',   icon: '🌉' },
          { step: '3', title: 'Receive',       desc: 'Get USDCx or STX on Stacks mainnet',              icon: '💎' },
        ].map(s => (
          <div key={s.step} className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-sm font-bold text-white">{s.step}</span>
            </div>
            <h4 className="text-white font-semibold mb-1">{s.title}</h4>
            <p className="text-white/60 text-xs">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Jumper iframe */}
      <div className="rounded-2xl overflow-hidden border border-white/10 mb-8" style={{ height: '640px' }}>
        <iframe
          src="https://jumper.exchange/?theme=dark"
          width="100%"
          height="100%"
          style={{ border: 'none' }}
          title="Cross-Chain Bridge via Jumper"
          allow="clipboard-write"
        />
      </div>

      {/* Fallback links */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <p className="text-white font-semibold mb-3">🔗 Alternative bridges</p>
        <div className="flex flex-wrap gap-3">
          {[
            { name: 'Jumper Exchange', url: 'https://jumper.exchange' },
            { name: 'deBridge',        url: 'https://app.debridge.finance' },
            { name: 'Stargate',        url: 'https://stargate.finance' },
            { name: 'Celer cBridge',   url: 'https://cbridge.celer.network' },
          ].map(b => (
            <a key={b.name} href={b.url} target="_blank" rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/20 text-white/80 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all">
              {b.name} ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}