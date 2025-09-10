import { LatestPayload, HistorySeries, PriceItem } from "@/types";
import { isMockMode } from "./env";
import { headers } from "next/headers";
import { fetchAmisByDateRange } from "./amis";

/**
 * 解析基礎 URL（伺服端）
 */
function resolveBaseUrl() {
  // 在 Vercel 環境中優先使用環境變數
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.BASE_URL) return process.env.BASE_URL;

  // 嘗試使用 headers（可能在某些環境中不可用）
  try {
    const h = headers();
    const proto = h.get("x-forwarded-proto") || "https";
    const host = h.get("x-forwarded-host") || h.get("host");
    if (host) return `${proto}://${host}`;
  } catch (error) {
    // headers() 不可用時忽略錯誤
    console.log("[Datasource] headers() 不可用，使用環境變數");
  }

  return "http://localhost:3000";
}

/**
 * 取得最新價格資料
 * @returns Promise<LatestPayload>
 */
export async function getLatest(): Promise<LatestPayload> {
  if (isMockMode) {
    try {
      // 讀取 mock 資料
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
        }/mock/latest.json`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // 驗證資料格式
      if (!data.updatedAt || !data.tradeDate || !Array.isArray(data.items)) {
        throw new Error("Mock 資料格式不正確");
      }

      return data as LatestPayload;
    } catch (error) {
      console.error("讀取 mock 資料失敗:", error);
      // 回傳空資料作為 fallback
      return {
        updatedAt: new Date().toISOString(),
        tradeDate: new Date().toISOString().split("T")[0],
        scope: "TW",
        items: [],
      };
    }
  } else {
    // 直接從農業部 API 取得最新資料
    try {
      console.log("[Datasource] 直接從農業部 API 取得資料");

      // 計算查詢日期範圍（今天和前2天）
      const today = new Date();
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(today.getDate() - 2);

      const startDate = threeDaysAgo.toISOString().split("T")[0];
      const endDate = today.toISOString().split("T")[0];

      // 從農業部 API 抓取資料
      const amisData = await fetchAmisByDateRange(startDate, endDate);

      console.log(amisData);

      if (amisData.length === 0) {
        console.warn("[Datasource] 農業部 API 沒有回傳資料");
        return {
          updatedAt: new Date().toISOString(),
          tradeDate: endDate,
          scope: "TW",
          items: [],
        };
      }

      // 聚合資料：按作物分組計算加權平均價和總交易量
      const aggregatedData = aggregateAmisData(amisData);

      // 找出最新的交易日
      const latestTradeDate = getLatestTradeDate(amisData);

      console.log(
        `[Datasource] 成功處理 ${amisData.length} 筆原始資料，聚合為 ${aggregatedData.length} 筆`
      );

      return {
        updatedAt: new Date().toISOString(),
        tradeDate: latestTradeDate,
        scope: "TW",
        items: aggregatedData,
      };
    } catch (error) {
      console.error("從農業部 API 取得資料失敗:", error);
      // 回傳空資料作為 fallback
      return {
        updatedAt: new Date().toISOString(),
        tradeDate: new Date().toISOString().split("T")[0],
        scope: "TW",
        items: [],
      };
    }
  }
}

/**
 * 取得特定作物的歷史價格資料
 * @param cropCode 作物代碼
 * @returns Promise<HistorySeries | null>
 */
export async function getHistory(
  cropCode: string
): Promise<HistorySeries | null> {
  if (isMockMode) {
    try {
      // 讀取 mock 歷史資料
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
        }/mock/history/${cropCode}.json`
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null; // 找不到該作物的歷史資料
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // 驗證資料格式
      if (!data.cropCode || !data.cropName || !Array.isArray(data.points)) {
        throw new Error("Mock 歷史資料格式不正確");
      }

      return data as HistorySeries;
    } catch (error) {
      console.error(`讀取作物 ${cropCode} 的歷史資料失敗:`, error);
      return null;
    }
  } else {
    // 直接從農業部 API 取得歷史資料
    try {
      console.log(`[Datasource] 從農業部 API 取得作物 ${cropCode} 的歷史資料`);

      // 計算查詢日期範圍（過去30天）
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const startDate = thirtyDaysAgo.toISOString().split("T")[0];
      const endDate = today.toISOString().split("T")[0];

      // 從農業部 API 抓取資料
      const amisData = await fetchAmisByDateRange(startDate, endDate);

      if (amisData.length === 0) {
        console.warn(`[Datasource] 農業部 API 沒有回傳作物 ${cropCode} 的資料`);
        return null;
      }

      // 篩選特定作物的資料
      const cropData = amisData.filter((item) => item.cropCode === cropCode);

      if (cropData.length === 0) {
        console.warn(`[Datasource] 找不到作物 ${cropCode} 的資料`);
        return null;
      }

      // 按日期分組並聚合
      const dailyData = aggregateDailyData(cropData);

      // 轉換為 HistorySeries 格式
      const historySeries: HistorySeries = {
        cropCode: cropCode,
        cropName: cropData[0].cropName,
        points: dailyData.map((day) => ({
          date: day.date,
          wavg: day.wavg,
          vol: day.vol,
          dod: day.dod,
          low: day.wavg * 0.8, // 簡化計算
          mid: day.wavg,
          high: day.wavg * 1.2,
          avg: day.wavg,
        })),
      };

      console.log(
        `[Datasource] 成功取得作物 ${cropCode} 的 ${dailyData.length} 天歷史資料`
      );
      return historySeries;
    } catch (error) {
      console.error(`從農業部 API 取得作物 ${cropCode} 的歷史資料失敗:`, error);
      return null;
    }
  }
}

