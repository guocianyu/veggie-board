/**
 * 簡單限流測試腳本
 * 直接測試 API 限流功能
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

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
        let response;
        
        try {
          response = JSON.parse(data);
        } catch (e) {
          response = { error: 'Invalid JSON' };
        }
        
        console.log(`用戶 ${userId.toString().padStart(2, '0')}: ${res.statusCode} - ${duration}ms`);
        
        if (res.statusCode === 503) {
          console.log(`  └─ 被限流: ${response.error || 'Unknown error'}`);
          console.log(`  └─ Retry-After: ${res.headers['retry-after'] || 'N/A'}s`);
        } else if (response.onlineCount !== undefined) {
          console.log(`  └─ 線上人數: ${response.onlineCount}`);
        }
        
        resolve({
          userId,
          statusCode: res.statusCode,
          duration,
          onlineCount: response.onlineCount || 0,
          isLimited: res.statusCode === 503,
          retryAfter: res.headers['retry-after']
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
    
    req.setTimeout(5000, () => {
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

// 快速連續測試
async function runQuickTest() {
  console.log('開始快速限流測試...');
  console.log('硬上限: 60, 軟上限: 45, API 保護: 65');
  console.log('─'.repeat(50));
  
  // 快速連續發送 80 個請求
  const promises = [];
  for (let i = 1; i <= 80; i++) {
    promises.push(simulateUser(i));
    // 每 10 個請求間隔 10ms
    if (i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
  
  const results = await Promise.all(promises);
  
  // 統計結果
  const successful = results.filter(r => r.statusCode === 200).length;
  const limited = results.filter(r => r.isLimited).length;
  const errors = results.filter(r => r.error).length;
  const maxOnlineCount = Math.max(...results.map(r => r.onlineCount));
  const avgOnlineCount = results
    .filter(r => r.onlineCount > 0)
    .reduce((sum, r) => sum + r.onlineCount, 0) / 
    results.filter(r => r.onlineCount > 0).length || 0;
  
  console.log('─'.repeat(50));
  console.log('測試結果:');
  console.log(`總請求數: 80`);
  console.log(`成功請求: ${successful}`);
  console.log(`被限流: ${limited}`);
  console.log(`錯誤: ${errors}`);
  console.log(`最大線上人數: ${maxOnlineCount}`);
  console.log(`平均線上人數: ${avgOnlineCount.toFixed(1)}`);
  
  // 驗證結果
  console.log('─'.repeat(50));
  console.log('驗收結果:');
  
  if (limited > 0) {
    console.log('✅ API 限流功能正常 - 有請求被 503 拒絕');
    
    // 檢查 Retry-After 標頭
    const limitedRequests = results.filter(r => r.isLimited);
    const hasRetryAfter = limitedRequests.some(r => r.retryAfter);
    if (hasRetryAfter) {
      console.log('✅ 限流請求包含 Retry-After 標頭');
    } else {
      console.log('❌ 限流請求缺少 Retry-After 標頭');
    }
  } else {
    console.log('❌ API 限流功能異常 - 沒有請求被限流');
  }
  
  if (maxOnlineCount > 0) {
    console.log('✅ 線上人數統計正常');
  } else {
    console.log('❌ 線上人數統計異常');
  }
  
  // 顯示被限流的請求
  if (limited > 0) {
    console.log('\n被限流的請求:');
    results.filter(r => r.isLimited).forEach(r => {
      console.log(`  用戶 ${r.userId}: ${r.retryAfter ? `Retry-After ${r.retryAfter}s` : 'No Retry-After'}`);
    });
  }
}

// 延遲啟動
setTimeout(runQuickTest, 1000);
