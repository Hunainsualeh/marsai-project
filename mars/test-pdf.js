const pdf = require('pdf-parse');
console.log('PDF-PARSE EXPORT TYPE:', typeof pdf);
console.log('PDF-PARSE EXPORT KEYS:', Object.keys(pdf));
if (pdf.default) {
    console.log('PDF-PARSE DEFAULT TYPE:', typeof pdf.default);
}
