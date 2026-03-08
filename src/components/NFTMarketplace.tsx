'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';
import {
  callReadOnlyFunction, cvToJSON, uintCV, standardPrincipalCV,
  PostConditionMode, AnchorMode,
} from '@stacks/transactions';
import { openContractCall } from '@stacks/connect';
import { StacksMainnet } from '@stacks/network';

const network = new StacksMainnet();
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96';
const MARKETPLACE_CONTRACT = 'b2s-governance'; // adjust if you deploy a dedicated NFT marketplace contract
const HIRO_API = 'https://api.mainnet.hiro.so';
const DECIMALS = 1_000_000;

// Badge metadata derived from on-chain staking activity
// Rarity determined by staked amount thresholds
const BADGE_TIERS = [
  { name: 'Legendary Staker', minStake: 100_000, rarity: 'legendary' as const, image: '👑', description: 'Stake 100,000+ $B2S tokens' },
  { name: 'Epic Staker',      minStake: 10_000,  rarity: 'epic'      as const, image: '💎', description: 'Stake 10,000+ $B2S tokens' },
  { name: 'Rare Staker',      minStake: 1_000,   rarity: 'rare'      as const, image: '🔥', description: 'Stake 1,000+ $B2S tokens' },
  { name: 'Uncommon Staker',  minStake: 100,     rarity: 'uncommon'  as const, image: '⚡', description: 'Stake 100+ $B2S tokens' },
  { name: 'Common Staker',    minStake: 1,       rarity: 'common'    as const, image: '⭐', description: 'Any amount staked' },
];

type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

interface Badge {
  id: number;
  name: string;
  rarity: Rarity;
  image: string;
  description: string;
  earnedBy: string; // staker address
  stakedAmount: number;
}

interface Listing {
  listingId: number;
  badge: Badge;
  seller: string;
  price: number;
  listedAt: number; // block height
  txId: string;
}

interface MarketStats {
  totalVolume: number;
  floorPrice: number;
  totalSales: number;
  activeListings: number;
}

function getBadgeTier(stakedAmount: number) {
  return BADGE_TIERS.find(t => stakedAmount >= t.minStake) || BADGE_TIERS[BADGE_TIERS.length - 1];
}

function getRarityColor(rarity: Rarity) {
  const colors: Record<Rarity, string> = {
    common:    'from-gray-500 to-gray-600',
    uncommon:  'from-green-500 to-emerald-600',
    rare:      'from-blue-500 to-cyan-600',
    epic:      'from-purple-500 to-pink-600',
    legendary: 'from-orange-500 to-red-600',
  };
  return colors[rarity];
}

function getRarityBorder(rarity: Rarity) {
  const borders: Record<Rarity, string> = {
    common:    'border-gray-500/40',
    uncommon:  'border-green-500/40',
    rare:      'border-blue-500/40',
    epic:      'border-purple-500/40',
    legendary: 'border-orange-500/40',
  };
  return borders[rarity];
}

