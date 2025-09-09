/**
 * 最終限流驗收測試
 * 驗證所有限流功能是否正常運作
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// 測試 API 限流
async function testAPILimiting() {
  console.log('🧪 測試 API 限流功能...');
  
  const promises = [];
  for (let i = 1; i <= 100; i++) {
    promises.push(makeRequest(i));
  }
  
  const results = await Promise.all(promises);
  
  const successful = results.filter(r => r.statusCode === 200).length;
  const limited = results.filter(r => r.statusCode === 503).length;
  const maxOnlineCount = Math.max(...results.map(r => r.onlineCount));
  
  console.log(`✅ API 限流測試結果:`);
  console.log(`   成功請求: ${successful}`);
  console.log(`   被限流: ${limited}`);
  console.log(`   最大線上人數: ${maxOnlineCount}`);
  
  if (limited > 0) {
    console.log('✅ API 限流功能正常');
    
    // 檢查 Retry-After 標頭
    const limitedRequests = results.filter(r => r.statusCode === 503);
    const hasRetryAfter = limitedRequests.every(r => r.retryAfter);
    
    if (hasRetryAfter) {
      console.log('✅ Retry-After 標頭正常');
    } else {
      console.log('❌ Retry-After 標頭異常');
    }
  } else {
    console.log('❌ API 限流功能異常');
  }
  
  return { successful, limited, maxOnlineCount };
}

// 測試前端等候頁
async function testFrontendWaiting() {
  console.log('\n🧪 測試前端等候頁功能...');
  
  try {
    const response = await fetch(`${BASE_URL}/`);
    const html = await response.text();
    
    if (html.includes('檢查中') || html.includes('等候') || html.includes('waitroom')) {
      console.log('✅ 前端等候頁功能正常');
      return true;
    } else {
      console.log('❌ 前端等候頁功能異常');
      return false;
    }
  } catch (error) {
    console.log('❌ 前端等候頁測試失敗:', error.message);
    return false;
  }
}

// 測試不同人數閾值
async function testThresholds() {
  console.log('\n🧪 測試不同人數閾值...');
  
  const thresholds = [
    { users: 10, expected: 'normal' },
    { users: 30, expected: 'normal' },
    { users: 50, expected: 'normal' },
    { users: 70, expected: 'limited' },
    { users: 100, expected: 'limited' }
  ];
  
  for (const test of thresholds) {
    console.log(`   測試 ${test.users} 個用戶...`);
    
    const promises = [];
    for (let i = 1; i <= test.users; i++) {
      promises.push(makeRequest(i));
    }
    
    const results = await Promise.all(promises);
    const limited = results.filter(r => r.statusCode === 503).length;
    const successRate = (results.length - limited) / results.length;
    
    if (test.expected === 'normal' && successRate > 0.8) {
      console.log(`   ✅ ${test.users} 用戶測試通過 (成功率: ${(successRate * 100).toFixed(1)}%)`);
    } else if (test.expected === 'limited' && limited > 0) {
      console.log(`   ✅ ${test.users} 用戶測試通過 (限流: ${limited})`);
    } else {
      console.log(`   ❌ ${test.users} 用戶測試失敗 (成功率: ${(successRate * 100).toFixed(1)}%, 限流: ${limited})`);
    }
  }
}

// 發送請求
function makeRequest(userId) {
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

// 執行所有測試
async function runAllTests() {
  console.log('🚀 開始限流系統驗收測試');
  console.log('='.repeat(50));
  
  try {
    // 測試 API 限流
    const apiResults = await testAPILimiting();
    
    // 測試前端等候頁
    const frontendResults = await testFrontendWaiting();
    
    // 測試不同閾值
    await testThresholds();
    
    // 總結
    console.log('\n' + '='.repeat(50));
    console.log('📊 驗收測試總結:');
    
    if (apiResults.limited > 0) {
      console.log('✅ API 限流功能: 正常');
    } else {
      console.log('❌ API 限流功能: 異常');
    }
    
    if (frontendResults) {
      console.log('✅ 前端等候頁: 正常');
    } else {
      console.log('❌ 前端等候頁: 異常');
    }
    
    console.log(`📈 最大線上人數: ${apiResults.maxOnlineCount}`);
    console.log(`🔒 被限流請求: ${apiResults.limited}`);
    
    if (apiResults.limited > 0 && frontendResults) {
      console.log('\n🎉 所有限流功能驗收通過！');
    } else {
      console.log('\n⚠️  部分功能需要檢查');
    }
    
  } catch (error) {
    console.error('❌ 測試執行失敗:', error);
  }
}

// 延遲啟動
setTimeout(runAllTests, 1000);
