// Test the Claude automatic system
const http = require('http');

const postData = JSON.stringify({
    command: 'update water icon',
    worldContext: 'Test world context',
    fullMessage: 'Test message for automatic processing'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/claude/send',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log('🚀 Testing automatic Claude system...');

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log('📥 Response:', data);
        
        // Check messages after 3 seconds
        setTimeout(() => {
            const getOptions = {
                hostname: 'localhost',
                port: 3000,
                path: '/claude/messages',
                method: 'GET'
            };
            
            const getReq = http.request(getOptions, (getRes) => {
                let getData = '';
                getRes.on('data', (chunk) => {
                    getData += chunk;
                });
                getRes.on('end', () => {
                    console.log('📋 Messages:', JSON.parse(getData));
                });
            });
            
            getReq.end();
        }, 3000);
    });
});

req.on('error', (error) => {
    console.error('❌ Error:', error);
});

req.write(postData);
req.end();