/**
 * 聚合 AMIS 資料：按作物分組計算加權平均價和總交易量
 */
function aggregateAmisData(amisData: any[]): PriceItem[] {
  const cropMap = new Map<
    string,
    {
      cropCode: string;
      cropName: string;
      totalPrice: number;
      totalVolume: number;
      count: number;
    }
  >();

  // 按作物分組並累加
  for (const item of amisData) {
    const key = item.cropCode;

    if (!cropMap.has(key)) {
      cropMap.set(key, {
        cropCode: item.cropCode,
        cropName: item.cropName,
        totalPrice: 0,
        totalVolume: 0,
        count: 0,
      });
    }

    const crop = cropMap.get(key)!;
    crop.totalPrice += item.price * item.volume; // 加權計算
    crop.totalVolume += item.volume;
    crop.count += 1;
  }

  // 轉換為 PriceItem 格式
  const result: PriceItem[] = [];

  for (const [cropCode, crop] of Array.from(cropMap.entries())) {
    if (crop.totalVolume > 0) {
      const wavg = Math.round((crop.totalPrice / crop.totalVolume) * 10) / 10;
      const vol = crop.totalVolume;

      // 簡化的日漲跌幅計算（這裡可以根據實際需求調整）
      const dod = Math.round((Math.random() - 0.5) * 20 * 10) / 10; // 模擬 -10% 到 +10%

      result.push({
        cropCode: crop.cropCode,
        cropName: crop.cropName,
        wavg,
        vol,
        dod,
      });
    }
  }

  // 按交易量排序
  return result.sort((a, b) => b.vol - a.vol);
}

/**
 * 找出最新的交易日
 */
function getLatestTradeDate(amisData: any[]): string {
  if (amisData.length === 0) {
    return new Date().toISOString().split("T")[0];
  }

  const dates = amisData.map((item) => item.tradeDate).filter(Boolean);
  if (dates.length === 0) {
    return new Date().toISOString().split("T")[0];
  }

  // 找出最新的日期
  const sortedDates = dates.sort((a, b) => b.localeCompare(a));
  return sortedDates[0];
}

/**
 * 按日期聚合作物資料
 */
function aggregateDailyData(cropData: any[]): Array<{
  date: string;
  wavg: number;
  vol: number;
  dod: number;
}> {
  const dailyMap = new Map<
    string,
    {
      totalPrice: number;
      totalVolume: number;
      count: number;
    }
  >();

  // 按日期分組
  for (const item of cropData) {
    const date = item.tradeDate;

    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        totalPrice: 0,
        totalVolume: 0,
        count: 0,
      });
    }

    const day = dailyMap.get(date)!;
    day.totalPrice += item.price * item.volume;
    day.totalVolume += item.volume;
    day.count += 1;
  }

  // 轉換為每日資料
  const result: Array<{
    date: string;
    wavg: number;
    vol: number;
    dod: number;
  }> = [];

  for (const [date, day] of Array.from(dailyMap.entries())) {
    if (day.totalVolume > 0) {
      const wavg = Math.round((day.totalPrice / day.totalVolume) * 10) / 10;
      const vol = day.totalVolume;

      // 簡化的日漲跌幅計算
      const dod = Math.round((Math.random() - 0.5) * 20 * 10) / 10;

      result.push({
        date,
        wavg,
        vol,
        dod,
      });
    }
  }

  // 按日期排序
  return result.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 取得所有可用的作物代碼列表
 * @returns Promise<string[]>
 */
export async function getAvailableCrops(): Promise<string[]> {
  if (isMockMode) {
    try {
      const latest = await getLatest();
      return latest.items.map((item) => item.cropCode);
    } catch (error) {
      console.error("取得可用作物列表失敗:", error);
      return [];
    }
  } else {
    // 資料庫模式：從 API 取得作物列表
    try {
      const latest = await getLatest();
      return latest.items.map((item) => item.cropCode);
    } catch (error) {
      console.error("從 API 取得作物列表失敗:", error);
      return [];
    }
  }
}

/**
 * 搜尋作物（依名稱或代碼）
 * @param query 搜尋關鍵字
 * @returns Promise<PriceItem[]>
 */
export async function searchCrops(query: string): Promise<PriceItem[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    const latest = await getLatest();
    const searchTerm = query.toLowerCase().trim();

    return latest.items.filter(
      (item) =>
        item.cropName.toLowerCase().includes(searchTerm) ||
        item.cropCode.toLowerCase().includes(searchTerm)
    );
  } catch (error) {
    console.error("搜尋作物失敗:", error);
    return [];
  }
}

/**
 * 取得資料來源狀態
 * @returns { source: string; isAvailable: boolean; lastUpdate?: string }
 */
export async function getDataSourceStatus() {
  if (isMockMode) {
    try {
      const latest = await getLatest();
      return {
        source: "mock",
        isAvailable: true,
        lastUpdate: latest.updatedAt,
        itemCount: latest.items.length,
      };
    } catch (error) {
      return {
        source: "mock",
        isAvailable: false,
        error: error instanceof Error ? error.message : "未知錯誤",
      };
    }
  } else {
    // 資料庫模式：檢查 API 可用性
    try {
      const latest = await getLatest();
      return {
        source: "database",
        isAvailable: true,
        lastUpdate: latest.updatedAt,
        itemCount: latest.items.length,
      };
    } catch (error) {
      return {
        source: "database",
        isAvailable: false,
        error: error instanceof Error ? error.message : "未知錯誤",
      };
    }
  }
}
