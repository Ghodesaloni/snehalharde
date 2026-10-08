const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

const SOURCE_MD_PATH = 'C:\\Users\\Asus\\.gemini\\antigravity-ide\\brain\\5c408e05-aa6b-4026-8140-434bc6138f4a\\AvaHire_Complete_Technical_Documentation.md';
const OUTPUT_HTML_PATH = path.join(__dirname, 'render.html');
const OUTPUT_PDF_PATH_1 = path.join('C:\\Users\\Asus\\OneDrive\\Desktop\\MAJOR PROJECT\\New folder\\snehalharde', 'AvaHire_Complete_Technical_Documentation.pdf');
const OUTPUT_PDF_PATH_2 = 'C:\\Users\\Asus\\.gemini\\antigravity-ide\\brain\\5c408e05-aa6b-4026-8140-434bc6138f4a\\AvaHire_Complete_Technical_Documentation.pdf';

const markdownContent = fs.readFileSync(SOURCE_MD_PATH, 'utf-8');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AvaHire Complete Technical Documentation</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
  
  <!-- Marked.js -->
  <script src="https://cdn.jsdelivr.net/npm/marked@9.1.6/marked.min.js"></script>
  
  <!-- KaTeX -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
  
  <!-- Mermaid.js -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
  
  <!-- Highlight.js -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark-dimmed.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>

  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 14mm 18mm 14mm;
      @bottom-right {
        content: counter(page);
      }
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 10pt;
      line-height: 1.6;
      color: #1e293b;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .container {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
    }

    h1, h2, h3, h4, h5, h6 {
      font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
      color: #0f172a;
      font-weight: 700;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      page-break-after: avoid;
      break-after: avoid;
    }

    h1 {
      font-size: 20pt;
      border-bottom: 2.5px solid #3b82f6;
      padding-bottom: 6px;
      margin-top: 1.8em;
      color: #1e3a8a;
    }

    h1:first-of-type {
      margin-top: 0;
      font-size: 24pt;
      text-align: center;
      border-bottom: none;
      color: #0f172a;
    }

    h1:first-of-type + h2 {
      text-align: center;
      font-size: 13pt;
      font-weight: 500;
      color: #475569;
      margin-top: -0.2em;
      margin-bottom: 2em;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 15px;
    }

    h2 {
      font-size: 14pt;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      color: #1e40af;
      margin-top: 1.4em;
    }

    h3 {
      font-size: 11.5pt;
      color: #1e293b;
      margin-top: 1.2em;
    }

    h4 {
      font-size: 10.5pt;
      color: #334155;
    }

    p {
      margin-top: 0.4em;
      margin-bottom: 0.8em;
      text-align: justify;
      hyphens: auto;
    }

    strong {
      color: #0f172a;
      font-weight: 600;
    }

    hr {
      border: none;
      border-top: 1px solid #cbd5e1;
      margin: 1.8em 0;
      page-break-after: avoid;
    }

    /* Code blocks */
    pre {
      background-color: #0f172a !important;
      color: #f8fafc !important;
      border-radius: 6px;
      padding: 10px 14px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.5pt;
      line-height: 1.45;
      overflow-x: auto;
      border: 1px solid #1e293b;
      margin: 1em 0;
      page-break-inside: avoid;
      break-inside: avoid;
      white-space: pre-wrap;
      word-break: break-word;
    }

    code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.8pt;
      background-color: #f1f5f9;
      color: #0369a1;
      padding: 1px 5px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }

    pre code {
      background-color: transparent !important;
      color: inherit !important;
      padding: 0;
      border: none;
      font-size: 8.5pt;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.2em 0;
      font-size: 8pt;
      line-height: 1.35;
      page-break-inside: auto;
    }

    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
      word-break: break-word;
    }

    th {
      background-color: #1e293b !important;
      color: #ffffff !important;
      font-weight: 600;
      font-size: 8pt;
      letter-spacing: 0.3px;
    }

    tbody tr:nth-child(even) {
      background-color: #f8fafc !important;
    }

    tbody tr:hover {
      background-color: #f1f5f9;
    }

    /* Lists */
    ul, ol {
      margin-top: 0.4em;
      margin-bottom: 0.8em;
      padding-left: 22px;
    }

    li {
      margin-bottom: 0.35em;
    }

    li > p {
      margin: 0;
    }

    /* Diagrams & Mermaid */
    .mermaid-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 1.5em 0;
      padding: 12px;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      page-break-inside: avoid;
      break-inside: avoid;
      overflow: hidden;
    }

    .mermaid {
      width: 100%;
      display: flex;
      justify-content: center;
    }

    .mermaid svg {
      max-width: 100% !important;
      height: auto !important;
    }

    /* KaTeX / Math */
    .katex-display {
      margin: 1em 0 !important;
      padding: 8px 12px;
      background: #f8fafc;
      border-radius: 6px;
      border-left: 3px solid #3b82f6;
      overflow-x: auto;
      page-break-inside: avoid;
    }

    .katex {
      font-size: 1.05em !important;
    }

    /* Links */
    a {
      color: #2563eb;
      text-decoration: none;
      word-break: break-all;
    }

    /* Callout & blockquotes */
    blockquote {
      margin: 1em 0;
      padding: 8px 16px;
      border-left: 4px solid #3b82f6;
      background-color: #eff6ff;
      color: #1e40af;
      border-radius: 0 6px 6px 0;
    }

    /* Section Page Breaks for Clean Document Flow */
    .section-break {
      page-break-before: always;
      break-before: page;
    }
  </style>
