// sandbox.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const scriptPath = path.join(__dirname, 'dist', 'prompt-enhancer.user.js');

if (!fs.existsSync(scriptPath)) {
    console.error('❌ ERRO: Rode "npm run build" primeiro.');
    process.exit(1);
}

const userscriptCode = fs.readFileSync(scriptPath, 'utf8');

const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Sandbox - Prompt Enhancer (Real APIs)</title>
    <style>
        body { font-family: system-ui, sans-serif; padding: 40px; background: #f0f2f5; color: #333; }
        .chat-container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 20px; }
        .composer { display: flex; flex-direction: column; gap: 10px; }
        textarea { width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 6px; resize: vertical; font-family: inherit; font-size: 14px; }
        h1 { text-align: center; color: #444; }
    </style>
</head>
<body>
    <h1>Sandbox de Teste (APIs Reais)</h1>
    <div class="chat-container">
        <div class="composer">
            <textarea id="prompt-input" rows="5" placeholder="Digite seu prompt aqui..."></textarea>
        </div>
    </div>

    <script>
        // ---------------------------------------------------------
        // SHIM REAL: Encaminha requisições para o Proxy Node.js
        // ---------------------------------------------------------
        globalThis.GM_xmlhttpRequest = (details) => {
            console.log('[Proxy] Requisição real:', details.method, details.url);
            
            fetch('/proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: details.url,
                    method: details.method || 'GET',
                    headers: details.headers || {},
                    data: details.data
                })
            })
            .then(res => res.json())
            .then(result => {
                if (result.error) {
                    if (details.onerror) details.onerror({ error: result.error });
                } else {
                    if (details.onload) details.onload({
                        status: result.status,
                        responseText: result.responseText,
                        responseHeaders: result.responseHeaders
                    });
                }
            })
            .catch(err => {
                if (details.onerror) details.onerror(err);
            });

            return { abort: () => console.log('[Proxy] Abortado') };
        };

        // Outros shims GM
        const gmStorage = new Map();
        globalThis.GM_getValue = (key, defaultValue) => gmStorage.has(key) ? gmStorage.get(key) : defaultValue;
        globalThis.GM_setValue = (key, value) => { gmStorage.set(key, value); };
        globalThis.GM_deleteValue = (key) => { gmStorage.delete(key); };
        globalThis.GM_addStyle = (css) => { const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style); };
        globalThis.GM_registerMenuCommand = (name) => console.log('[GM Menu] Registrado:', name);
        globalThis.GM_notification = (d) => console.log('[GM Notification]', d.text);
    </script>

    <script>
        ${userscriptCode}
    </script>

    <script>
        window.addEventListener('load', () => {
            setTimeout(() => { document.getElementById('prompt-input').focus(); }, 100);
        });
    </script>
</body>
</html>
`;

// Cria o servidor com a rota de Proxy
const server = http.createServer((req, res) => {
    // Rota normal: entrega o HTML
    if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(htmlContent);
        return;
    }

    // Rota de Proxy: faz a chamada real lá fora
    if (req.method === 'POST' && req.url === '/proxy') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { url, method, headers, data } = JSON.parse(body);
                
                // Usa o fetch nativo do Node (sem CORS)
                const response = await fetch(url, {
                    method: method || 'GET',
                    headers: headers,
                    body: data
                });
                
                const responseText = await response.text();
                const responseHeaders = Array.from(response.headers.entries())
                    .map(([k, v]) => `${k}: ${v}`)
                    .join('\n');

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    status: response.status, 
                    responseText, 
                    responseHeaders 
                }));
            } catch (error) {
                console.error('[Proxy Error]', error.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
        return;
    }

    res.writeHead(404);
    res.end('Not found');
});

server.listen(PORT, () => {
    console.log(`\n🚀 Sandbox rodando em http://localhost:${PORT}`);
    console.log(`🔗 As chamadas para APIs externas estão passando pelo Proxy Node.js.`);
});