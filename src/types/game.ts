export type RarityTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface RarityConfig {
  id: RarityTier;
  nameRu: string;
  badgeRu: string;
  color: string;
  borderClass: string;
  bgGradient: string;
  glowClass: string;
  textColor: string;
  minMultiplier: number;
  maxMultiplier: number;
  baseChance: number; // in percent
}

export interface PhoneNumberCard {
  id: string;
  fullNumber: string; // e.g. +7 (999) 777-77-77
  tailFormatted: string; // 777-77-77
  rawTail: string; // 7777777
  operatorCode: string; // e.g. 999
  operatorName: string; // e.g. Т-Мобайл
  rarity: RarityTier;
  multiplier: number;
  sellPrice: number;
  spinCost: number;
  tags: string[];
  createdAt: number;
  isFavorite?: boolean;
}

export interface PlayerUpgrades {
  // Gacha Upgrades (10 levels each)
  luckLevel: number; // 0 to 10
  discountLevel: number; // 0 to 10
  cashbackLevel: number; // 0 to 10
  inventoryCapLevel: number; // 0 to 10
  pityGuaranteedLevel: number; // 0 to 5

  // AFK Idle Business Upgrades (15 & 10 levels)
  towersLevel: number; // Вышки 4G/5G (+5..+150 ₽/сек)
  subscribersLevel: number; // Абонентская сеть (+25..+500 ₽/сек)
  datacenterLevel: number; // Дата-центр SIM (+100..+2500 ₽/сек)
  satelliteLevel: number; // Спутниковая связь (+500..+10000 ₽/сек)
  multiplierLevel: number; // Оптимизация сети (x1.1 .. x2.5 ко всему доходу)
}

export interface PlayerStats {
  totalSpins: number;
  totalSpent: number;
  totalEarned: number;
  totalAfkEarned: number;
  highestPayout: number;
  highestCard: PhoneNumberCard | null;
  countsByRarity: Record<RarityTier, number>;
  claimedDailyBonusAt?: number;
  lastActiveTimestamp: number;
}

export interface TelegramUserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}