</head>
<body>
  <div class="container" id="content"></div>

  <script id="raw-markdown" type="text/template">${markdownContent.replace(/<\/script>/g, '<\\/script>')}</script>

  <script>
    document.addEventListener('DOMContentLoaded', async () => {
      const rawMd = document.getElementById('raw-markdown').textContent;
      
      // Configure marked
      marked.setOptions({
        gfm: true,
        breaks: false,
        headerIds: true,
        mangle: false,
        highlight: function(code, lang) {
          if (lang && hljs.getLanguage(lang)) {
            try {
              return hljs.highlight(code, { language: lang }).value;
            } catch (__) {}
          }
          return hljs.highlightAuto(code).value;
        }
      });

      // Render markdown to HTML
      const rawHtml = marked.parse(rawMd);
      const contentEl = document.getElementById('content');
      contentEl.innerHTML = rawHtml;

      // Transform mermaid code blocks to mermaid containers
      const codeBlocks = document.querySelectorAll('pre code.language-mermaid, pre code.lang-mermaid');
      codeBlocks.forEach((codeEl, index) => {
        const preEl = codeEl.closest('pre');
        const mermaidCode = codeEl.textContent;
        const container = document.createElement('div');
        container.className = 'mermaid-container';
        const mermaidDiv = document.createElement('div');
        mermaidDiv.className = 'mermaid';
        mermaidDiv.textContent = mermaidCode;
        container.appendChild(mermaidDiv);
        preEl.parentNode.replaceChild(container, preEl);
      });

      // Initialize mermaid
      mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        fontFamily: 'Inter, sans-serif',
        themeVariables: {
          primaryColor: '#e0f2fe',
          primaryTextColor: '#0369a1',
          primaryBorderColor: '#0284c7',
          lineColor: '#475569',
          secondaryColor: '#f1f5f9',
          tertiaryColor: '#ffffff'
        },
        flowchart: {
          curve: 'basis',
          htmlLabels: true
        },
        er: {
          useMaxWidth: true
        },
        sequence: {
          useMaxWidth: true,
          showSequenceNumbers: true
        }
      });

      try {
        await mermaid.run({
          nodes: document.querySelectorAll('.mermaid')
        });
      } catch (err) {
        console.error('Mermaid render error:', err);
      }

      // Render KaTeX math
      renderMathInElement(contentEl, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false},
          {left: '\\\\(', right: '\\\\)', display: false},
          {left: '\\\\[', right: '\\\\]', display: true}
        ],
        throwOnError: false
      });

      // Add section breaks for major chapters for clean printing
      const majorHeadings = document.querySelectorAll('h1');
      majorHeadings.forEach((h, idx) => {
        if (idx > 1) { // Skip title and executive summary
          h.classList.add('section-break');
        }
      });

      // Mark ready for puppeteer / CDP
      window.__RENDER_COMPLETE = true;
      console.log('Rendering completed successfully!');
    });
  </script>
