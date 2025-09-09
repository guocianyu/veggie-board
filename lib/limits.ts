/**
 * 限流常數配置
 */
export const SOFT_CAP = 45; // 達到即顯示等候頁
export const HARD_CAP = 60; // 超過拒絕加入
export const PRESENCE_CHANNEL = 'presence:vb-online';

// 重試間隔（毫秒）
export const RETRY_INTERVAL = 30000; // 30 秒
export const CHECK_INTERVAL = 15000; // 15 秒

// API 保護係數
export const API_BUFFER = 5; // 硬上限 + 5 作為 API 保護
export const RETRY_AFTER = 20; // 秒
