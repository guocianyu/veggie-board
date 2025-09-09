import categoryMap from '@/aliases/category-map.json';

export type Group = 'veg' | 'fruit';

/**
 * 根據作物名稱判斷所屬群組
 * @param cropName 作物名稱
 * @returns 'fruit' 或 'veg'
 */
export function getGroup(cropName: string): Group {
  // 從 category-map.json 中查找對應的分類
  const category = categoryMap[cropName as keyof typeof categoryMap];
  
  // 如果分類是 'fruit'，則返回 'fruit'，否則一律視為 'veg'
  // 注意：番茄、西瓜等雖然在植物學上是水果，但在台灣菜市場習慣上歸類為蔬菜
  return category === 'fruit' ? 'fruit' : 'veg';
}

/**
 * 根據群組過濾作物列表
 * @param items 作物列表
 * @param group 群組類型
 * @returns 過濾後的作物列表
 */
export function filterByGroup<T extends { cropName: string }>(
  items: T[],
  group: 'all' | Group
): T[] {
  if (group === 'all') {
    return items;
  }
  
  return items.filter(item => getGroup(item.cropName) === group);
}

/**
 * 根據漲跌方向排序作物列表
 * @param items 作物列表
 * @param mode 排序模式
 * @returns 排序後的作物列表
 */
export function sortByDirection<T extends { dod: number }>(
  items: T[],
  mode: 'up' | 'down'
): T[] {
  return [...items].sort((a, b) => {
    if (mode === 'up') {
      // 漲幅：由大到小排序
      return b.dod - a.dod;
    } else {
      // 跌幅：由小到大排序（負數越小越靠前）
      return a.dod - b.dod;
    }
  });
}
