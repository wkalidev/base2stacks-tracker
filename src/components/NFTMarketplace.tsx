'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';

interface Badge {
  id: number;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  image: string;
  description: string;
}

interface Listing {
  listingId: number;
  badge: Badge;
  seller: string;
  price: number;
  listedAt: number;
}

export default function NFTMarketplace() {
  const { address, isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState<'marketplace' | 'my-items'>('marketplace');
  const [listings, setListings] = useState<Listing[]>([]);
  const [myBadges, setMyBadges] = useState<Badge[]>([]);
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [sellPrice, setSellPrice] = useState('');

  // Mock data
  useEffect(() => {
    if (isConnected) {
      // Mock marketplace listings
      setListings([
        {
          listingId: 1,
          badge: {
            id: 1,
            name: 'Gold Staker',
            rarity: 'epic',
            image: '🥇',
            description: 'Stake 10,000+ $B2S tokens'
          },
          seller: 'ST1ABC...XYZ',
          price: 50,
          listedAt: Date.now() - 86400000
        },
        {
          listingId: 2,
          badge: {
            id: 2,
            name: 'Early Adopter',
            rarity: 'legendary',
            image: '🌟',
            description: 'Joined in first month'
          },
          seller: 'ST2DEF...123',
          price: 150,
          listedAt: Date.now() - 172800000
        },
        {
          listingId: 3,
          badge: {
            id: 3,
            name: 'Silver Staker',
            rarity: 'rare',
            image: '🥈',
            description: 'Stake 1,000+ $B2S tokens'
          },
          seller: 'ST3GHI...456',
          price: 25,
          listedAt: Date.now() - 259200000
        }
      ]);

      // Mock user badges
      setMyBadges([
        {
          id: 4,
          name: 'Bronze Staker',
          rarity: 'uncommon',
          image: '🥉',
          description: 'Stake 100+ $B2S tokens'
        },
        {
          id: 5,
          name: 'Active Trader',
          rarity: 'rare',
          image: '⚡',
          description: 'Complete 100+ transactions'
        }
      ]);
    }
  }, [isConnected]);

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'from-gray-500 to-gray-600',
      uncommon: 'from-green-500 to-emerald-600',
      rare: 'from-blue-500 to-cyan-600',
      epic: 'from-purple-500 to-pink-600',
      legendary: 'from-orange-500 to-red-600'
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

  const handleBuy = (listingId: number, price: number) => {
    alert(`Buying NFT #${listingId} for ${price} $B2S tokens!`);
  };

  const handleSell = () => {
    if (!selectedBadge || !sellPrice) return;
    alert(`Listing ${selectedBadge.name} for ${sellPrice} $B2S!`);
    setShowSellModal(false);
    setSellPrice('');
    setSelectedBadge(null);
  };

  if (!isConnected) {
    return (
      <div className="marketplace-container bg-white/5 backdrop-blur-md rounded-xl p-8 border border-white/10 text-center">
        <p className="text-white/70 text-lg">Connect your wallet to access the NFT Marketplace</p>
      </div>
    );
  }

  return (
    <div className="nft-marketplace">
      {/* Header */}
      <div className="marketplace-header mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">🛒 NFT Badge Marketplace</h2>
        <p className="text-white/60">Buy and sell achievement badges</p>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="stat bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10">
          <p className="text-white/60 text-xs mb-1">Total Volume</p>
          <p className="text-xl font-bold text-white">1,247 $B2S</p>
        </div>
        <div className="stat bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10">
          <p className="text-white/60 text-xs mb-1">Floor Price</p>
          <p className="text-xl font-bold text-white">15 $B2S</p>
        </div>
        <div className="stat bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10">
          <p className="text-white/60 text-xs mb-1">Total Sales</p>
          <p className="text-xl font-bold text-white">89</p>
        </div>
        <div className="stat bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10">
          <p className="text-white/60 text-xs mb-1">Active Listings</p>
          <p className="text-xl font-bold text-white">{listings.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs flex gap-4 mb-8 border-b border-white/10">
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`pb-3 px-4 font-semibold transition-all ${
            activeTab === 'marketplace'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-white/60 hover:text-white'
          }`}
        >
          🛍️ Marketplace
        </button>
        <button
          onClick={() => setActiveTab('my-items')}
          className={`pb-3 px-4 font-semibold transition-all ${
            activeTab === 'my-items'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-white/60 hover:text-white'
          }`}
        >
          🎒 My Items ({myBadges.length})
        </button>
      </div>

      {/* Marketplace Tab */}
      {activeTab === 'marketplace' && (
        <div className="marketplace-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div
              key={listing.listingId}
              className="nft-card bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all hover:transform hover:scale-105"
            >
              <div className={`badge-image text-6xl text-center mb-4 p-6 rounded-lg bg-gradient-to-br ${getRarityColor(listing.badge.rarity)}`}>
                {listing.badge.image}
              </div>
              
              <div className="badge-info mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold text-white">{listing.badge.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-semibold bg-gradient-to-r ${getRarityColor(listing.badge.rarity)} text-white`}>
                    {listing.badge.rarity.toUpperCase()}
                  </span>
                </div>
                <p className="text-white/60 text-sm mb-3">{listing.badge.description}</p>
                <p className="text-white/40 text-xs">Seller: {listing.seller}</p>
              </div>

              <div className="price-section bg-white/5 rounded-lg p-3 mb-4">
                <p className="text-white/60 text-xs mb-1">Price</p>
                <p className="text-2xl font-bold text-white">{listing.price} $B2S</p>
              </div>

              <button
                onClick={() => handleBuy(listing.listingId, listing.price)}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3 rounded-lg font-semibold transition-all"
              >
                💳 Buy Now
              </button>
            </div>
          ))}
        </div>
      )}

      {/* My Items Tab */}
      {activeTab === 'my-items' && (
        <div className="my-items-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myBadges.map((badge) => (
            <div
              key={badge.id}
              className="nft-card bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all"
            >
              <div className={`badge-image text-6xl text-center mb-4 p-6 rounded-lg bg-gradient-to-br ${getRarityColor(badge.rarity)}`}>
                {badge.image}
              </div>
              
              <div className="badge-info mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold text-white">{badge.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-semibold bg-gradient-to-r ${getRarityColor(badge.rarity)} text-white`}>
                    {badge.rarity.toUpperCase()}
                  </span>
                </div>
                <p className="text-white/60 text-sm">{badge.description}</p>
              </div>

              <button
                onClick={() => {
                  setSelectedBadge(badge);
                  setShowSellModal(true);
                }}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-all"
              >
                💰 Sell Item
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Sell Modal */}
      {showSellModal && selectedBadge && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-base-dark to-stacks-dark border border-white/20 rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-6">Sell {selectedBadge.name}</h3>
            
            <div className={`badge-preview text-6xl text-center mb-6 p-6 rounded-lg bg-gradient-to-br ${getRarityColor(selectedBadge.rarity)}`}>
              {selectedBadge.image}
            </div>

            <div className="mb-6">
              <label className="text-white/70 text-sm mb-2 block">Listing Price</label>
              <div className="relative">
                <input
                  type="number"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  placeholder="Enter price"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-green-500"
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60">$B2S</span>
              </div>
              <p className="text-white/40 text-xs mt-2">Platform fee: 2.5%</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSellModal(false);
                  setSelectedBadge(null);
                  setSellPrice('');
                }}
                className="flex-1 bg-white/10 text-white px-6 py-3 rounded-lg font-semibold border border-white/20 hover:bg-white/20 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSell}
                disabled={!sellPrice}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all"
              >
                List Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}