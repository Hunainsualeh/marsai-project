const pdf = require('pdf-parse');
console.log('PDF-PARSE EXPORT KEYS:', Object.keys(pdf));
console.log('PDFParse type:', typeof pdf.PDFParse);
if (typeof pdf.PDFParse === 'function') {
    // Try to see if it can be called as a function
    console.log('Can call PDFParse?');
}
