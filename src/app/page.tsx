'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { useContract } from '@/hooks/useContract'
import { useBalance } from '@/hooks/useBalance'
import { useToast } from '@/hooks/useToast'
import { TransactionHistory } from '@/components/TransactionHistory'
import { StakingStats } from '@/components/StakingStats'
import { LeaderboardAdvanced } from '@/components/LeaderboardAdvanced'
import { APYCalculator } from '@/components/APYCalculator'
import { ToastContainer } from '@/components/Toast'
import RewardsDistributor from '@/components/RewardsDistributor'
import GovernanceDAO from '@/components/GovernanceDAO'
import NFTMarketplace from '@/components/NFTMarketplace'
import LiquidityPool from '@/components/LiquidityPool'
import { TransactionToast, ErrorToast } from '@/components/TransactionToast'

export default function Page() {
  const { mounted, connect, disconnect, isConnected, address } = useWallet()
  const { claimDailyReward, stake, loading, error, txId } = useContract()
  const { balance, loading: balanceLoading } = useBalance(address)
  const { toasts, removeToast, success, error: showError } = useToast()
  
  const [stakeAmount, setStakeAmount] = useState('')
  const [showStakeModal, setShowStakeModal] = useState(false)
  const [showTxToast, setShowTxToast] = useState(false)
  const [showErrorToast, setShowErrorToast] = useState(false)

  // Watch for txId changes
  useEffect(() => {
    if (txId) {
      setShowTxToast(true)
      success('🎉 Transaction submitted successfully!')
    }
  }, [txId])

  // Watch for error changes
  useEffect(() => {
    if (error) {
      setShowErrorToast(true)
    }
  }, [error])

  // Évite les problèmes d'hydratation
  if (!mounted) {
    return null
  }

  const handleClaim = async () => {
    try {
      await claimDailyReward()
      // Toast will show automatically via txId
    } catch (err) {
      // Error toast will show automatically via error
      console.error(err)
    }
  }

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      showError('Please enter a valid amount')
      return
    }
    
    try {
      await stake(parseFloat(stakeAmount))
      setShowStakeModal(false)
      setStakeAmount('')
    } catch (err) {
      console.error(err)
    }
  }

  const shortAddress = (addr: string) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
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
          
          <div className="flex items-center gap-3">
            {isConnected && address && (
              <div className="hidden sm:block text-white/70 text-sm">
                {shortAddress(address)}
              </div>
            )}
            <button 
              onClick={isConnected ? disconnect : connect}
              className="bg-gradient-to-r from-b2s-primary to-b2s-accent text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:opacity-90 transition-all"
              disabled={loading}
            >
              {isConnected ? '🔓 Disconnect' : '🔒 Connect Wallet'}
            </button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-10 sm:py-20 text-center">
        <div className="max-w-4xl mx-auto">
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
            Connect your Stacks wallet to start earning rewards
          </p>
          
          {/* Action Buttons */}
          {isConnected ? (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <button 
                onClick={handleClaim}
                disabled={loading}
                className="w-full sm:w-auto bg-gradient-to-r from-b2s-primary to-b2s-accent text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:opacity-90 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                )}
                {loading ? 'Processing...' : '🎁 Claim Daily Reward (5 $B2S)'}
              </button>
              <button 
                onClick={() => setShowStakeModal(true)}
                className="w-full sm:w-auto bg-white/10 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold border border-white/20 hover:bg-white/20 transition-all"
              >
                💰 Stake $B2S
              </button>
            </div>
          ) : (
            <button 
              onClick={connect}
              className="w-full sm:w-auto bg-gradient-to-r from-b2s-primary to-b2s-accent text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:opacity-90 transition-all transform hover:scale-105 shadow-lg"
            >
              Connect Wallet to Start
            </button>
          )}

          {/* Wallet Info avec Balance */}
          {isConnected && address && (
            <div className="mt-8 sm:mt-12 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-blue-500/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-white/70 text-sm mb-1">Wallet Address</h3>
                  <div className="text-white font-mono text-sm break-all">
                    {address}
                  </div>
                </div>
                <div>
                  <h3 className="text-white/70 text-sm mb-1">$B2S Balance</h3>
                  <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                    {balanceLoading ? '⏳ Loading...' : `${balance.toFixed(2)} $B2S`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transaction History */}
          {isConnected && address && (
            <div className="mt-8 bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
              <h3 className="text-white font-semibold text-xl mb-4">Recent Transactions</h3>
              <TransactionHistory address={address} />
            </div>
          )}

          {/* Staking Stats */}
          {isConnected && address && (
            <div className="mt-8">
              <h3 className="text-white font-semibold text-2xl mb-4">Your Staking</h3>
              <StakingStats address={address} />
            </div>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-8 sm:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {[
            { label: 'Bridges Tracked', value: '1,247', emoji: '🌉' },
            { label: 'Active Trackers', value: '89', emoji: '👥' },
            { label: '$B2S Distributed', value: '156K', emoji: '🏆' },
            { label: '$B2S Staked', value: '2.3M', emoji: '📈' }
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-white/10 text-center hover:bg-white/10 transition-all">
              <div className="text-2xl sm:text-3xl mb-2">{stat.emoji}</div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-white/60 text-xs sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-8 sm:py-16">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-8 sm:mb-12">
          How It Works
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {[
            { num: '1', title: 'Connect Wallet', desc: 'Connect your Leather or Xverse wallet', emoji: '🔗' },
            { num: '2', title: 'Claim Rewards', desc: 'Claim 5 $B2S tokens daily', emoji: '💰' },
            { num: '3', title: 'Stake & Earn', desc: 'Stake tokens to earn more rewards', emoji: '📈' }
          ].map((step, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all text-center">
              <div className="text-4xl mb-4">{step.emoji}</div>
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">{step.num}</span>
              </div>
              <h4 className="text-lg sm:text-xl font-semibold text-white mb-3">{step.title}</h4>
              <p className="text-white/60 text-sm sm:text-base">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Leaderboard */}
      <section className="container mx-auto px-4 py-8 sm:py-16">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-8 sm:mb-12">
          🏆 Top Stakers
        </h3>
        <div className="max-w-4xl mx-auto">
          <LeaderboardAdvanced />
        </div>
      </section>

      {/* APY Calculator */}
      <section className="container mx-auto px-4 py-8 sm:py-16">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-8 sm:mb-12">
          📊 Calculate Your Earnings
        </h3>
        <div className="max-w-3xl mx-auto">
          <APYCalculator />
        </div>
      </section>

      {/* NEW: Rewards Distributor */}
      <section className="container mx-auto px-4 py-8 sm:py-16">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-8 sm:mb-12">
          💰 Rewards Distribution System
        </h3>
        <div className="max-w-5xl mx-auto">
          <RewardsDistributor />
        </div>
      </section>

      {/* Governance DAO */}
      <section className="container mx-auto px-4 py-8 sm:py-16">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-8 sm:mb-12">
          🏛️ Governance & Voting
        </h3>
        <div className="max-w-6xl mx-auto">
          <GovernanceDAO />
        </div>
      </section>

      {/* NFT Marketplace */}
      <section className="container mx-auto px-4 py-8 sm:py-16">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-8 sm:mb-12">
          🛒 NFT Badge Marketplace
        </h3>
        <div className="max-w-7xl mx-auto">
          <NFTMarketplace />
        </div>
      </section>
      
      {/* Liquidity Pool */}
      <section className="container mx-auto px-4 py-8 sm:py-16">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-8 sm:mb-12">
          💧 Liquidity Pool & Swap
        </h3>
        <div className="max-w-7xl mx-auto">
          <LiquidityPool />
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 sm:py-12 border-t border-white/10 mt-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center space-x-3">
            <img 
              src="/android-chrome-192x192.png" 
              alt="Base2Stacks Logo" 
              className="w-8 h-8"
            />
            <span className="text-white font-semibold text-sm sm:text-base">Base2Stacks Tracker</span>
          </div>
          
          <p className="text-white/60 text-xs sm:text-sm">
            Built with ❤️ by <span className="text-b2s-accent">Wkalidev(zcodebase)</span> | Testnet Version
          </p>

          <div className="flex items-center gap-4 sm:gap-6">
            <a href="https://github.com/wkalidev/base2stacks-tracker" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white text-xs sm:text-sm">
              GitHub
            </a>
            <a href="https://twitter.com/willycodexwar" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white text-xs sm:text-sm">
              Twitter
            </a>
            <a href="https://warpcast.com/willywarrior" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white text-xs sm:text-sm">
              Farcaster
            </a>
          </div>
        </div>
      </footer>

      {/* Staking Modal */}
      {showStakeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-base-dark to-stacks-dark border border-white/20 rounded-2xl p-6 sm:p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-4">Stake $B2S Tokens</h3>
            
            <div className="mb-6">
              <label className="text-white/70 text-sm mb-2 block">Amount to Stake</label>
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-b2s-accent"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowStakeModal(false)}
                className="flex-1 bg-white/10 text-white px-6 py-3 rounded-lg font-semibold border border-white/20 hover:bg-white/20 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleStake}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-b2s-primary to-b2s-accent text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              >
                {loading ? 'Staking...' : 'Stake'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Notifications */}
      {showTxToast && txId && (
        <TransactionToast 
          txId={txId} 
          onClose={() => setShowTxToast(false)} 
        />
      )}
      
      {showErrorToast && error && (
        <ErrorToast 
          error={error} 
          onClose={() => setShowErrorToast(false)} 
        />
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}