</body>
</html>
`;

fs.writeFileSync(OUTPUT_HTML_PATH, htmlContent, 'utf-8');
console.log('Generated render.html');

async function printToPdf() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9222;

  console.log('Spawning Chrome with remote debugging on port ' + port);
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--remote-debugging-port=' + port,
    '--disable-web-security',
    '--allow-file-access-from-files',
    'file:///' + OUTPUT_HTML_PATH.replace(/\\\\/g, '/')
  ]);

  // Wait for Chrome remote debugging to be ready
  await new Promise(r => setTimeout(r, 2000));

  // Get WebSocket debugger URL from Chrome
  const targets = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/json`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const pageTarget = targets.find(t => t.type === 'page');
  if (!pageTarget) {
    throw new Error('No page target found');
  }

  console.log('Connecting to WebSocket:', pageTarget.webSocketDebuggerUrl);
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let id = 1;
  const pending = new Map();

  ws.onmessage = (msg) => {
    const res = JSON.parse(msg.data);
    if (res.id && pending.has(res.id)) {
      pending.get(res.id)(res);
      pending.delete(res.id);
    }
  };

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, (res) => {
        if (res.error) reject(res.error);
        else resolve(res.result);
      });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await new Promise(r => ws.onopen = r);
  console.log('Connected to Chrome DevTools Protocol');

  await sendCommand('Page.enable');
  await sendCommand('Runtime.enable');

  // Wait for window.__RENDER_COMPLETE to be true
  console.log('Waiting for render complete...');
  for (let i = 0; i < 40; i++) {
    const evalRes = await sendCommand('Runtime.evaluate', {
      expression: 'window.__RENDER_COMPLETE === true'
    });
    if (evalRes && evalRes.result && evalRes.result.value === true) {
      console.log('Window render reported complete!');
      break;
    }
    await new Promise(r => setTimeout(r, 500));
  }

  // Give 1.5 extra seconds for layout and SVGs to settle
  await new Promise(r => setTimeout(r, 1500));

  console.log('Generating PDF via Page.printToPDF...');
  const pdfData = await sendCommand('Page.printToPDF', {
    printBackground: true,
    paperWidth: 8.27, // A4
    paperHeight: 11.69,
    marginTop: 0.5,
    marginBottom: 0.5,
    marginLeft: 0.5,
    marginRight: 0.5,
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 7.5pt; font-family: Inter, sans-serif; color: #94a3b8; width: 100%; text-align: right; padding-right: 25px;">AvaHire — Technical Specification & Architecture</div>',
    footerTemplate: '<div style="font-size: 7.5pt; font-family: Inter, sans-serif; color: #94a3b8; width: 100%; text-align: center; padding-top: 5px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
    preferCSSPageSize: false
  });

  const pdfBuffer = Buffer.from(pdfData.data, 'base64');

  fs.writeFileSync(OUTPUT_PDF_PATH_1, pdfBuffer);
  console.log('Saved PDF to:', OUTPUT_PDF_PATH_1);

  try {
    fs.writeFileSync(OUTPUT_PDF_PATH_2, pdfBuffer);
    console.log('Saved PDF to:', OUTPUT_PDF_PATH_2);
  } catch (e) {
    console.log('Could not write to brain path:', e.message);
  }

  ws.close();
  chromeProcess.kill();
  console.log('Done! PDF generated successfully.');
}

printToPdf().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
