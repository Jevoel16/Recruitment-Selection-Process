const http = require('http');
const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 0, role: 'system' }, process.env.JWT_SECRET || 'fallback-secret-for-dev');
const postData = JSON.stringify({ applicantIds: [3], templateName: 'Notice to Qualified - Higher Teaching' });
const options = { hostname: '127.0.0.1', port: 3000, path: '/api/export/pre-generate-docs', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData), 'Cookie': 'auth=' + token } };
const req = http.request(options, (res) => { let data = ''; res.on('data', chunk => data += chunk); res.on('end', () => console.log('Status: ' + res.statusCode, 'Response:', data)); });
req.on('error', (e) => console.error('Error:', e));
req.write(postData);
req.end();
