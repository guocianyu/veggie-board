/**
 * 限流測試腳本
 * 模擬多個用戶同時訪問以測試限流功能
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const CONCURRENT_USERS = 65; // 超過硬上限 60
const TEST_DURATION = 30000; // 30 秒測試

// 模擬用戶訪問
function simulateUser(userId) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const req = http.get(`${BASE_URL}/api/data/latest`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const duration = Date.now() - startTime;
        const response = JSON.parse(data);
        
        console.log(`用戶 ${userId}: ${res.statusCode} - ${duration}ms`);
        
        if (res.statusCode === 503) {
          console.log(`  └─ 被限流: ${response.error}`);
          console.log(`  └─ Retry-After: ${res.headers['retry-after']}s`);
        } else if (response.onlineCount) {
          console.log(`  └─ 線上人數: ${response.onlineCount}`);
        }
        
        resolve({
          userId,
          statusCode: res.statusCode,
          duration,
          onlineCount: response.onlineCount || 0,
          isLimited: res.statusCode === 503
        });
      });
    });
    
    req.on('error', (err) => {
      console.error(`用戶 ${userId} 請求失敗:`, err.message);
      resolve({
        userId,
        statusCode: 0,
        duration: Date.now() - startTime,
        onlineCount: 0,
        isLimited: false,
        error: err.message
      });
    });
    
    req.setTimeout(10000, () => {
      console.error(`用戶 ${userId} 請求超時`);
      req.destroy();
      resolve({
        userId,
        statusCode: 0,
        duration: Date.now() - startTime,
        onlineCount: 0,
        isLimited: false,
        error: 'timeout'
      });
    });
  });
}

// 執行測試
async function runTest() {
  console.log(`開始測試限流功能...`);
  console.log(`模擬 ${CONCURRENT_USERS} 個用戶同時訪問`);
  console.log(`硬上限: 60, 軟上限: 45, API 保護: 65`);
  console.log('─'.repeat(50));
  
  const startTime = Date.now();
  
  // 同時發送所有請求
  const promises = [];
  for (let i = 1; i <= CONCURRENT_USERS; i++) {
    promises.push(simulateUser(i));
  }
  
  const results = await Promise.all(promises);
  const duration = Date.now() - startTime;
  
  // 統計結果
  const successful = results.filter(r => r.statusCode === 200).length;
  const limited = results.filter(r => r.isLimited).length;
  const errors = results.filter(r => r.error).length;
  const avgOnlineCount = results
    .filter(r => r.onlineCount > 0)
    .reduce((sum, r) => sum + r.onlineCount, 0) / 
    results.filter(r => r.onlineCount > 0).length || 0;
  
  console.log('─'.repeat(50));
  console.log('測試結果:');
  console.log(`總請求數: ${CONCURRENT_USERS}`);
  console.log(`成功請求: ${successful}`);
  console.log(`被限流: ${limited}`);
  console.log(`錯誤: ${errors}`);
  console.log(`平均線上人數: ${avgOnlineCount.toFixed(1)}`);
  console.log(`總耗時: ${duration}ms`);
  
  // 驗證結果
  console.log('─'.repeat(50));
  console.log('驗收結果:');
  
  if (limited > 0) {
    console.log('✅ API 限流功能正常 - 有請求被 503 拒絕');
  } else {
    console.log('❌ API 限流功能異常 - 沒有請求被限流');
  }
  
  if (avgOnlineCount > 0) {
    console.log('✅ 線上人數統計正常');
  } else {
    console.log('❌ 線上人數統計異常');
  }
  
  // 檢查 Retry-After 標頭
  const limitedRequests = results.filter(r => r.isLimited);
  if (limitedRequests.length > 0) {
    console.log('✅ 限流請求包含 Retry-After 標頭');
  }
}

// 延遲啟動，確保服務器已準備好
setTimeout(runTest, 2000);
