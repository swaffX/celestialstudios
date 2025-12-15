const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');
const path = require('path');

// Configuration
const PORT = 9000;
const SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret-here';
const REPO_PATH = '/root/celestialstudios'; // VPS'deki repo yolu
const PM2_APP_NAME = 'celestialstudios';

// Create webhook server
const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/webhook') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            // Verify signature
            const signature = req.headers['x-hub-signature-256'];
            const hmac = crypto.createHmac('sha256', SECRET);
            const digest = 'sha256=' + hmac.update(body).digest('hex');

            if (signature !== digest) {
                console.log('❌ Invalid signature');
                res.writeHead(401);
                res.end('Unauthorized');
                return;
            }

            try {
                const payload = JSON.parse(body);

                // Check if it's a push to main branch
                if (payload.ref === 'refs/heads/main') {
                    console.log('📦 Push detected to main branch!');
                    console.log(`   Commit: ${payload.head_commit?.message || 'Unknown'}`);
                    console.log(`   Author: ${payload.head_commit?.author?.name || 'Unknown'}`);

                    // Execute deploy script
                    deploy();

                    res.writeHead(200);
                    res.end('Deploying...');
                } else {
                    res.writeHead(200);
                    res.end('Not main branch, ignoring');
                }
            } catch (error) {
                console.error('❌ Error parsing payload:', error);
                res.writeHead(400);
                res.end('Invalid payload');
            }
        });
    } else {
        res.writeHead(200);
        res.end('Webhook server is running! 🚀');
    }
});

// Deploy function
function deploy() {
    console.log('\n🚀 Starting deployment...');

    const commands = [
        `cd ${REPO_PATH}`,
        'git pull origin main',
        'npm install --production',
        `pm2 restart ${PM2_APP_NAME}`
    ].join(' && ');

    exec(commands, (error, stdout, stderr) => {
        if (error) {
            console.error('❌ Deploy failed:', error);
            console.error('stderr:', stderr);
            return;
        }

        console.log('✅ Deployment successful!');
        console.log('stdout:', stdout);
        console.log(`\n📅 Deployed at: ${new Date().toISOString()}`);
    });
}

server.listen(PORT, () => {
    console.log(`\n🎯 Webhook server listening on port ${PORT}`);
    console.log(`   Endpoint: http://your-vps-ip:${PORT}/webhook`);
    console.log(`   Repo path: ${REPO_PATH}`);
    console.log(`   PM2 app: ${PM2_APP_NAME}\n`);
});
