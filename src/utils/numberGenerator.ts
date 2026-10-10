import { PhoneNumberCard, RarityTier } from '../types/game';
import { OPERATORS, RARITY_CONFIGS } from './rarityConfig';

interface AnalysisResult {
  rarity: RarityTier;
  multiplier: number;
  tags: string[];
}

// Analyze any 7-digit tail string (e.g. "7777777")
export function analyzeTail(tail: string): AnalysisResult {
  const digits = tail.split('').map(Number);
  const tags: string[] = [];
  
  // 1. Check identical digits count
  const digitCounts: Record<string, number> = {};
  for (const d of digits) {
    digitCounts[d] = (digitCounts[d] || 0) + 1;
  }
  const maxIdentical = Math.max(...Object.values(digitCounts));
  const countsArr = Object.values(digitCounts).sort((a, b) => b - a);

  // Check 7 identical (e.g., 777-77-77)
  if (maxIdentical === 7) {
    const d = digits[0];
    if (d === 7) {
      tags.push('VIP: Три топора 777-77-77', 'Абсолютная удача');
      return { rarity: 'legendary', multiplier: 500, tags };
    }
    tags.push(`Супер-VIP: Все ${d}`, 'Абсолют');
    return { rarity: 'legendary', multiplier: 450, tags };
  }

  // Check 6 identical
  if (maxIdentical === 6) {
    tags.push('Шесть одинаковых цифр', 'VIP Эксклюзив');
    return { rarity: 'legendary', multiplier: 280, tags };
  }

  // Check 5 identical
  if (maxIdentical === 5) {
    tags.push('Пять одинаковых цифр', 'VIP Премиум');
    return { rarity: 'legendary', multiplier: 120, tags };
  }

  // Check round hundreds/thousands (000-00-XX, XX0-00-00, 000-XX-00)
  const isRoundHundreds =
    tail.startsWith('00000') ||
    tail.endsWith('00000') ||
    (tail.startsWith('000') && tail.endsWith('00')) ||
    (tail.slice(0, 3) === '000' && tail.slice(5) === '00');
  if (isRoundHundreds) {
    tags.push('Круглые сотни', 'VIP Нули');
    return { rarity: 'legendary', multiplier: 95, tags };
  }

  // Check 7-digit ladder ascending (e.g. 1234567, 2345678, 3456789)
  const isAscending7 = digits.every((d, i) => i === 0 || d === (digits[i - 1] + 1) % 10);
  if (isAscending7) {
    tags.push('Лесенка 7 цифр (123-45-67)', 'Королевский флеш');
    return { rarity: 'legendary', multiplier: 150, tags };
  }

  // Check 7-digit ladder descending (e.g. 7654321, 9876543)
  const isDescending7 = digits.every((d, i) => i === 0 || d === (digits[i - 1] - 1 + 10) % 10);
  if (isDescending7) {
    tags.push('Обратная лесенка 7 цифр', 'Королевский флеш');
    return { rarity: 'legendary', multiplier: 140, tags };
  }

  // Check 7-digit Palindrome (e.g. 1234321)
  const isPalindrome7 = tail === tail.split('').reverse().join('');
  if (isPalindrome7) {
    tags.push('Палиндром 7 цифр (Зеркало)', 'Золотой номер');
    return { rarity: 'epic', multiplier: 25, tags };
  }

  // Check consecutive 4 or 3 identical in a row
  let maxConsecutive = 1;
  let currentConsecutive = 1;
  let consecutiveDigit = digits[0];
  for (let i = 1; i < digits.length; i++) {
    if (digits[i] === digits[i - 1]) {
      currentConsecutive++;
      if (currentConsecutive > maxConsecutive) {
        maxConsecutive = currentConsecutive;
        consecutiveDigit = digits[i];
      }
    } else {
      currentConsecutive = 1;
    }
  }

  if (maxConsecutive === 4) {
    tags.push(`Каре: четыре ${consecutiveDigit} подряд`, 'Золотой триплет');
    return { rarity: 'epic', multiplier: 20, tags };
  }

  if (maxConsecutive === 3) {
    if (consecutiveDigit === 7) {
      tags.push('Три топора (777)', 'Счастливый триплет');
      return { rarity: 'epic', multiplier: 18, tags };
    }
    if (consecutiveDigit === 0) {
      tags.push('Три нуля (000)', 'Чистый номер');
      return { rarity: 'epic', multiplier: 15, tags };
    }
    tags.push(`Триплет: три ${consecutiveDigit}`, 'Счастливый триплет');
    return { rarity: 'epic', multiplier: 12, tags };
  }

  // Check 5 or 6 digit ladder sub-sequences
  const tailHasLadder5 =
    tail.includes('12345') ||
    tail.includes('23456') ||
    tail.includes('34567') ||
    tail.includes('45678') ||
    tail.includes('56789') ||
    tail.includes('54321') ||
    tail.includes('65432') ||
    tail.includes('76543') ||
    tail.includes('87654') ||
    tail.includes('98765');
  if (tailHasLadder5) {
    tags.push('Лесенка из 5 цифр', 'Серебряный');
    return { rarity: 'rare', multiplier: 4.5, tags };
  }

  // Check 5-digit palindrome in tail (e.g. 12321, 78987)
  const isPalindrome5 =
    tail.slice(0, 5) === tail.slice(0, 5).split('').reverse().join('') ||
    tail.slice(1, 6) === tail.slice(1, 6).split('').reverse().join('') ||
    tail.slice(2, 7) === tail.slice(2, 7).split('').reverse().join('');
  if (isPalindrome5) {
    tags.push('Палиндром x5', 'Серебряное зеркало');
    return { rarity: 'rare', multiplier: 3.8, tags };
  }

  // Check repetitive blocks e.g. AB-AB-AB (e.g. 12-12-12-X or X-12-12-12)
  const p1 = tail.slice(0, 2);
  const p2 = tail.slice(2, 4);
  const p3 = tail.slice(4, 6);
  if ((p1 === p2 && p2 === p3) || (tail.slice(1, 3) === tail.slice(3, 5) && tail.slice(3, 5) === tail.slice(5, 7))) {
    tags.push('Тройной повтор пар (AB-AB-AB)', 'Ритмичный');
    return { rarity: 'rare', multiplier: 4.2, tags };
  }

  // 4-digit ladder
  const tailHasLadder4 =
    tail.includes('1234') ||
    tail.includes('2345') ||
    tail.includes('3456') ||
    tail.includes('4567') ||
    tail.includes('5678') ||
    tail.includes('6789') ||
    tail.includes('4321') ||
    tail.includes('5432') ||
    tail.includes('6543') ||
    tail.includes('7654') ||
    tail.includes('8765') ||
    tail.includes('9876');
  if (tailHasLadder4) {
    tags.push('Лесенка x4 (12-34)', 'Серебряный');
    return { rarity: 'rare', multiplier: 2.5, tags };
  }

  // Check two pairs (e.g., 12-33-44 or 11-22-XX)
  const pairCounts = countsArr.filter(c => c >= 2).length;
  if (pairCounts >= 2) {
    tags.push('Две пары цифр', 'Бронзовый');
    return { rarity: 'uncommon', multiplier: 0.85, tags };
  }

  // Check mirror ending (e.g., 12-34-43)
  if (tail[3] === tail[6] && tail[4] === tail[5]) {
    tags.push('Зеркальное окончание', 'Бронзовый');
    return { rarity: 'uncommon', multiplier: 0.75, tags };
  }

  if (tail[5] === tail[6]) {
    tags.push('Пара в конце (XX)', 'Бронзовый');
    return { rarity: 'uncommon', multiplier: 0.6, tags };
  }

  // Common: standard random
  const randomMult = +(0.1 + Math.random() * 0.2).toFixed(2);
  tags.push('Обычный набор', 'Без выраженного паттерна');
  return { rarity: 'common', multiplier: randomMult, tags };
}

