const fs = require('fs');
const http = require('http');
const path = require('path');

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
const root = path.resolve(__dirname, '..', 'build');
const publicPath = '/telegram-react';

const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.wasm': 'application/wasm',
    '.worker.js': 'text/javascript; charset=utf-8',
};

function safePath(urlPath) {
    let cleanPath = decodeURIComponent(urlPath.split('?')[0]);

    if (cleanPath === '/' || cleanPath === publicPath || cleanPath === `${publicPath}/`) {
        cleanPath = '/index.html';
    } else if (cleanPath.startsWith(`${publicPath}/`)) {
        cleanPath = cleanPath.slice(publicPath.length);
    }

    const filePath = path.join(root, cleanPath);
    return filePath.startsWith(root) ? filePath : null;
}

function sendFile(res, filePath) {
    fs.readFile(filePath, (error, data) => {
        if (error) {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(String(error));
            return;
        }

        const ext = filePath.endsWith('.worker.js') ? '.worker.js' : path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
        res.end(data);
    });
}

const server = http.createServer((req, res) => {
    const filePath = safePath(req.url);
    if (!filePath) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Forbidden');
        return;
    }

    fs.stat(filePath, (error, stat) => {
        if (!error && stat.isFile()) {
            sendFile(res, filePath);
            return;
        }

        sendFile(res, path.join(root, 'index.html'));
    });
});

server.listen(port, host, () => {
    console.log(`Serving ${root} at http://localhost:${port}`);
});
