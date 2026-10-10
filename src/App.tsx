import React, { useState, useEffect } from 'react';
import { PhoneNumberCard, PlayerUpgrades, PlayerStats, TelegramUserData } from './types/game';
import { initTelegramWebApp, triggerHaptic } from './utils/telegram';
import { sound } from './utils/audio';
import { calculateCoinsPerSec, calculateOfflineEarnings } from './utils/afkFarm';
import { Header } from './components/Header';
import { GachaWheel } from './components/GachaWheel';
import { CollectionTab } from './components/CollectionTab';
import { UpgradesTab } from './components/UpgradesTab';
import { OfflineRewardModal } from './components/OfflineRewardModal';
import { BotAutoSetupModal } from './components/BotAutoSetupModal';
import { StatsModal } from './components/StatsModal';
import { Sparkles, BookmarkPlus, Zap } from 'lucide-react';

const INITIAL_BALANCE = 50000; // 50 000 ₽ initial capital

const INITIAL_UPGRADES: PlayerUpgrades = {
  // Gacha Upgrades
  luckLevel: 0,
  discountLevel: 0,
  cashbackLevel: 0,
  inventoryCapLevel: 0,
  pityGuaranteedLevel: 0,

  // AFK Telecom Upgrades
  towersLevel: 0,
  subscribersLevel: 0,
  datacenterLevel: 0,
  satelliteLevel: 0,
  multiplierLevel: 0,
};

const INITIAL_STATS: PlayerStats = {
  totalSpins: 0,
  totalSpent: 0,
  totalEarned: 0,
  totalAfkEarned: 0,
  highestPayout: 0,
  highestCard: null,
  countsByRarity: {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  },
  lastActiveTimestamp: Date.now(),
};

