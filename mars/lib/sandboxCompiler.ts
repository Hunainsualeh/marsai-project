/**
 * Sandboxed Execution Engine compiler
 * Bundles a Virtual File System into a safe iframe srcDoc
 */

export function buildSandboxDoc(files: Record<string, string>): string {
  const fileKeys = Object.keys(files);
  
  // High-priority filenames vs automatic fallback detection
  const html = files['index.html'] || files[fileKeys.find(k => k.endsWith('.html')) || ''] || '';
  const css = files['style.css'] || files['styles.css'] || files[fileKeys.find(k => k.endsWith('.css')) || ''] || '';
  const js = files['script.js'] || files['main.js'] || files['app.js'] || files[fileKeys.find(k => k.endsWith('.js')) || ''] || '';

  // Extract <head> if present to inject safely
  let rawHead = '';
  let rawBody = html;

  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (headMatch) {
    rawHead = headMatch[1];
    rawBody = html.replace(/<head[^>]*>[\s\S]*?<\/head>/i, '');
  }

  // If there's an outer html tag, extract its contents
  const bodyMatch = rawBody.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    rawBody = bodyMatch[1];
  }

  // Strip out local scripts and stylesheets since we inject them directly
  rawBody = rawBody
    .replace(/<script[^>]*src=["'](?:\.\/)?(?:script|main|app)\.js["'][^>]*><\/script>/gi, '')
    .replace(/<link[^>]*href=["'](?:\.\/)?style(?:s)?\.css["'][^>]*>/gi, '');

  rawHead = rawHead
    .replace(/<script[^>]*src=["'](?:\.\/)?(?:script|main|app)\.js["'][^>]*><\/script>/gi, '')
    .replace(/<link[^>]*href=["'](?:\.\/)?style(?:s)?\.css["'][^>]*>/gi, '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Tailwind CDN Framework -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Console Proxy Script (Redirects errors/logs to parent window) -->
  <script>
    (function() {
      const parent = window.parent;
      if (!parent) return;

      function proxyConsole(type) {
        const original = console[type];
        console[type] = function(...args) {
          try {
            // Send the serialized log up to the parent application
            parent.postMessage({
              type: 'CANVAS_CONSOLE',
              payload: {
                type,
                messages: args.map(arg => {
                  if (arg instanceof Error) return arg.toString();
                  if (typeof arg === 'object') {
                    try { return JSON.stringify(arg); } catch(e) { return String(arg); }
                  }
                  return String(arg);
                })
              }
            }, '*');
          } catch(e) { /* ignore */ }
          
          original.apply(console, args);
        };
      }

      ['log', 'info', 'warn', 'error'].forEach(proxyConsole);

      window.onerror = function(message, source, lineno, colno, error) {
        console.error(error ? error.toString() : (message + " at line " + lineno));
        return false;
      };
      
      window.onunhandledrejection = function(event) {
        console.error("Unhandled Promise Rejection: " + (event.reason ? event.reason.toString() : "Unknown reason"));
      };
    })();
  </script>

  <!-- User Injected Head HTML -->
  ${rawHead}

  <!-- Target CSS from VFS -->
  <style>
    /* Reset & Base System Styles */
    body { margin: 0; padding: 0; min-height: 100vh; background: #ffffff; color: #000; font-family: system-ui, sans-serif; }
    
    /* User CSS */
    ${css}
  </style>
</head>
<body>
  <!-- Target HTML Content from VFS -->
  ${rawBody}
  
  <!-- Target JS logic inside an ES6 module boundary -->
  <script type="module">
    try {
      ${js}
    } catch(err) {
      console.error(err);
    }
  </script>
</body>
</html>`;
}
