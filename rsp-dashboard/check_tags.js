const PizZip = require('pizzip');
const fs = require('fs');
const content = fs.readFileSync('public/templates/Notice of Requirements - Promotion.docx', 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml').asText();
const matches = xml.match(/\{[^}]+\}/g);
console.log(matches);