// Fetch stakers from b2s-staking-vault-v2 transactions
async function fetchStakerBadges(): Promise<Badge[]> {
  try {
    const res = await fetch(
      `${HIRO_API}/extended/v1/address/${CONTRACT_ADDRESS}.b2s-staking-vault-v2/transactions?limit=50`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return [];
    const data = await res.json();

    const stakers = new Map<string, number>();

    for (const tx of data.results || []) {
      if (
        tx.tx_type === 'contract_call' &&
        tx.contract_call?.function_name === 'stake' &&
        tx.tx_status === 'success'
      ) {
        const sender = tx.sender_address;
        const args = tx.contract_call?.function_args || [];
        const amount = args[0]?.repr ? parseInt(args[0].repr.replace('u', '')) / DECIMALS : 0;
        if (!stakers.has(sender) || stakers.get(sender)! < amount) {
          stakers.set(sender, amount);
        }
      }
    }

    const badges: Badge[] = Array.from(stakers.entries()).map(([address, amount], index) => {
      const tier = getBadgeTier(amount);
      return {
        id: index + 1,
        name: tier.name,
        rarity: tier.rarity,
        image: tier.image,
        description: tier.description,
        earnedBy: address,
        stakedAmount: amount,
      };
    });

    return badges;
  } catch {
    return [];
  }
}

// Fetch listings from b2s-governance or a dedicated marketplace contract transactions
async function fetchListings(allBadges: Badge[]): Promise<{ listings: Listing[]; stats: MarketStats }> {
  try {
    const res = await fetch(
      `${HIRO_API}/extended/v1/address/${CONTRACT_ADDRESS}.${MARKETPLACE_CONTRACT}/transactions?limit=50`,
      { headers: { Accept: 'application/json' } }
    );

    const stats: MarketStats = {
      totalVolume: 0,
      floorPrice: Infinity,
      totalSales: 0,
      activeListings: 0,
    };

    if (!res.ok) return { listings: [], stats: { ...stats, floorPrice: 0 } };
    const data = await res.json();

    const listingsMap = new Map<number, Listing>();
    const cancelledOrSold = new Set<number>();

    for (const tx of data.results || []) {
      if (tx.tx_type !== 'contract_call' || tx.tx_status !== 'success') continue;
      const fn = tx.contract_call?.function_name;
      const args = tx.contract_call?.function_args || [];

      if (fn === 'list-badge') {
        const listingId = args[0]?.repr ? parseInt(args[0].repr.replace('u', '')) : listingsMap.size + 1;
        const badgeId = args[1]?.repr ? parseInt(args[1].repr.replace('u', '')) : 0;
        const price = args[2]?.repr ? parseInt(args[2].repr.replace('u', '')) / DECIMALS : 0;
        const badge = allBadges.find(b => b.id === badgeId) || allBadges[0];

        if (badge) {
          listingsMap.set(listingId, {
            listingId,
            badge,
            seller: tx.sender_address,
            price,
            listedAt: tx.block_height || 0,
            txId: tx.tx_id,
          });
          if (price > 0 && price < stats.floorPrice) stats.floorPrice = price;
        }
      }

      if (fn === 'buy-badge' || fn === 'cancel-listing') {
        const listingId = args[0]?.repr ? parseInt(args[0].repr.replace('u', '')) : -1;
        if (listingId >= 0) {
          cancelledOrSold.add(listingId);
          if (fn === 'buy-badge') {
            const listing = listingsMap.get(listingId);
            if (listing) {
              stats.totalVolume += listing.price;
              stats.totalSales += 1;
            }
          }
        }
      }
    }

    const activeListings = Array.from(listingsMap.values()).filter(
      l => !cancelledOrSold.has(l.listingId)
    );

    stats.activeListings = activeListings.length;
    if (stats.floorPrice === Infinity) stats.floorPrice = 0;

    return { listings: activeListings, stats };
  } catch {
    return {
      listings: [],
      stats: { totalVolume: 0, floorPrice: 0, totalSales: 0, activeListings: 0 },
    };
  }
}

export default function NFTMarketplace() {
  const { address, isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState<'marketplace' | 'my-items'>('marketplace');
  const [listings, setListings] = useState<Listing[]>([]);
  const [myBadges, setMyBadges] = useState<Badge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [stats, setStats] = useState<MarketStats>({ totalVolume: 0, floorPrice: 0, totalSales: 0, activeListings: 0 });
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [sellPrice, setSellPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [txIds, setTxIds] = useState<Record<number, string>>({});
  const [buyingId, setBuyingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const badges = await fetchStakerBadges();
      setAllBadges(badges);

      const { listings: fetchedListings, stats: fetchedStats } = await fetchListings(badges);
      setListings(fetchedListings);
      setStats(fetchedStats);

      // My badges = badges earned by connected address
      if (address) {
        setMyBadges(badges.filter(b => b.earnedBy === address));
      }

      setLastUpdated(new Date());
    } catch {
      setError('Failed to load marketplace data');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 120_000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleBuy = async (listing: Listing) => {
    if (!address) return;
    setBuyingId(listing.listingId);
    try {
      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName: MARKETPLACE_CONTRACT,
        functionName: 'buy-badge',
        functionArgs: [uintCV(listing.listingId)],
        postConditionMode: PostConditionMode.Allow,
        anchorMode: AnchorMode.Any,
        onFinish: (data) => {
          setTxIds(prev => ({ ...prev, [listing.listingId]: data.txId }));
          setBuyingId(null);
          setTimeout(loadData, 5000);
        },
        onCancel: () => setBuyingId(null),
      });
    } catch {
      setBuyingId(null);
    }
  };

  const handleSell = async () => {
    if (!selectedBadge || !sellPrice || !address) return;
    try {
      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName: MARKETPLACE_CONTRACT,
        functionName: 'list-badge',
        functionArgs: [
          uintCV(listings.length + 1),
          uintCV(selectedBadge.id),
          uintCV(Math.floor(parseFloat(sellPrice) * DECIMALS)),
        ],
        postConditionMode: PostConditionMode.Allow,
        anchorMode: AnchorMode.Any,
        onFinish: () => {
          setShowSellModal(false);
          setSellPrice('');
          setSelectedBadge(null);
          setTimeout(loadData, 5000);
        },
        onCancel: () => {},
      });
    } catch (err) {
      console.error('List error:', err);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-8 border border-white/10 text-center">
        <p className="text-4xl mb-4">🛒</p>
        <p className="text-white font-semibold text-lg mb-2">Connect your wallet</p>
        <p className="text-white/50 text-sm">Connect to access the NFT Badge Marketplace</p>
      </div>
    );
  }

  return (
    <div className="nft-marketplace">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">🛒 NFT Badge Marketplace</h2>
          <div className="flex items-center gap-3">
            <p className="text-white/60">Buy and sell achievement badges — live on-chain</p>
            {lastUpdated && (
              <span className="text-white/30 text-xs">· {lastUpdated.toLocaleTimeString()}</span>
            )}
          </div>
        </div>
        <button
          onClick={loadData}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all"
        >
          🔄
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Volume', value: `${stats.totalVolume.toFixed(0)} $B2S` },
          { label: 'Floor Price',  value: stats.floorPrice > 0 ? `${stats.floorPrice} $B2S` : '—' },
          { label: 'Total Sales',  value: stats.totalSales.toString() },
          { label: 'Active Listings', value: stats.activeListings.toString() },
        ].map(s => (
          <div key={s.label} className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10">
            <p className="text-white/60 text-xs mb-1">{s.label}</p>
            <p className="text-xl font-bold text-white">{loading ? '...' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-white/10">
        {([
          { id: 'marketplace', label: '🛍️ Marketplace' },
          { id: 'my-items',    label: `🎒 My Badges (${myBadges.length})` },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-4 font-semibold transition-all ${
              activeTab === tab.id
                ? 'text-white border-b-2 border-blue-500'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-6 border border-white/10 animate-pulse">
              <div className="h-32 bg-white/10 rounded-lg mb-4" />
              <div className="h-5 bg-white/10 rounded w-2/3 mb-2" />
              <div className="h-4 bg-white/10 rounded w-1/2 mb-4" />
              <div className="h-10 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Marketplace Tab */}
      {!loading && activeTab === 'marketplace' && (
        <>
          {listings.length === 0 ? (
            <div className="text-center py-16 bg-white/5 rounded-xl border border-white/10">
              <p className="text-4xl mb-4">🏪</p>
              <p className="text-white font-semibold text-lg mb-2">No listings yet</p>
              <p className="text-white/50 text-sm">
                Earn badges by staking, then sell them here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map(listing => (
                <div
                  key={listing.listingId}
                  className={`bg-white/5 backdrop-blur-md rounded-xl p-6 border ${getRarityBorder(listing.badge.rarity)} hover:scale-[1.02] transition-all`}
                >
                  <div className={`text-6xl text-center mb-4 p-6 rounded-lg bg-gradient-to-br ${getRarityColor(listing.badge.rarity)}`}>
                    {listing.badge.image}
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-bold text-white">{listing.badge.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold bg-gradient-to-r ${getRarityColor(listing.badge.rarity)} text-white`}>
                        {listing.badge.rarity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-white/60 text-sm mb-2">{listing.badge.description}</p>
                    <a
                      href={`https://explorer.hiro.so/address/${listing.seller}?chain=mainnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/40 text-xs hover:text-white/60 font-mono"
                    >
                      {listing.seller.slice(0, 8)}...{listing.seller.slice(-4)}
                    </a>
                  </div>

                  <div className="bg-white/5 rounded-lg p-3 mb-4">
                    <p className="text-white/60 text-xs mb-1">Price</p>
                    <p className="text-2xl font-bold text-white">{listing.price} $B2S</p>
                  </div>

                  <button
                    onClick={() => handleBuy(listing)}
                    disabled={buyingId === listing.listingId || listing.seller === address}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all"
                  >
                    {buyingId === listing.listingId
                      ? '⏳ Buying...'
                      : listing.seller === address
                      ? '(Your listing)'
                      : '💳 Buy Now'}
                  </button>

                  {txIds[listing.listingId] && (
                    <div className="mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded text-xs">
                      <a
                        href={`https://explorer.hiro.so/txid/${txIds[listing.listingId]}?chain=mainnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:underline"
                      >
                        ✅ View on Explorer ↗
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* My Items Tab */}
      {!loading && activeTab === 'my-items' && (
        <>
          {myBadges.length === 0 ? (
            <div className="text-center py-16 bg-white/5 rounded-xl border border-white/10">
              <p className="text-4xl mb-4">🎒</p>
              <p className="text-white font-semibold text-lg mb-2">No badges yet</p>
              <p className="text-white/50 text-sm">
                Stake $B2S to earn achievement badges
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myBadges.map(badge => (
                <div
                  key={badge.id}
                  className={`bg-white/5 backdrop-blur-md rounded-xl p-6 border ${getRarityBorder(badge.rarity)} hover:scale-[1.01] transition-all`}
                >
                  <div className={`text-6xl text-center mb-4 p-6 rounded-lg bg-gradient-to-br ${getRarityColor(badge.rarity)}`}>
                    {badge.image}
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-bold text-white">{badge.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold bg-gradient-to-r ${getRarityColor(badge.rarity)} text-white`}>
                        {badge.rarity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-white/60 text-sm">{badge.description}</p>
                    <p className="text-white/30 text-xs mt-1">
                      {badge.stakedAmount.toLocaleString()} $B2S staked
                    </p>
                  </div>

                  <button
                    onClick={() => { setSelectedBadge(badge); setShowSellModal(true); }}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                  >
                    💰 List for Sale
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Sell Modal */}
      {showSellModal && selectedBadge && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-white/20 rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-2">List {selectedBadge.name}</h3>
            <p className="text-white/40 text-sm mb-6">Platform fee: 2.5%</p>

            <div className={`text-6xl text-center mb-6 p-6 rounded-lg bg-gradient-to-br ${getRarityColor(selectedBadge.rarity)}`}>
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
                  min="0"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-green-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 text-sm">$B2S</span>
              </div>
              {sellPrice && (
                <p className="text-white/40 text-xs mt-2">
                  You receive: {(parseFloat(sellPrice) * 0.975).toFixed(2)} $B2S after fees
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowSellModal(false); setSelectedBadge(null); setSellPrice(''); }}
                className="flex-1 bg-white/10 text-white px-6 py-3 rounded-lg font-semibold border border-white/20 hover:bg-white/20 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSell}
                disabled={!sellPrice || parseFloat(sellPrice) <= 0}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all"
              >
                List Item 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}