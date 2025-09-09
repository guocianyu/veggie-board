/**
 * 精確限流測試腳本
 * 模擬逐步增加用戶數量以測試限流功能
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

// 逐步測試不同人數
async function runStepTest() {
  console.log('開始精確限流測試...');
  console.log('硬上限: 60, 軟上限: 45, API 保護: 65');
  console.log('─'.repeat(60));
  
  const testCases = [
    { users: 10, description: '少量用戶 (10人)' },
    { users: 30, description: '中等用戶 (30人)' },
    { users: 50, description: '接近軟上限 (50人)' },
    { users: 70, description: '超過硬上限 (70人)' },
    { users: 100, description: '大量用戶 (100人)' }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n測試 ${testCase.description}:`);
    console.log('─'.repeat(40));
    
    const startTime = Date.now();
    
    // 同時發送請求
    const promises = [];
    for (let i = 1; i <= testCase.users; i++) {
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
    
    console.log(`結果: 成功 ${successful}, 限流 ${limited}, 錯誤 ${errors}, 平均線上人數 ${avgOnlineCount.toFixed(1)}`);
    
    // 等待一下再進行下一個測試
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n─'.repeat(60));
  console.log('所有測試完成！');
}

// 延遲啟動
setTimeout(runStepTest, 1000);