export default function App() {
  const [userData, setUserData] = useState<TelegramUserData>({
    id: 7770001,
    first_name: 'Игрок',
    username: 'lucky_sim',
  });

  const [activeTab, setActiveTab] = useState<'spin' | 'collection' | 'shop'>('spin');
  const [balance, setBalance] = useState<number>(INITIAL_BALANCE);
  const [collection, setCollection] = useState<PhoneNumberCard[]>([]);
  const [upgrades, setUpgrades] = useState<PlayerUpgrades>(INITIAL_UPGRADES);
  const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Offline earnings modal state
  const [offlineReward, setOfflineReward] = useState<{ secondsOffline: number; earned: number } | null>(null);

  // Modals
  const [showDocsModal, setShowDocsModal] = useState<boolean>(false);
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);

  // Calculate coins per second
  const coinsPerSec = calculateCoinsPerSec(upgrades);

  // Initialize Telegram WebApp & Load saved data
  useEffect(() => {
    const user = initTelegramWebApp();
    setUserData(user);
    setIsMuted(sound.getMuted());

    // Deep link query params support (e.g. ?tab=collection)
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'collection' || tabParam === 'shop' || tabParam === 'spin') {
      setActiveTab(tabParam);
    }

    try {
      const savedBalance = localStorage.getItem('sim_gacha_balance');
      if (savedBalance !== null) setBalance(Number(savedBalance));

      const savedCollection = localStorage.getItem('sim_gacha_collection');
      if (savedCollection) setCollection(JSON.parse(savedCollection));

      let loadedUpgrades = INITIAL_UPGRADES;
      const savedUpgrades = localStorage.getItem('sim_gacha_upgrades');
      if (savedUpgrades) {
        loadedUpgrades = { ...INITIAL_UPGRADES, ...JSON.parse(savedUpgrades) };
        setUpgrades(loadedUpgrades);
      }

      const savedStats = localStorage.getItem('sim_gacha_stats');
      if (savedStats) setStats(prev => ({ ...prev, ...JSON.parse(savedStats) }));

      // Check Offline AFK Earnings
      const lastActive = localStorage.getItem('sim_gacha_last_active');
      if (lastActive) {
        const secPerSec = calculateCoinsPerSec(loadedUpgrades);
        const offline = calculateOfflineEarnings(Number(lastActive), secPerSec);
        if (offline.earned >= 25) {
          setOfflineReward(offline);
        }
      }
    } catch {
      // Ignored
    }
  }, []);

  // Live AFK passive income interval (ticks every 1 second)
  useEffect(() => {
    if (coinsPerSec <= 0) return;
    const interval = setInterval(() => {
      setBalance(prev => prev + coinsPerSec);
      setStats(prev => ({
        ...prev,
        totalAfkEarned: (prev.totalAfkEarned || 0) + coinsPerSec,
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [coinsPerSec]);

  // Keep lastActive timestamp updated in localStorage
  useEffect(() => {
    const saveActiveTimer = setInterval(() => {
      localStorage.setItem('sim_gacha_last_active', String(Date.now()));
    }, 3000);
    return () => clearInterval(saveActiveTimer);
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('sim_gacha_balance', String(balance));
  }, [balance]);

  useEffect(() => {
    localStorage.setItem('sim_gacha_collection', JSON.stringify(collection));
  }, [collection]);

  useEffect(() => {
    localStorage.setItem('sim_gacha_upgrades', JSON.stringify(upgrades));
  }, [upgrades]);

  useEffect(() => {
    localStorage.setItem('sim_gacha_stats', JSON.stringify(stats));
  }, [stats]);

  // Dynamic values
  const maxInventory = 20 + upgrades.inventoryCapLevel * 10;
  const playerXP = stats.totalSpins * 15 + collection.length * 10 + Math.floor((stats.totalAfkEarned || 0) / 200);
  const playerLevel = Math.max(1, Math.floor(playerXP / 100) + 1);
  const xpProgress = playerXP % 100;

  // Handlers
  const handleSpinSuccess = (card: PhoneNumberCard, cost: number) => {
    setBalance(prev => Math.max(0, prev - cost));

    setStats(prev => {
      const isNewRecord = card.sellPrice > (prev.highestCard?.sellPrice || 0);
      return {
        ...prev,
        totalSpins: prev.totalSpins + 1,
        totalSpent: prev.totalSpent + cost,
        highestPayout: Math.max(prev.highestPayout, card.sellPrice),
        highestCard: isNewRecord ? card : prev.highestCard,
        countsByRarity: {
          ...prev.countsByRarity,
          [card.rarity]: (prev.countsByRarity[card.rarity] || 0) + 1,
        },
      };
    });
  };

  const handleSellCard = (card: PhoneNumberCard) => {
    setBalance(prev => prev + card.sellPrice);
    setCollection(prev => prev.filter(c => c.id !== card.id));
    setStats(prev => ({
      ...prev,
      totalEarned: prev.totalEarned + card.sellPrice,
    }));
  };

  const handleAddToCollection = (card: PhoneNumberCard) => {
    if (collection.length >= maxInventory) return;
    setCollection(prev => [card, ...prev]);
  };

  const handleSellAllCommons = () => {
    const commons = collection.filter(c => c.rarity === 'common' && !c.isFavorite);
    if (commons.length === 0) return;
    const earned = commons.reduce((sum, c) => sum + c.sellPrice, 0);
    setBalance(prev => prev + earned);
    setCollection(prev => prev.filter(c => c.rarity !== 'common' || c.isFavorite));
    setStats(prev => ({
      ...prev,
      totalEarned: prev.totalEarned + earned,
    }));
  };

  const handleToggleFavorite = (id: string) => {
    triggerHaptic('light');
    setCollection(prev =>
      prev.map(c => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c))
    );
  };

  const handleBuyUpgrade = (key: keyof PlayerUpgrades, cost: number) => {
    if (balance < cost) return;
    setBalance(prev => prev - cost);
    setUpgrades(prev => ({
      ...prev,
      [key]: prev[key] + 1,
    }));
  };

  const handleClaimBonus = (amount: number) => {
    setBalance(prev => prev + amount);
    setStats(prev => ({
      ...prev,
      claimedDailyBonusAt: Date.now(),
      totalEarned: prev.totalEarned + amount,
    }));
  };

  const handleClaimOffline = () => {
    if (!offlineReward) return;
    setBalance(prev => prev + offlineReward.earned);
    setStats(prev => ({
      ...prev,
      totalAfkEarned: (prev.totalAfkEarned || 0) + offlineReward.earned,
    }));
    setOfflineReward(null);
  };

  const handleToggleMute = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  };

  return (
    <div className="min-h-screen bg-[#0d0f12] text-slate-100 flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Mobile-First Header Bar */}
      <Header
        user={userData}
        balance={balance}
        luckLevel={upgrades.luckLevel}
        level={playerLevel}
        xpProgress={xpProgress}
        coinsPerSec={coinsPerSec}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenStats={() => setShowStatsModal(true)}
        onOpenShop={() => setActiveTab('shop')}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-md sm:max-w-xl w-full mx-auto px-3.5 pt-3 pb-24">
        {activeTab === 'spin' && (
          <GachaWheel
            balance={balance}
            luckLevel={upgrades.luckLevel}
            discountLevel={upgrades.discountLevel}
            cashbackLevel={upgrades.cashbackLevel}
            inventoryCount={collection.length}
            maxInventory={maxInventory}
            onSpinSuccess={handleSpinSuccess}
            onSellCard={handleSellCard}
            onAddToCollection={handleAddToCollection}
          />
        )}

        {activeTab === 'collection' && (
          <CollectionTab
            collection={collection}
            maxInventory={maxInventory}
            onSellCard={handleSellCard}
            onSellAllCommons={handleSellAllCommons}
            onToggleFavorite={handleToggleFavorite}
            onGoToSpin={() => setActiveTab('spin')}
          />
        )}

        {activeTab === 'shop' && (
          <UpgradesTab
            balance={balance}
            upgrades={upgrades}
            lastClaimedBonusAt={stats.claimedDailyBonusAt}
            onBuyUpgrade={handleBuyUpgrade}
            onClaimBonus={handleClaimBonus}
          />
        )}
      </main>

      {/* Fixed Bottom Mobile Tab Bar (Ergonomic Thumb-Zone) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d0f12]/95 backdrop-blur-md border-t border-slate-800/90 pb-safe">
        <div className="max-w-md mx-auto grid grid-cols-3 h-16 items-center px-2">
          {/* Tab 1: Spin */}
          <button
            onClick={() => {
              triggerHaptic('selection');
              sound.playClick();
              setActiveTab('spin');
            }}
            className={`flex flex-col items-center justify-center h-full transition-colors active:scale-95 ${
              activeTab === 'spin' ? 'text-emerald-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-5 h-5 mb-1" />
            <span className="text-[11px] tracking-tight">Номера</span>
          </button>

          {/* Tab 2: Collection */}
          <button
            onClick={() => {
              triggerHaptic('selection');
              sound.playClick();
              setActiveTab('collection');
            }}
            className={`flex flex-col items-center justify-center h-full relative transition-colors active:scale-95 ${
              activeTab === 'collection' ? 'text-emerald-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <BookmarkPlus className="w-5 h-5 mb-1" />
              {collection.length > 0 && (
                <span className="absolute -top-1 -right-2.5 bg-emerald-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full font-mono-numbers">
                  {collection.length}
                </span>
              )}
            </div>
            <span className="text-[11px] tracking-tight">SIM-карты</span>
          </button>

          {/* Tab 3: Business & Upgrades */}
          <button
            onClick={() => {
              triggerHaptic('selection');
              sound.playClick();
              setActiveTab('shop');
            }}
            className={`flex flex-col items-center justify-center h-full transition-colors active:scale-95 ${
              activeTab === 'shop' ? 'text-emerald-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Zap className="w-5 h-5 mb-1" />
              {coinsPerSec > 0 && (
                <div className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </div>
            <span className="text-[11px] tracking-tight">Бизнес</span>
          </button>
        </div>
      </nav>

      {/* Offline Earnings Reward Modal */}
      {offlineReward && (
        <OfflineRewardModal
          secondsOffline={offlineReward.secondsOffline}
          earnedAmount={offlineReward.earned}
          onClaim={handleClaimOffline}
        />
      )}

      {/* Stats & Profile Modal */}
      {showStatsModal && (
        <StatsModal
          stats={stats}
          balance={balance}
          onClose={() => setShowStatsModal(false)}
          onOpenAdminSetup={() => setShowDocsModal(true)}
        />
      )}

      {/* Optional Admin Bot Config Modal */}
      {showDocsModal && (
        <BotAutoSetupModal onClose={() => setShowDocsModal(false)} userId={userData.id} />
      )}
    </div>
  );
}
