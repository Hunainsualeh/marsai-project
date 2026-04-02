const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  try {
    const list = await groq.models.list();
    console.log(list.data.map(m => m.id).sort().join('\n'));
  } catch (err) {
    console.error(err);
  }
}

main();