// Generate tail matching target rarity
function generateTailForRarity(rarity: RarityTier): string {
  const randDigit = () => Math.floor(Math.random() * 10);

  if (rarity === 'legendary') {
    const roll = Math.random();
    if (roll < 0.25) {
      // 7 identical
      const d = Math.random() < 0.4 ? 7 : randDigit();
      return `${d}${d}${d}${d}${d}${d}${d}`;
    } else if (roll < 0.5) {
      // 6 identical
      const d = Math.random() < 0.4 ? 7 : randDigit();
      const other = (d + 1 + Math.floor(Math.random() * 8)) % 10;
      return Math.random() < 0.5 ? `${other}${d}${d}${d}${d}${d}${d}` : `${d}${d}${d}${d}${d}${d}${other}`;
    } else if (roll < 0.75) {
      // Round hundreds 000-00-XX
      const r1 = randDigit();
      const r2 = randDigit();
      return `00000${r1}${r2}`;
    } else {
      // 7-ladder
      return Math.random() < 0.5 ? '1234567' : '9876543';
    }
  }

  if (rarity === 'epic') {
    const roll = Math.random();
    if (roll < 0.35) {
      // 7-digit Palindrome: a b c d c b a
      const a = randDigit();
      const b = randDigit();
      const c = randDigit();
      const d = randDigit();
      return `${a}${b}${c}${d}${c}${b}${a}`;
    } else if (roll < 0.7) {
      // 4 in a row or 777
      const d = Math.random() < 0.4 ? 7 : randDigit();
      const p1 = `${randDigit()}${randDigit()}`;
      const p2 = `${randDigit()}`;
      return `${d}${d}${d}${d}${p1}${p2}`;
    } else {
      // Triplet 777 at start or end
      const d = 7;
      return Math.random() < 0.5 ? `${d}${d}${d}${randDigit()}${randDigit()}${randDigit()}${randDigit()}` : `${randDigit()}${randDigit()}${randDigit()}${randDigit()}${d}${d}${d}`;
    }
  }

  if (rarity === 'rare') {
    const roll = Math.random();
    if (roll < 0.5) {
      // 5-ladder
      const ladders = ['12345', '23456', '34567', '45678', '56789', '98765', '76543'];
      const chosen = ladders[Math.floor(Math.random() * ladders.length)];
      return Math.random() < 0.5 ? `${chosen}${randDigit()}${randDigit()}` : `${randDigit()}${randDigit()}${chosen}`;
    } else {
      // Repetitive pairs e.g. 12-12-12-3
      const a = randDigit();
      const b = randDigit();
      return `${a}${b}${a}${b}${a}${b}${randDigit()}`;
    }
  }

  if (rarity === 'uncommon') {
    // Two pairs e.g. a-b-c-c-d-d
    const a = randDigit();
    const b = randDigit();
    const c = randDigit();
    const d = (c + 1) % 10;
    return `${a}${b}${c}${c}${d}${d}${randDigit()}`;
  }

  // Common: purely random digits avoiding obvious ladders/all identical
  let res = '';
  for (let i = 0; i < 7; i++) {
    res += randDigit();
  }
  return res;
}

