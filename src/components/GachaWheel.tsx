import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { PhoneNumberCard, RarityTier } from '../types/game';
import { rollPhoneNumber } from '../utils/numberGenerator';
import { RARITY_CONFIGS } from '../utils/rarityConfig';
import { SimCardView } from './SimCardView';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/telegram';
import { Sparkles, RefreshCw, BookmarkPlus, DollarSign, HelpCircle, Flame, Check } from 'lucide-react';

interface GachaWheelProps {
  balance: number;
  luckLevel: number;
  discountLevel: number;
  cashbackLevel: number;
  inventoryCount: number;
  maxInventory: number;
  onSpinSuccess: (card: PhoneNumberCard, cost: number) => void;
  onSellCard: (card: PhoneNumberCard) => void;
  onAddToCollection: (card: PhoneNumberCard) => void;
}

export const GachaWheel: React.FC<GachaWheelProps> = ({
  balance,
  luckLevel,
  discountLevel,
  cashbackLevel,
  inventoryCount,
  maxInventory,
  onSpinSuccess,
  onSellCard,
  onAddToCollection,
}) => {
  // Multipliers: x1, x5, x10
  const [multiplier, setMultiplier] = useState<1 | 5 | 10>(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentCard, setCurrentCard] = useState<PhoneNumberCard | null>(null);
  const [autoSellCommon, setAutoSellCommon] = useState<boolean>(false);
  const [autoSpin, setAutoSpin] = useState<boolean>(false);
  const [showOddsModal, setShowOddsModal] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Animated reel digits (7 digits for the tail)
  const [displayDigits, setDisplayDigits] = useState<string[]>(['7', '7', '7', '1', '2', '3', '4']);
  const [displayOperator, setDisplayOperator] = useState<string>('999');

  // Spin cost calculation with discount
  const baseCost = 1000;
  const discountRate = discountLevel * 0.05; // 5% discount per level
  const singleSpinCost = Math.round(baseCost * (1 - discountRate));
  const totalCost = singleSpinCost * multiplier;

  const canAfford = balance >= totalCost;
  const isInventoryFull = inventoryCount >= maxInventory;

  const intervalRef = useRef<number | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleStartSpin = () => {
    if (isSpinning) return;
    if (!canAfford) {
      triggerHaptic('error');
      setStatusMessage('Недостаточно средств на балансе!');
      setTimeout(() => setStatusMessage(null), 2500);
      return;
    }

    setIsSpinning(true);
    setStatusMessage(null);
    triggerHaptic('medium');
    sound.playClick();

    // Generate the rolled card for this spin
    const targetCard = rollPhoneNumber(totalCost, luckLevel, cashbackLevel);

    // Start reel rolling animation
    let counter = 0;
    const totalFrames = 18;
    const targetDigits = targetCard.rawTail.split('');
    const ops = ['999', '916', '926', '903', '977', '995'];

    intervalRef.current = window.setInterval(() => {
      counter++;
      sound.playReelTick(counter);
      triggerHaptic('selection');

      // Randomize visible reel digits
      setDisplayDigits(prev =>
        prev.map((_, idx) => {
          // Progressively lock in digits from left to right near the end
          if (counter > totalFrames - 7 + idx) {
            return targetDigits[idx];
          }
          return Math.floor(Math.random() * 10).toString();
        })
      );
      setDisplayOperator(ops[Math.floor(Math.random() * ops.length)]);

      if (counter >= totalFrames) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayDigits(targetDigits);
        setDisplayOperator(targetCard.operatorCode);
        finishSpin(targetCard);
      }
    }, 70);
  };

  const finishSpin = (card: PhoneNumberCard) => {
    setIsSpinning(false);
    setCurrentCard(card);
    onSpinSuccess(card, totalCost);

    // Sound and celebration based on rarity
    if (card.rarity === 'legendary') {
      sound.playWinLegendary();
      triggerHaptic('success');
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ec4899', '#a855f7', '#06b6d4', '#eab308'],
      });
    } else if (card.rarity === 'epic') {
      sound.playWinEpic();
      triggerHaptic('success');
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#eab308', '#facc15', '#fbbf24'],
      });
    } else if (card.rarity === 'rare') {
      sound.playWinRare();
      triggerHaptic('medium');
    } else {
      sound.playCoin();
      triggerHaptic('light');
    }

    // Auto-sell Common handling if user enabled
    if (autoSellCommon && card.rarity === 'common') {
      setTimeout(() => {
        onSellCard(card);
        setCurrentCard(null);
        setStatusMessage(`Авто-продано за ${card.sellPrice.toLocaleString('ru-RU')} ₽`);
        setTimeout(() => setStatusMessage(null), 2000);
      }, 500);
    }

    // Auto-spin loop if enabled
    if (autoSpin) {
      setTimeout(() => {
        if (!isSpinning) {
          handleStartSpin();
        }
      }, 950);
    }
  };

  return (
    <div className="space-y-4 pb-8 max-w-md sm:max-w-xl mx-auto">
      {/* Central Interactive SIM Reel Display */}
      <div className="bg-[#14171e] border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop effect */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Header of Reel Box: Title & Auto Toggles */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs uppercase tracking-wider text-slate-300 font-bold">
                Gacha SIM
              </span>
              <button
                onClick={() => setShowOddsModal(true)}
                className="text-slate-400 hover:text-emerald-400 transition-colors p-1"
                title="Посмотреть шансы редкостей"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile Toggles: Auto-spin & Auto-sell */}
            <div className="flex items-center gap-2.5">
              <label className="flex items-center gap-1 cursor-pointer text-[11px] text-slate-300">
                <input
                  type="checkbox"
                  checked={autoSpin}
                  onChange={e => setAutoSpin(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-6 h-3.5 rounded-full transition-colors relative ${
                    autoSpin ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                      autoSpin ? 'translate-x-3' : 'translate-x-0.5'
                    }`}
                  />
                </div>
                <span>Авто-крутка</span>
              </label>

              <label className="flex items-center gap-1 cursor-pointer text-[11px] text-slate-300">
                <input
                  type="checkbox"
                  checked={autoSellCommon}
                  onChange={e => setAutoSellCommon(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-6 h-3.5 rounded-full transition-colors relative ${
                    autoSellCommon ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                      autoSellCommon ? 'translate-x-3' : 'translate-x-0.5'
                    }`}
                  />
                </div>
                <span>Авто-Common</span>
              </label>
            </div>
          </div>

          {/* SIM Mechanical Reel Drums */}
          <div className="bg-[#0b0d11] border border-slate-800 rounded-2xl p-2.5 sm:p-4 my-2.5 shadow-inner">
            <div className="flex items-center justify-center gap-1 sm:gap-2 select-none">
              {/* Prefix: +7 (9XX) */}
              <div className="bg-[#12161f] border border-slate-700/80 rounded-xl px-1.5 sm:px-3 py-1.5 sm:py-3 text-xs sm:text-lg font-bold font-mono text-emerald-400 shrink-0">
                +7 ({displayOperator})
              </div>

              {/* 7 Animated Digits formatted XXX-XX-XX */}
              {/* Group 1: 3 digits */}
              <div className="flex items-center gap-0.5 sm:gap-1">
                {displayDigits.slice(0, 3).map((d, i) => (
                  <div
                    key={`d1-${i}`}
                    className={`w-7 sm:w-10 h-10 sm:h-14 rounded-lg sm:rounded-xl border flex items-center justify-center font-mono-numbers font-black text-base sm:text-2xl transition-all duration-100 ${
                      isSpinning
                        ? 'border-emerald-500/60 bg-emerald-950/20 text-emerald-300 scale-95'
                        : 'border-slate-700 bg-[#161a24] text-slate-100 shadow-sm'
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>

              <span className="text-slate-600 font-bold text-sm sm:text-lg">-</span>

              {/* Group 2: 2 digits */}
              <div className="flex items-center gap-0.5 sm:gap-1">
                {displayDigits.slice(3, 5).map((d, i) => (
                  <div
                    key={`d2-${i}`}
                    className={`w-7 sm:w-10 h-10 sm:h-14 rounded-lg sm:rounded-xl border flex items-center justify-center font-mono-numbers font-black text-base sm:text-2xl transition-all duration-100 ${
                      isSpinning
                        ? 'border-emerald-500/60 bg-emerald-950/20 text-emerald-300 scale-95'
                        : 'border-slate-700 bg-[#161a24] text-slate-100 shadow-sm'
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>

              <span className="text-slate-600 font-bold text-sm sm:text-lg">-</span>

              {/* Group 3: 2 digits */}
              <div className="flex items-center gap-0.5 sm:gap-1">
                {displayDigits.slice(5, 7).map((d, i) => (
                  <div
                    key={`d3-${i}`}
                    className={`w-7 sm:w-10 h-10 sm:h-14 rounded-lg sm:rounded-xl border flex items-center justify-center font-mono-numbers font-black text-base sm:text-2xl transition-all duration-100 ${
                      isSpinning
                        ? 'border-emerald-500/60 bg-emerald-950/20 text-emerald-300 scale-95'
                        : 'border-slate-700 bg-[#161a24] text-slate-100 shadow-sm'
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>
            </div>

            {/* Reel Status Subtitle */}
            <div className="mt-3 text-center text-xs text-slate-400 font-medium">
              {isSpinning ? (
                <span className="text-emerald-400 animate-pulse font-mono">Анализ паттернов и редкости...</span>
              ) : currentCard ? (
                <span>
                  Выпало: <strong className="text-slate-200">{RARITY_CONFIGS[currentCard.rarity].nameRu}</strong> (x{currentCard.multiplier.toFixed(1)})
                </span>
              ) : (
                <span>Нажмите «Крутить», чтобы сгенерировать номер</span>
              )}
            </div>
          </div>

          {/* Result Card preview if dropped and not spinning */}
          {currentCard && !isSpinning && (
            <div className="mt-4 mb-2 animate-in fade-in zoom-in-95 duration-200">
              <SimCardView card={currentCard} />

              {/* Actions with Dropped Number */}
              <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    sound.playCoin();
                    onSellCard(currentCard);
                    setCurrentCard(null);
                  }}
                  className="h-12 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Продать ({currentCard.sellPrice.toLocaleString('ru-RU')} ₽)</span>
                </button>

                <button
                  onClick={() => {
                    if (isInventoryFull) {
                      triggerHaptic('warning');
                      setStatusMessage('Коллекция переполнена! Улучшите слоты в магазине.');
                      setTimeout(() => setStatusMessage(null), 2500);
                      return;
                    }
                    triggerHaptic('success');
                    sound.playClick();
                    onAddToCollection(currentCard);
                    setCurrentCard(null);
                    setStatusMessage('Номер сохранен в «Мои SIM-карты»!');
                    setTimeout(() => setStatusMessage(null), 2000);
                  }}
                  className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <BookmarkPlus className="w-4 h-4 text-emerald-400" />
                  <span>В коллекцию ({inventoryCount}/{maxInventory})</span>
                </button>
              </div>
            </div>
          )}

          {/* Status Alert Toast */}
          {statusMessage && (
            <div className="mt-2 text-center text-xs font-medium text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 py-2 px-3 rounded-lg animate-in fade-in">
              {statusMessage}
            </div>
          )}

          {/* Controls: Multiplier & Big Spin CTA */}
          <div className="mt-5 space-y-3 pt-3 border-t border-slate-800/80">
            {/* Multiplier Segmented Selector */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400 font-medium">Множитель ставки:</span>
              <div className="flex items-center gap-1.5 p-1 bg-[#0b0d11] rounded-xl border border-slate-800">
                {([1, 5, 10] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => {
                      triggerHaptic('selection');
                      sound.playClick();
                      setMultiplier(m);
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      multiplier === m
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    х{m}
                  </button>
                ))}
              </div>
            </div>

            {/* Big Main Spin Button */}
            <button
              onClick={handleStartSpin}
              disabled={isSpinning}
              className={`w-full h-14 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${
                isSpinning
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : canAfford
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 glow-neon'
                  : 'bg-red-950/40 border border-red-500/40 text-red-300'
              }`}
            >
              <RefreshCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>
                {isSpinning
                  ? 'Крутится барабан...'
                  : canAfford
                  ? `Крутить за ${totalCost.toLocaleString('ru-RU')} ₽`
                  : `Недостаточно средств (${totalCost.toLocaleString('ru-RU')} ₽)`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Probability Odds Modal */}
      {showOddsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14171f] border border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                Шансы выпадения и коэффициенты
              </h3>
              <button
                onClick={() => setShowOddsModal(false)}
                className="text-slate-400 hover:text-slate-100 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {Object.values(RARITY_CONFIGS).map(cfg => {
                let currentChance = cfg.baseChance;
                if (cfg.id === 'legendary') currentChance += luckLevel * 0.3;
                if (cfg.id === 'epic') currentChance += luckLevel * 0.8;
                if (cfg.id === 'rare') currentChance += luckLevel * 1.5;
                if (cfg.id === 'common') currentChance -= luckLevel * 2.6;

                return (
                  <div
                    key={cfg.id}
                    className="p-2.5 rounded-xl border border-slate-800/80 bg-slate-900/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                      <span className="font-semibold text-slate-200">{cfg.nameRu}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-mono">
                        x{cfg.minMultiplier}–x{cfg.maxMultiplier}
                      </span>
                      <span className="font-bold font-mono-numbers text-emerald-400">
                        {currentChance.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-[11px] text-slate-400 leading-relaxed">
              * Улучшайте показатель Удачи в магазине, чтобы отнимать процент у Обычных номеров и увеличивать шанс на редкие, эпические и VIP-номера!
            </p>

            <button
              onClick={() => setShowOddsModal(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs"
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
