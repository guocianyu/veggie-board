/**
 * AMIS 農業部開放資料抓取
 * 資料來源：https://amis.afa.gov.tw
 */

export interface AmisRow {
  market: string;
  cropCode: string;
  cropName: string;
  tradeDate: string;
  price: number;
  volume: number;
  unit: string;
}

/**
 * 抓取指定日期範圍的 AMIS 資料
 * @param start 開始日期 (YYYY-MM-DD)
 * @param end 結束日期 (YYYY-MM-DD)
 * @returns AMIS 原始資料陣列
 */
export async function fetchAmisByDateRange(start: string, end: string): Promise<AmisRow[]> {
  try {
    // TODO: 實作真實的 AMIS API 抓取
    // 目前先回傳 mock 資料，之後可替換為真實 API 呼叫
    
    console.log(`[AMIS] 抓取資料範圍: ${start} ~ ${end}`);
    
    // Mock 資料 - 模擬不同日期的價格變化
    const mockData: AmisRow[] = [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      // 模擬不同蔬果的價格資料
      const crops = [
        { code: 'C001', name: '高麗菜', basePrice: 25 },
        { code: 'C002', name: '青江菜', basePrice: 18 },
        { code: 'C003', name: '番茄', basePrice: 45 },
        { code: 'C004', name: '香蕉', basePrice: 33 },
        { code: 'C005', name: '馬鈴薯', basePrice: 29 },
        { code: 'C006', name: '洋蔥', basePrice: 22 },
        { code: 'C007', name: '蘋果', basePrice: 66 },
        { code: 'C008', name: '小白菜', basePrice: 17 },
        { code: 'C009', name: '玉米', basePrice: 35 },
        { code: 'C010', name: '菠菜', basePrice: 29 },
      ];
      
      crops.forEach(crop => {
        // 模擬價格波動 (±20%)
        const variation = (Math.random() - 0.5) * 0.4;
        const price = Math.round(crop.basePrice * (1 + variation) * 10) / 10;
        const volume = Math.round(Math.random() * 2000 + 500);
        
        mockData.push({
          market: '台北一',
          cropCode: crop.code,
          cropName: crop.name,
          tradeDate: dateStr,
          price,
          volume,
          unit: '公斤'
        });
      });
    }
    
    console.log(`[AMIS] 成功抓取 ${mockData.length} 筆資料`);
    return mockData;
    
  } catch (error) {
    console.error('[AMIS] 抓取資料失敗:', error);
    throw new Error(`AMIS 資料抓取失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}

/**
 * 驗證 AMIS 資料格式
 */
export function validateAmisRow(row: any): row is AmisRow {
  return (
    typeof row === 'object' &&
    typeof row.market === 'string' &&
    typeof row.cropCode === 'string' &&
    typeof row.cropName === 'string' &&
    typeof row.tradeDate === 'string' &&
    typeof row.price === 'number' &&
    typeof row.volume === 'number' &&
    typeof row.unit === 'string'
  );
}
