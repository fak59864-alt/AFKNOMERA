import { PlayerUpgrades } from '../types/game';

export interface AfkBusinessItem {
  id: keyof PlayerUpgrades;
  title: string;
  category: 'afk' | 'gacha';
  description: string;
  iconName: string;
  maxLevel: number;
  baseIncomePerSec: number;
  incomePerLevel: number;
  costFormula: (lvl: number) => number;
  effectDescription: (lvl: number) => string;
}

// Calculate passive coins per second (₽/сек)
export function calculateCoinsPerSec(upgrades: PlayerUpgrades): number {
  const towers = upgrades.towersLevel * 5;
  const subscribers = upgrades.subscribersLevel * 25;
  const datacenter = upgrades.datacenterLevel * 120;
  const satellite = upgrades.satelliteLevel * 600;

  const baseSum = towers + subscribers + datacenter + satellite;
  if (baseSum === 0) return 0;

  // Multiplier: +10% per level of network optimization
  const multiplier = 1 + (upgrades.multiplierLevel || 0) * 0.15;
  return Math.round(baseSum * multiplier);
}

// Calculate offline earnings based on elapsed time (up to 24 hours max)
export function calculateOfflineEarnings(
  lastTimestamp: number,
  coinsPerSec: number
): { secondsOffline: number; earned: number } {
  if (!lastTimestamp || coinsPerSec <= 0) return { secondsOffline: 0, earned: 0 };
  const now = Date.now();
  const elapsedSeconds = Math.max(0, Math.floor((now - lastTimestamp) / 1000));
  
  // Cap offline farm at 24 hours (86400 seconds)
  const cappedSeconds = Math.min(86400, elapsedSeconds);
  const earned = cappedSeconds * coinsPerSec;

  return {
    secondsOffline: elapsedSeconds,
    earned,
  };
}

// Business AFK upgrades list with 10–15 levels each
export const AFK_BUSINESS_UPGRADES: AfkBusinessItem[] = [
  {
    id: 'towersLevel',
    title: 'Вышки связи 4G/5G',
    category: 'afk',
    description: 'Установка базовых станций для обслуживания абонентов.',
    iconName: 'Radio',
    maxLevel: 15,
    baseIncomePerSec: 5,
    incomePerLevel: 5,
    costFormula: (lvl: number) => Math.round(2500 * Math.pow(1.35, lvl)),
    effectDescription: (lvl: number) => `+${lvl * 5} ₽/сек пассивного дохода`,
  },
  {
    id: 'subscribersLevel',
    title: 'Абонентская сеть',
    category: 'afk',
    description: 'Привлечение постоянных пользователей на безлимитные тарифы.',
    iconName: 'Users',
    maxLevel: 12,
    baseIncomePerSec: 25,
    incomePerLevel: 25,
    costFormula: (lvl: number) => Math.round(15000 * Math.pow(1.38, lvl)),
    effectDescription: (lvl: number) => `+${lvl * 25} ₽/сек пассивного дохода`,
  },
  {
    id: 'datacenterLevel',
    title: 'SIM Дата-центр',
    category: 'afk',
    description: 'Серверные стойки для мгновенной маршрутизации звонков и SMS.',
    iconName: 'Server',
    maxLevel: 10,
    baseIncomePerSec: 120,
    incomePerLevel: 120,
    costFormula: (lvl: number) => Math.round(75000 * Math.pow(1.42, lvl)),
    effectDescription: (lvl: number) => `+${lvl * 120} ₽/сек пассивного дохода`,
  },
  {
    id: 'satelliteLevel',
    title: 'Спутниковая группировка 6G',
    category: 'afk',
    description: 'Орбитальные спутники для глобального покрытия связью.',
    iconName: 'Satellite',
    maxLevel: 10,
    baseIncomePerSec: 600,
    incomePerLevel: 600,
    costFormula: (lvl: number) => Math.round(350000 * Math.pow(1.45, lvl)),
    effectDescription: (lvl: number) => `+${lvl * 600} ₽/сек пассивного дохода`,
  },
  {
    id: 'multiplierLevel',
    title: 'Оптимизация трафика AI',
    category: 'afk',
    description: 'ИИ-алгоритмы снижения задержек и повышения маржинальности сети.',
    iconName: 'Zap',
    maxLevel: 10,
    baseIncomePerSec: 0,
    incomePerLevel: 0,
    costFormula: (lvl: number) => Math.round(50000 * Math.pow(1.4, lvl)),
    effectDescription: (lvl: number) => `+${lvl * 15}% множитель всего АФК-дохода (x${(1 + lvl * 0.15).toFixed(2)})`,
  },
];

// Expanded Gacha upgrades with 10 levels each!
export const GACHA_CORE_UPGRADES = [
  {
    id: 'luckLevel' as const,
    title: 'Четырёхлистник удачи',
    category: 'gacha' as const,
    description: 'Существенно повышает шанс выпадения Серебряных, Золотых и VIP номеров.',
    iconName: 'Clover',
    maxLevel: 10,
    costFormula: (lvl: number) => Math.round(10000 * Math.pow(1.48, lvl)),
    effectDescription: (lvl: number) => `+${lvl * 12}% к базовому шансу редких номеров`,
  },
  {
    id: 'discountLevel' as const,
    title: 'Корпоративный дисконт',
    category: 'gacha' as const,
    description: 'Постоянная скидка на стоимость каждого прокрута рулетки.',
    iconName: 'Percent',
    maxLevel: 10,
    costFormula: (lvl: number) => Math.round(8000 * Math.pow(1.42, lvl)),
    effectDescription: (lvl: number) => `-${lvl * 5}% к цене прокрута (до -50%)`,
  },
  {
    id: 'cashbackLevel' as const,
    title: 'Золотой кэшбэк выкупа',
    category: 'gacha' as const,
    description: 'Увеличивает выплату при продаже выпавших или коллекционных номеров.',
    iconName: 'TrendingUp',
    maxLevel: 10,
    costFormula: (lvl: number) => Math.round(12000 * Math.pow(1.45, lvl)),
    effectDescription: (lvl: number) => `+${lvl * 8}% к стоимости выкупа номеров`,
  },
  {
    id: 'inventoryCapLevel' as const,
    title: 'Хранилище SIM-карт',
    category: 'gacha' as const,
    description: 'Расширяет вместимость личной коллекции SIM-карт в инвентаре.',
    iconName: 'Layers',
    maxLevel: 10,
    costFormula: (lvl: number) => Math.round(6000 * Math.pow(1.35, lvl)),
    effectDescription: (lvl: number) => `+${lvl * 10} слотов (Всего: ${20 + lvl * 10} SIM)`,
  },
];
