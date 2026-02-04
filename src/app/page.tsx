'use client'

import { useState } from 'react'

export default function Page() {
  const [isConnected, setIsConnected] = useState(false)

  return (
    <div className="min-h-screen">
      {/* Header avec VRAI LOGO */}
      <header className="container mx-auto px-4 py-4 sm:py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/android-chrome-192x192.png" 
              alt="Base2Stacks Logo" 
              className="w-10 h-10 sm:w-12 sm:h-12"
            />
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Base<span className="text-b2s-accent">2</span>Stacks
            </h1>
          </div>
          
          <button 
            onClick={() => setIsConnected(!isConnected)}
            className="bg-gradient-to-r from-b2s-primary to-b2s-accent text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:opacity-90 transition-all"
          >
            {isConnected ? '✅ Connected' : 'Connect'}
          </button>
        </nav>
      </header>

      {/* Hero avec LOGO en grand */}
      <section className="container mx-auto px-4 py-10 sm:py-20 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Logo centré en grand */}
          <div className="mb-8">
            <img 
              src="/android-chrome-512x512.png" 
              alt="Base2Stacks" 
              className="mx-auto w-32 h-32 sm:w-48 sm:h-48 md:w-56 md:h-56 animate-float"
            />
          </div>

          <span className="bg-b2s-accent/20 text-b2s-accent px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border border-b2s-accent/30 inline-block mb-4 sm:mb-6">
            🎉 Stacks Builder Rewards
          </span>
          
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
            Track Cross-Chain Bridges
          </h2>
          
          <p className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-b2s-primary via-blue-500 to-b2s-accent">
              Earn $B2S Tokens
            </span>
          </p>
          
          <p className="text-base sm:text-lg md:text-xl text-white/70 mb-8 sm:mb-10 px-4">
            Monitor bridge activity between Base Network and Stacks Blockchain
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <button 
              onClick={() => alert('🚧 Coming soon! Bridge tracking will be available in Phase 2')}
              className="w-full sm:w-auto bg-gradient-to-r from-b2s-primary to-b2s-accent text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:opacity-90 transition-all transform hover:scale-105 shadow-lg"
            >
              Start Tracking
            </button>
            <a 
              href="https://github.com/wkalidev/base2stacks-tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-white/10 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold border border-white/20 hover:bg-white/20 transition-all text-center"
            >
              View Docs
            </a>
          </div>

          {/* Token Info Badge */}
          <div className="mt-8 sm:mt-12 bg-white/5 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-white/10">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
              <div className="flex items-center space-x-2">
                <span className="text-b2s-accent text-xl">💰</span>
                <span className="text-white font-semibold text-sm sm:text-base">$B2S Token</span>
              </div>
              <div className="hidden sm:block h-8 w-px bg-white/20"></div>
              <div className="text-white/70 text-sm sm:text-base">
                <span className="text-white font-semibold">1B</span> Total Supply
              </div>
              <div className="hidden sm:block h-8 w-px bg-white/20"></div>
              <div className="text-white/70 text-sm sm:text-base">
                <span className="text-white font-semibold">400M</span> Community Pool
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-8 sm:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {[
            { label: 'Bridges Tracked', value: '1,247', color: 'from-blue-500 to-cyan-500', emoji: '🌉' },
            { label: 'Active Trackers', value: '89', color: 'from-orange-500 to-red-500', emoji: '👥' },
            { label: '$B2S Distributed', value: '156K', color: 'from-green-500 to-emerald-500', emoji: '🏆' },
            { label: '$B2S Staked', value: '2.3M', color: 'from-purple-500 to-pink-500', emoji: '📈' }
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-white/10 text-center hover:bg-white/10 transition-all hover:transform hover:scale-105">
              <div className="text-2xl sm:text-3xl mb-2">{stat.emoji}</div>
              <div className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1 sm:mb-2`}>
                {stat.value}
              </div>
              <p className="text-white/60 text-xs sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-8 sm:py-16">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-8 sm:mb-12">
          How It Works
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {[
            { 
              num: '1', 
              title: 'Track Bridges', 
              desc: 'Submit bridge transactions between Base and Stacks networks for verification',
              gradient: 'from-blue-500 to-cyan-500',
              emoji: '🔍'
            },
            { 
              num: '2', 
              title: 'Earn Rewards', 
              desc: 'Get verified and receive $B2S tokens. Plus daily claim bonuses!',
              gradient: 'from-orange-500 to-red-500',
              emoji: '💰'
            },
            { 
              num: '3', 
              title: 'Stake & Govern', 
              desc: 'Stake your $B2S to earn staking rewards and participate in governance',
              gradient: 'from-purple-500 to-pink-500',
              emoji: '🗳️'
            }
          ].map((step, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all text-center group cursor-pointer">
              <div className="text-4xl mb-4">{step.emoji}</div>
              <div className={`w-16 h-16 bg-gradient-to-r ${step.gradient} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                <span className="text-2xl font-bold text-white">{step.num}</span>
              </div>
              <h4 className="text-lg sm:text-xl font-semibold text-white mb-3">{step.title}</h4>
              <p className="text-white/60 text-sm sm:text-base">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-8 sm:py-20">
        <div className="bg-gradient-to-r from-b2s-primary to-b2s-accent rounded-2xl p-6 sm:p-12 text-center max-w-3xl mx-auto shadow-2xl">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            Ready to Start Earning?
          </h3>
          <p className="text-white/90 text-sm sm:text-lg mb-6 sm:mb-8">
            Join the Base2Stacks community and start tracking cross-chain bridges today
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button 
              onClick={() => setIsConnected(!isConnected)}
              className="w-full sm:w-auto bg-white text-b2s-secondary px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-white/90 transition-all transform hover:scale-105 shadow-lg"
            >
              Connect Wallet & Start
            </button>
            <a
              href="https://github.com/wkalidev/base2stacks-tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-white/10 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold border border-white/30 hover:bg-white/20 transition-all backdrop-blur-sm text-center"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Footer avec LOGO */}
      <footer className="container mx-auto px-4 py-8 sm:py-12 border-t border-white/10 mt-8 sm:mt-16">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center space-x-3">
            <img 
              src="/android-chrome-192x192.png" 
              alt="Base2Stacks Logo" 
              className="w-8 h-8 sm:w-10 sm:h-10"
            />
            <span className="text-white font-semibold text-sm sm:text-base">Base2Stacks Tracker</span>
          </div>
          
          <p className="text-white/60 text-xs sm:text-sm">
            Built with ❤️ by <span className="text-b2s-accent font-semibold">Zcodebase</span> for Stacks Builder Rewards
          </p>

          <div className="flex items-center gap-4 sm:gap-6">
            <a 
              href="https://github.com/wkalidev/base2stacks-tracker" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white text-xs sm:text-sm transition-colors"
            >
              GitHub
            </a>
            <a 
              href="https://twitter.com/willycodexwar" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white text-xs sm:text-sm transition-colors"
            >
              Twitter
            </a>
            <a 
              href="https://github.com/wkalidev/base2stacks-tracker#readme" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white text-xs sm:text-sm transition-colors"
            >
              Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}