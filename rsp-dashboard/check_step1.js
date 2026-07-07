const fs = require('fs');
const PizZip = require('pizzip');
const files = [
  'Notice to DQ - Higher Teaching.docx',
  'Notice to DQ - No Omnibus.docx',
  'Notice to DQ - Not notarized Omnibus.docx',
  'Notice to DQ.docx',
  'Notice to Qualified - Higher Teaching.docx',
  'Notice to Qualified - Without Date of Assessment.docx'
];
files.forEach(f => {
  try {
    const zip = new PizZip(fs.readFileSync('public/templates/' + f));
    const text = zip.file('word/document.xml').asText().replace(/<[^>]+>/g, '');
    console.log(f + ': ' + text.substring(0, 100));
  } catch (e) {
    console.log(f + ': ERROR');
  }
});
