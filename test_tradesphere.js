const API_URL = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('========================================================================');
  console.log('   TRADESPHERE AUTOMATED VERIFICATION SUITE (NATIVE FETCH)');
  console.log('========================================================================\n');

  try {
    let token = '';
    let adminToken = '';

    // Test 1: User Login
    console.log('[TEST 1] Logging in standard user...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'user@tradesphere.com',
        password: 'userpassword'
      })
    });
    
    const loginData = await loginRes.json();
    if (loginRes.ok && loginData.success && loginData.accessToken) {
      token = loginData.accessToken;
      console.log('  -> Success! User logged in. Virtual Balance:', loginData.user.virtualBalance);
    } else {
      throw new Error(`User login failed: ${JSON.stringify(loginData)}`);
    }

    // Configure headers for authenticated user actions
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Test 2: Fetch Stock Catalog
    console.log('\n[TEST 2] Fetching stock catalog...');
    const stocksRes = await fetch(`${API_URL}/stocks`);
    const stocksData = await stocksRes.json();
    
    if (stocksRes.ok && stocksData.success && stocksData.data.length > 0) {
      console.log(`  -> Success! Found ${stocksData.data.length} stocks.`);
      const apple = stocksData.data.find(s => s.symbol === 'AAPL');
      console.log(`     AAPL Current Price: $${apple.currentPrice} | Volume: ${apple.volume}`);
    } else {
      console.error('Catalog response error status:', stocksRes.status);
      console.error('Catalog response error body:', stocksData);
      throw new Error('Failed to retrieve stock list');
    }

    // Test 3: Buy Stock
    console.log('\n[TEST 3] Placing a BUY order for 10 shares of AAPL...');
    const buyRes = await fetch(`${API_URL}/transactions/order`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        symbol: 'AAPL',
        quantity: 10,
        type: 'BUY'
      })
    });

    const buyData = await buyRes.json();
    if (buyRes.ok && buyData.success) {
      console.log('  -> Success! BUY transaction complete.');
      console.log('     New Virtual Balance:', buyData.newBalance);
    } else {
      throw new Error(`BUY transaction failed: ${JSON.stringify(buyData)}`);
    }

    // Test 4: Verify Portfolio holding
    console.log('\n[TEST 4] Verifying Portfolio holdings...');
    const portfolioRes = await fetch(`${API_URL}/portfolio`, { headers: authHeaders });
    const portfolioData = await portfolioRes.json();
    const aaplHolding = portfolioData.data.holdings.find(h => h.symbol === 'AAPL');
    
    if (aaplHolding && aaplHolding.quantity === 10) {
      console.log('  -> Success! Portfolio tracks active position correctly.');
      console.log(`     Holding Symbol: ${aaplHolding.symbol} | Owned Quantity: ${aaplHolding.quantity} | Avg Cost: $${aaplHolding.averageBuyPrice}`);
      console.log(`     Portfolio Valuation: $${portfolioData.data.currentValue} | P/L: $${portfolioData.data.profitLoss}`);
    } else {
      throw new Error('Portfolio verification failed');
    }

    // Test 5: Sell Stock
    console.log('\n[TEST 5] Placing a SELL order for 4 shares of AAPL...');
    const sellRes = await fetch(`${API_URL}/transactions/order`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        symbol: 'AAPL',
        quantity: 4,
        type: 'SELL'
      })
    });

    const sellData = await sellRes.json();
    if (sellRes.ok && sellData.success) {
      console.log('  -> Success! SELL transaction complete.');
      console.log('     New Virtual Balance:', sellData.newBalance);
    } else {
      throw new Error(`SELL transaction failed: ${JSON.stringify(sellData)}`);
    }

    // Test 6: Verify holdings after reduction
    console.log('\n[TEST 6] Verifying Portfolio holdings after sell...');
    const portfolioRes2 = await fetch(`${API_URL}/portfolio`, { headers: authHeaders });
    const portfolioData2 = await portfolioRes2.json();
    const aaplHolding2 = portfolioData2.data.holdings.find(h => h.symbol === 'AAPL');
    
    if (aaplHolding2 && aaplHolding2.quantity === 6) {
      console.log('  -> Success! Portfolio reflects remaining position correctly.');
      console.log(`     Holding: ${aaplHolding2.symbol} | Remaining Quantity: ${aaplHolding2.quantity}`);
    } else {
      throw new Error('Portfolio reduction validation failed');
    }

    // Test 7: Fetch Transaction History
    console.log('\n[TEST 7] Fetching Transaction History Audit Trail...');
    const txsRes = await fetch(`${API_URL}/transactions`, { headers: authHeaders });
    const txsData = await txsRes.json();
    if (txsRes.ok && txsData.success && txsData.data.length === 2) {
      console.log(`  -> Success! Found ${txsData.data.length} transaction entries.`);
      txsData.data.forEach((tx, idx) => {
        console.log(`     Tx #${idx + 1}: ${tx.type} ${tx.quantity} shares of ${tx.symbol} @ $${tx.price} (Total: $${tx.totalAmount})`);
      });
    } else {
      throw new Error('Transaction log retrieval failed');
    }

    // Test 8: Admin Login
    console.log('\n[TEST 8] Logging in Admin Account...');
    const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@tradesphere.com',
        password: 'adminpassword'
      })
    });
    
    const adminLoginData = await adminLoginRes.json();
    if (adminLoginRes.ok && adminLoginData.success && adminLoginData.accessToken) {
      adminToken = adminLoginData.accessToken;
      console.log('  -> Success! Admin logged in. Role:', adminLoginData.user.role);
    } else {
      throw new Error('Admin login failed');
    }

    // Configure Admin headers
    const adminHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    };

    // Test 9: Verify Admin access
    console.log('\n[TEST 9] Verifying Admin-Only API routes...');
    const adminUsersRes = await fetch(`${API_URL}/admin/users`, { headers: adminHeaders });
    const adminUsersData = await adminUsersRes.json();
    if (adminUsersRes.ok && adminUsersData.success && adminUsersData.data.length > 0) {
      console.log(`  -> Success! Admin-only endpoint retrieved ${adminUsersData.data.length} users.`);
    } else {
      throw new Error('Admin-only users query failed');
    }

    // Test 10: Verify Access Control Protection (User accessing Admin route)
    console.log('\n[TEST 10] Testing Security: Standard user attempting to access Admin route...');
    const hackerRes = await fetch(`${API_URL}/admin/users`, { headers: authHeaders });
    
    if (hackerRes.status === 403) {
      console.log('  -> Success! Route access was BLOCKED with 403 Forbidden.');
    } else {
      throw new Error(`Security failure: standard user allowed access to admin route, status: ${hackerRes.status}`);
    }

    console.log('\n========================================================================');
    console.log('   ALL 10 VERIFICATION TESTS COMPLETED SUCCESSFULLY! (100% PASS)');
    console.log('========================================================================\n');
  } catch (err) {
    console.error('\n❌ VERIFICATION TEST SUITE ENCOUNTERED AN ERROR:');
    console.error(err.message);
    process.exit(1);
  }
};

runTests();
