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
export async function fetchAmisByDateRange(
  start: string,
  end: string
): Promise<AmisRow[]> {
  try {
    console.log(`[AMIS] 抓取資料範圍: ${start} ~ ${end}`);

    // 轉換日期格式 (YYYY-MM-DD -> 民國年.MM.DD)
    const formatDateForAPI = (dateStr: string) => {
      const [year, month, day] = dateStr.split("-");
      const rocYear = parseInt(year) - 1911; // 西元年轉民國年
      return `${rocYear}.${month}.${day}`;
    };

    const startDateFormatted = formatDateForAPI(start);
    const endDateFormatted = formatDateForAPI(end);

    // 農業部 API 端點
    const apiUrl = "https://data.moa.gov.tw/api/v1/AgriProductsTransType/";

    // 構建查詢參數
    const params = new URLSearchParams({
      Start_time: startDateFormatted,
      End_time: endDateFormatted,
      // 不指定特定市場和作物，獲取所有資料
    });

    const fullUrl = `${apiUrl}?${params.toString()}`;
    console.log(`[AMIS] API 請求 URL: ${fullUrl}`);

    // 發送 API 請求
    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      // 設定超時時間
      signal: AbortSignal.timeout(30000), // 30秒超時
    });

    if (!response.ok) {
      throw new Error(
        `API 請求失敗: ${response.status} ${response.statusText}`
      );
    }

    // 解析 JSON 資料
    const rawData = await response.json();

    console.log(
      `[AMIS] 收到 ${
        Array.isArray(rawData.Data) ? rawData.Data.length : 0
      } 筆原始資料`
    );

    // 轉換資料格式
    const amisData: AmisRow[] = [];

    if (Array.isArray(rawData.Data)) {
      for (const item of rawData.Data) {
        // 驗證必要欄位
        if (
          item.TransDate &&
          item.MarketName &&
          item.CropName &&
          item.Avg_Price &&
          item.Trans_Quantity
        ) {
          amisData.push({
            market: item.MarketName,
            cropCode: item.CropCode,
            cropName: item.CropName,
            tradeDate: formatDateFromAPI(item.TransDate),
            price: parseFloat(item.Avg_Price) || 0,
            volume: parseInt(item.Trans_Quantity) || 0,
            unit: "公斤",
          });
        }
      }
    }

    console.log(`[AMIS] 成功轉換 ${amisData.length} 筆有效資料`);
    return amisData;
  } catch (error) {
    console.error("[AMIS] 抓取資料失敗:", error);

    // 如果 API 失敗，回傳空陣列而不是拋出錯誤
    // 這樣系統可以繼續運行，只是沒有新資料
    console.warn("[AMIS] API 失敗，回傳空資料");
    return [];
  }
}

/**
 * 從作物名稱生成作物代碼
 */
function generateCropCode(cropName: string): string {
  // 簡化的作物代碼映射
  const cropCodeMap: Record<string, string> = {
    甘藍: "C001",
    高麗菜: "C001",
    青江菜: "C002",
    小白菜: "C008",
    番茄: "C003",
    香蕉: "C004",
    馬鈴薯: "C005",
    洋蔥: "C006",
    蘋果: "C007",
    玉米: "C009",
    菠菜: "C010",
    蘿蔔: "C021",
    胡蘿蔔: "C022",
    地瓜: "C024",
    芋頭: "C025",
    小黃瓜: "C036",
    大黃瓜: "C037",
    苦瓜: "C038",
    絲瓜: "C039",
    冬瓜: "C040",
    南瓜: "C041",
    茄子: "C042",
    青椒: "C044",
    甜椒: "C045",
    鳳梨: "F002",
    芒果: "F003",
    木瓜: "F004",
    西瓜: "F005",
    哈密瓜: "F006",
    香瓜: "F007",
    葡萄: "F008",
    梨子: "F010",
    橘子: "F011",
    柳丁: "F012",
    檸檬: "F013",
    草莓: "F014",
    蓮霧: "F015",
    芭樂: "F016",
    荔枝: "F017",
    龍眼: "F018",
    奇異果: "F019",
    火龍果: "F020",
  };

  return cropCodeMap[cropName] || `UNKNOWN_${cropName.replace(/\s+/g, "_")}`;
}

/**
 * 將 API 回傳的日期格式轉換為標準格式
 */
function formatDateFromAPI(apiDate: string): string {
  try {
    // API 回傳的日期格式可能是 "114.1.15" (民國年) 或 "2025/1/15" (西元年)
    let date: Date;

    if (apiDate.includes(".")) {
      // 民國年格式: "114.1.15"
      const [rocYear, month, day] = apiDate.split(".");
      const adYear = parseInt(rocYear) + 1911; // 民國年轉西元年
      date = new Date(adYear, parseInt(month) - 1, parseInt(day));
    } else {
      // 西元年格式: "2025/1/15" 或 "2025-01-15"
      date = new Date(apiDate);
    }

    return date.toISOString().split("T")[0];
  } catch (error) {
    console.warn(`[AMIS] 日期格式轉換失敗: ${apiDate}`);
    return new Date().toISOString().split("T")[0];
  }
}

/**
 * 驗證 AMIS 資料格式
 */
export function validateAmisRow(row: any): row is AmisRow {
  return (
    typeof row === "object" &&
    typeof row.market === "string" &&
    typeof row.cropCode === "string" &&
    typeof row.cropName === "string" &&
    typeof row.tradeDate === "string" &&
    typeof row.price === "number" &&
    typeof row.volume === "number" &&
    typeof row.unit === "string"
  );
}
