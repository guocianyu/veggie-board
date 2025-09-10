import { CropCategory, RetailCoefficients } from '@/types';
import { retailCoefficients } from './env';

// 載入類別對照表
const categoryMap: Record<string, CropCategory> = require('@/aliases/category-map.json');

/**
 * 根據作物名稱取得類別
 * @param cropName 作物名稱
 * @returns CropCategory
 */
export function getCategory(cropName: string): CropCategory {
  // 直接查詢對照表
  const category = categoryMap[cropName];
  
  if (category) {
    return category;
  }
  
  // 模糊匹配（處理可能的命名變體）
  const normalizedName = cropName
    .replace(/[（(].*?[）)]/g, '') // 移除括號內容
    .replace(/\s+/g, '') // 移除空格
    .toLowerCase();
  
  // 先過濾花卉類別
  if (normalizedName.includes('花') && 
      !normalizedName.includes('花椰菜') && 
      !normalizedName.includes('青花菜') &&
      !normalizedName.includes('韭菜花') &&
      !normalizedName.includes('花胡瓜') &&
      !normalizedName.includes('花蒲')) {
    return 'flower'; // 花卉類別，後續會被過濾掉
  }
  
  // 關鍵字匹配
  if (normalizedName.includes('菜') || normalizedName.includes('葉')) {
    return 'leafy';
  }
  
  if (normalizedName.includes('果') || 
      normalizedName.includes('瓜') || 
      normalizedName.includes('蕉') ||
      normalizedName.includes('莓') ||
      normalizedName.includes('桃') ||
      normalizedName.includes('李') ||
      normalizedName.includes('梨') ||
      normalizedName.includes('橙') ||
      normalizedName.includes('柑') ||
      normalizedName.includes('柚')) {
    return 'fruit';
  }
  
  if (normalizedName.includes('薯') || 
      normalizedName.includes('蔥') || 
      normalizedName.includes('蘿蔔') ||
      normalizedName.includes('薑') ||
      normalizedName.includes('蒜') ||
      normalizedName.includes('芋') ||
      normalizedName.includes('山藥') ||
      normalizedName.includes('地瓜') ||
      normalizedName.includes('蓮藕') ||
      normalizedName.includes('牛蒡')) {
    return 'root';
  }
  
  // 預設為其他類別
  return 'other';
}

/**
 * 估算零售價格
 * @param crop 作物資訊
 * @param wholesale 批發價格
 * @param coefs 自定義係數（可選）
 * @returns 估算的零售價格
 */
export function estimateRetailPrice(
  crop: { cropCode: string; cropName: string },
  wholesale: number,
  coefs?: Partial<RetailCoefficients>
): number {
  // 取得作物類別
  const category = getCategory(crop.cropName);
  
  // 使用自定義係數或預設係數
  const coefficients = {
    leafy: coefs?.leafy ?? retailCoefficients.leafy,
    fruit: coefs?.fruit ?? retailCoefficients.fruit,
    root: coefs?.root ?? retailCoefficients.root,
    other: coefs?.other ?? retailCoefficients.other,
  };
  
  // 計算零售價格
  const retailPrice = wholesale * (category === 'flower' ? 1.0 : coefficients[category as keyof RetailCoefficients]);
  
  // 四捨五入到小數點後一位
  return Math.round(retailPrice * 10) / 10;
}

/**
 * 取得類別係數
 * @param category 作物類別
 * @param coefs 自定義係數（可選）
 * @returns 係數值
 */
export function getCategoryCoefficient(
  category: CropCategory,
  coefs?: Partial<RetailCoefficients>
): number {
  const coefficients = {
    leafy: coefs?.leafy ?? retailCoefficients.leafy,
    fruit: coefs?.fruit ?? retailCoefficients.fruit,
    root: coefs?.root ?? retailCoefficients.root,
    other: coefs?.other ?? retailCoefficients.other,
  };
  
  return category === 'flower' ? 1.0 : coefficients[category as keyof RetailCoefficients];
}

/**
 * 取得類別中文名稱
 * @param category 作物類別
 * @returns 中文名稱
 */
export function getCategoryName(category: CropCategory): string {
  const names = {
    leafy: '葉菜類',
    fruit: '果菜類',
    root: '根莖類',
    other: '其他類',
    flower: '花卉類'
  };
  
  return names[category];
}

/**
 * 取得類別描述
 * @param category 作物類別
 * @returns 類別描述
 */
export function getCategoryDescription(category: CropCategory): string {
  const descriptions = {
    leafy: '葉菜類蔬菜，如高麗菜、青江菜等',
    fruit: '果菜類蔬果，如番茄、香蕉等',
    root: '根莖類蔬菜，如馬鈴薯、洋蔥等',
    other: '其他類蔬果，如玉米、豆類等',
    flower: '花卉類，如火鶴花、繡球花等'
  };
  
  return descriptions[category];
}

/**
 * 驗證零售價格估算的合理性
 * @param wholesale 批發價格
 * @param retail 零售價格
 * @param category 作物類別
 * @returns 是否合理
 */
export function validateRetailPrice(
  wholesale: number,
  retail: number,
  category: CropCategory
): boolean {
  const coefficient = getCategoryCoefficient(category);
  const expectedRetail = wholesale * coefficient;
  
  // 允許 20% 的誤差範圍
  const tolerance = 0.2;
  const minExpected = expectedRetail * (1 - tolerance);
  const maxExpected = expectedRetail * (1 + tolerance);
  
  return retail >= minExpected && retail <= maxExpected;
}

/**
 * 取得所有類別資訊
 * @returns 類別資訊陣列
 */
export function getAllCategories(): Array<{
  key: CropCategory;
  name: string;
  description: string;
  coefficient: number;
}> {
  return (['leafy', 'fruit', 'root', 'other'] as CropCategory[]).map(category => ({
    key: category,
    name: getCategoryName(category),
    description: getCategoryDescription(category),
    coefficient: getCategoryCoefficient(category)
  }));
}
