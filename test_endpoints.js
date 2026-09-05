const http = require('http');

function makeRequest(options, postData = null, cookie = null) {
    return new Promise((resolve, reject) => {
        const reqOptions = {
            hostname: 'localhost',
            port: 5000,
            path: options.path,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        if (cookie) {
            reqOptions.headers['Cookie'] = cookie;
        }

        if (postData) {
            reqOptions.headers['Content-Type'] = 'application/json';
        }

        const req = http.request(reqOptions, (res) => {
            let data = '';
            const setCookie = res.headers['set-cookie'];
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, headers: res.headers, data, setCookie });
            });
        });

        req.on('error', (e) => reject(e));
        if (postData) {
            req.write(JSON.stringify(postData));
        }
        req.end();
    });
}

async function runTests() {
    console.log("=== Testing Cloud Kitchen System Endpoints ===");
    let passed = 0;
    let failed = 0;

    // 1. Home Page
    try {
        const homeRes = await makeRequest({ path: '/' });
        if (homeRes.statusCode === 200 && homeRes.data.includes('Kitchen')) {
            console.log("✓ GET / (Home Page) - SUCCESS");
            passed++;
        } else {
            console.error("✗ GET / failed with status", homeRes.statusCode);
            failed++;
        }
    } catch(e) { console.error("✗ GET / error", e.message); failed++; }

    // 2. Customer Login
    let userCookie = null;
    try {
        const loginRes = await makeRequest(
            { path: '/login', method: 'POST' },
            { email: 'john@example.com', password: 'user123' }
        );
        const parsed = JSON.parse(loginRes.data);
        if (loginRes.statusCode === 200 && parsed.success) {
            console.log("✓ POST /login (Customer Login) - SUCCESS");
            userCookie = loginRes.setCookie ? loginRes.setCookie[0].split(';')[0] : null;
            passed++;
        } else {
            console.error("✗ Customer login failed:", parsed);
            failed++;
        }
    } catch(e) { console.error("✗ Customer login error", e.message); failed++; }

    // 3. Admin Login
    let adminCookie = null;
    try {
        const adminLoginRes = await makeRequest(
            { path: '/login', method: 'POST' },
            { email: 'admin@cloudkitchen.com', password: 'admin123' }
        );
        const parsed = JSON.parse(adminLoginRes.data);
        if (adminLoginRes.statusCode === 200 && parsed.success && parsed.user.role === 'admin') {
            console.log("✓ POST /login (Admin Login) - SUCCESS");
            adminCookie = adminLoginRes.setCookie ? adminLoginRes.setCookie[0].split(';')[0] : null;
            passed++;
        } else {
            console.error("✗ Admin login failed:", parsed);
            failed++;
        }
    } catch(e) { console.error("✗ Admin login error", e.message); failed++; }

    // 4. Place Order with Coupon
    let newOrderId = null;
    try {
        const orderRes = await makeRequest(
            { path: '/api/place-order', method: 'POST' },
            {
                items: [
                    { name: 'Farmhouse Cheese Burst Pizza', price: 260, quantity: 1 },
                    { name: 'Schezwan Veg Fried Rice', price: 130, quantity: 1 }
                ],
                deliveryAddress: 'Block C, Tech City, Flat 401',
                paymentMethod: 'COD',
                couponCode: 'COLLEGE50'
            },
            userCookie
        );
        const parsed = JSON.parse(orderRes.data);
        if (orderRes.statusCode === 200 && parsed.success) {
            newOrderId = parsed.orderId;
            console.log(`✓ POST /api/place-order (Place Order with COLLEGE50 coupon) - SUCCESS (#${newOrderId})`);
            passed++;
        } else {
            console.error("✗ Place order failed:", parsed);
            failed++;
        }
    } catch(e) { console.error("✗ Place order error", e.message); failed++; }

    // 5. Track Order
    try {
        if (newOrderId) {
            const trackRes = await makeRequest({ path: `/track-order/${newOrderId}` }, null, userCookie);
            if (trackRes.statusCode === 200 && trackRes.data.includes(newOrderId)) {
                console.log(`✓ GET /track-order/${newOrderId} (Live Order Tracking) - SUCCESS`);
                passed++;
            } else {
                console.error("✗ Track order failed with status", trackRes.statusCode);
                failed++;
            }
        }
    } catch(e) { console.error("✗ Track order error", e.message); failed++; }

    // 6. Admin Update Order Status
    try {
        if (newOrderId && adminCookie) {
            const updateRes = await makeRequest(
                { path: `/admin/order/${newOrderId}/status`, method: 'POST' },
                { status: 'Preparing' },
                adminCookie
            );
            const parsed = JSON.parse(updateRes.data);
            if (updateRes.statusCode === 200 && parsed.success) {
                console.log(`✓ POST /admin/order/${newOrderId}/status (Update to 'Preparing') - SUCCESS`);
                passed++;
            } else {
                console.error("✗ Admin update order status failed:", parsed);
                failed++;
            }
        }
    } catch(e) { console.error("✗ Admin update status error", e.message); failed++; }

    // 7. Contact Submission
    try {
        const contactRes = await makeRequest(
            { path: '/api/contact', method: 'POST' },
            {
                name: 'Test Student',
                email: 'student@college.edu',
                phone: '9988776655',
                subject: 'Minor Project Query',
                message: 'Awesome Cloud Kitchen system implementation!'
            }
        );
        const parsed = JSON.parse(contactRes.data);
        if (contactRes.statusCode === 200 && parsed.success) {
            console.log("✓ POST /api/contact (Customer Feedback & Inquiry) - SUCCESS");
            passed++;
        } else {
            console.error("✗ Contact submission failed:", parsed);
            failed++;
        }
    } catch(e) { console.error("✗ Contact error", e.message); failed++; }

    console.log(`\n========================================`);
    console.log(`Test Summary: Passed: ${passed} | Failed: ${failed}`);
    console.log(`========================================`);
    process.exit(failed > 0 ? 1 : 0);
}

runTests();
