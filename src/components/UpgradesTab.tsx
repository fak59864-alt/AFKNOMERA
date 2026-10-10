import React, { useState, useEffect } from 'react';
import { PlayerUpgrades } from '../types/game';
import {
  calculateCoinsPerSec,
  AFK_BUSINESS_UPGRADES,
  GACHA_CORE_UPGRADES,
} from '../utils/afkFarm';
import {
  Radio,
  Users,
  Server,
  Satellite,
  Zap,
  Clover,
  Percent,
  TrendingUp,
  Layers,
  Gift,
  Check,
  Sparkles,
} from 'lucide-react';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/telegram';

interface UpgradesTabProps {
  balance: number;
  upgrades: PlayerUpgrades;
  lastClaimedBonusAt?: number;
  onBuyUpgrade: (key: keyof PlayerUpgrades, cost: number) => void;
  onClaimBonus: (amount: number) => void;
}

export const UpgradesTab: React.FC<UpgradesTabProps> = ({
  balance,
  upgrades,
  lastClaimedBonusAt,
  onBuyUpgrade,
  onClaimBonus,
}) => {
  const [subTab, setSubTab] = useState<'afk' | 'gacha'>('afk');
  const [bonusCooldown, setBonusCooldown] = useState<number>(0);

  const COOLDOWN_SEC = 4 * 60 * 60; // 4 hours

  useEffect(() => {
    const updateTime = () => {
      if (!lastClaimedBonusAt) {
        setBonusCooldown(0);
        return;
      }
      const elapsed = Math.floor((Date.now() - lastClaimedBonusAt) / 1000);
      const remaining = Math.max(0, COOLDOWN_SEC - elapsed);
      setBonusCooldown(remaining);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [lastClaimedBonusAt]);

  const formatTimer = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const coinsPerSec = calculateCoinsPerSec(upgrades);
  const coinsPerMin = coinsPerSec * 60;
  const coinsPerHour = coinsPerMin * 60;

  const renderIcon = (name: string) => {
    const props = { className: 'w-5 h-5 text-emerald-400' };
    switch (name) {
      case 'Radio':
        return <Radio {...props} />;
      case 'Users':
        return <Users {...props} />;
      case 'Server':
        return <Server {...props} />;
      case 'Satellite':
        return <Satellite {...props} />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'Clover':
        return <Clover className="w-5 h-5 text-emerald-400" />;
      case 'Percent':
        return <Percent className="w-5 h-5 text-sky-400" />;
      case 'TrendingUp':
        return <TrendingUp className="w-5 h-5 text-amber-400" />;
      case 'Layers':
        return <Layers className="w-5 h-5 text-purple-400" />;
      default:
        return <Sparkles {...props} />;
    }
  };

  return (
    <div className="space-y-4 pb-12 max-w-md sm:max-w-xl mx-auto">
      {/* Category Segmented Control */}
      <div className="grid grid-cols-2 p-1 bg-[#12151c] rounded-2xl border border-slate-800">
        <button
          onClick={() => {
            triggerHaptic('selection');
            sound.playClick();
            setSubTab('afk');
          }}
          className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
            subTab === 'afk'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>АФК Доход (+{coinsPerSec}/с)</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('selection');
            sound.playClick();
            setSubTab('gacha');
          }}
          className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
            subTab === 'gacha'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clover className="w-3.5 h-3.5" />
          <span>Удача и Рулетка</span>
        </button>
      </div>

      {/* AFK Overview KPI Banner */}
      {subTab === 'afk' && (
        <div className="bg-gradient-to-br from-emerald-950/40 via-[#141822] to-teal-950/30 border border-emerald-500/40 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-slate-200">Телеком-сеть работает</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">
              Авто-фарм 24/7
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2">
              <div className="text-[10px] text-slate-400">В секунду</div>
              <div className="text-sm font-black text-emerald-400 font-mono-numbers mt-0.5">
                +{coinsPerSec.toLocaleString()} ₽
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2">
              <div className="text-[10px] text-slate-400">В минуту</div>
              <div className="text-sm font-black text-slate-100 font-mono-numbers mt-0.5">
                +{coinsPerMin.toLocaleString()} ₽
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2">
              <div className="text-[10px] text-slate-400">В час</div>
              <div className="text-sm font-black text-amber-400 font-mono-numbers mt-0.5">
                +{coinsPerHour.toLocaleString()} ₽
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Free Grant Banner */}
      <div className="bg-[#141822] border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>Грант связиста</span>
              <span className="text-[11px] text-emerald-400 font-mono font-bold">+10 000 ₽</span>
            </div>
            <div className="text-[11px] text-slate-400">Пополнение капитала каждые 4 часа</div>
          </div>
        </div>

        <button
          onClick={() => {
            if (bonusCooldown === 0) {
              triggerHaptic('success');
              sound.playUpgrade();
              onClaimBonus(10000);
            }
          }}
          disabled={bonusCooldown > 0}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap active:scale-95 transition-all ${
            bonusCooldown === 0
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed font-mono-numbers text-[11px]'
          }`}
        >
          {bonusCooldown === 0 ? 'Забрать' : formatTimer(bonusCooldown)}
        </button>
      </div>

      {/* Upgrades List */}
      <div className="space-y-2.5">
        {(subTab === 'afk' ? AFK_BUSINESS_UPGRADES : GACHA_CORE_UPGRADES).map(item => {
          const currentLevel = (upgrades[item.id as keyof PlayerUpgrades] as number) || 0;
          const isMax = currentLevel >= item.maxLevel;
          const cost = isMax ? 0 : item.costFormula(currentLevel);
          const canAfford = balance >= cost;

          return (
            <div
              key={item.id}
              className="bg-[#141822] border border-slate-800/90 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-sm transition-colors hover:border-slate-700"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                  {renderIcon(item.iconName)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs sm:text-sm text-slate-100 truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                      Ур. {currentLevel}/{item.maxLevel}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {item.description}
                  </p>

                  <div className="text-[11px] font-bold text-emerald-400 font-mono-numbers mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{item.effectDescription(currentLevel)}</span>
                  </div>
                </div>
              </div>

              {/* Upgrade Button */}
              <div className="shrink-0">
                {isMax ? (
                  <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 text-xs font-bold flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>МАКС</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (canAfford) {
                        triggerHaptic('success');
                        sound.playUpgrade();
                        onBuyUpgrade(item.id as keyof PlayerUpgrades, cost);
                      } else {
                        triggerHaptic('error');
                      }
                    }}
                    disabled={!canAfford}
                    className={`px-3.5 py-2 rounded-xl font-bold text-xs flex flex-col items-center justify-center active:scale-95 transition-all ${
                      canAfford
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm'
                        : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>Улучшить</span>
                    <span className="font-mono-numbers text-[10px] opacity-90">
                      {cost.toLocaleString('ru-RU')} ₽
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
