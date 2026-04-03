const fs = require('fs');
const file = 'd:/Marsai/mars/lib/groq.ts';
let code = fs.readFileSync(file, 'utf8');
const idx = code.indexOf('When the user asks you to build');
code = code.substring(0, idx) + \When the user asks you to build, generate, or render a web UI, application, or visualization, output the code using standard Markdown code blocks. Never use JSON wrapper formatting.
All JS must be written as ES6+ modules to ensure proper scoping.\;

// Re-export from models for convenience in server-side code
export { AVAILABLE_MODELS, DEFAULT_MODEL } from './models';
export type { ModelId } from './models';
\;
fs.writeFileSync(file, code);