// Format 7 digits as "XXX-XX-XX"
export function formatTail(tail: string): string {
  const clean = tail.replace(/\D/g, '').padEnd(7, '0').slice(0, 7);
  return `${clean.slice(0, 3)}-${clean.slice(3, 5)}-${clean.slice(5, 7)}`;
}

// Format complete number: +7 (9XX) XXX-XX-XX
export function formatFullPhoneNumber(operatorCode: string, tail: string): string {
  return `+7 (${operatorCode}) ${formatTail(tail)}`;
}

// Generate a full phone number card based on current luck level and base spin cost
export function rollPhoneNumber(
  baseSpinCost: number,
  luckLevel: number = 0,
  cashbackLevel: number = 0,
  forceRarity?: RarityTier
): PhoneNumberCard {
  // Select Operator
  const operator = OPERATORS[Math.floor(Math.random() * OPERATORS.length)];

  // Determine target rarity based on luck
  let targetRarity: RarityTier = 'common';
  if (forceRarity) {
    targetRarity = forceRarity;
  } else {
    // Luck adjustments:
    // Base: Common 70%, Uncommon 18%, Rare 8%, Epic 3.5%, Legendary 0.5%
    // Each luck level adds: Rare +1.5%, Epic +0.8%, Legendary +0.3%
    const legendaryChance = 0.5 + luckLevel * 0.3; // max lvl 5: 2.0%
    const epicChance = 3.5 + luckLevel * 0.8; // max lvl 5: 7.5%
    const rareChance = 8.0 + luckLevel * 1.5; // max lvl 5: 15.5%
    const uncommonChance = 18.0;
    
    const roll = Math.random() * 100;
    if (roll < legendaryChance) {
      targetRarity = 'legendary';
    } else if (roll < legendaryChance + epicChance) {
      targetRarity = 'epic';
    } else if (roll < legendaryChance + epicChance + rareChance) {
      targetRarity = 'rare';
    } else if (roll < legendaryChance + epicChance + rareChance + uncommonChance) {
      targetRarity = 'uncommon';
    } else {
      targetRarity = 'common';
    }
  }

  // Generate appropriate tail
  const rawTail = generateTailForRarity(targetRarity);
  const analysis = analyzeTail(rawTail);

  // If analyzed rarity differs slightly, prioritize best fit
  const finalRarity = analysis.rarity;
  const config = RARITY_CONFIGS[finalRarity];
  
  // Calculate multiplier within range
  let multiplier = analysis.multiplier;
  if (!multiplier) {
    const range = config.maxMultiplier - config.minMultiplier;
    multiplier = +(config.minMultiplier + Math.random() * range).toFixed(2);
  }

  // Calculate sell price: baseSpinCost * multiplier * (1 + cashbackBonus)
  const cashbackBonus = cashbackLevel * 0.08; // +8% per level
  const baseSell = Math.round(baseSpinCost * multiplier);
  const finalSellPrice = Math.round(baseSell * (1 + cashbackBonus));

  const tailFormatted = formatTail(rawTail);
  const fullNumber = formatFullPhoneNumber(operator.code, rawTail);

  return {
    id: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    fullNumber,
    tailFormatted,
    rawTail,
    operatorCode: operator.code,
    operatorName: operator.name,
    rarity: finalRarity,
    multiplier,
    sellPrice: finalSellPrice,
    spinCost: baseSpinCost,
    tags: analysis.tags,
    createdAt: Date.now(),
  };
}
