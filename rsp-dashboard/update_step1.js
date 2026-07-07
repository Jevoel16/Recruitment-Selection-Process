const fs = require('fs');
const path = require('path');

const files = [
  'docMakerInitialEvalDQ.js',
  'docMakerInitialEvalDQHigherTeaching.js',
  'docMakerInitialEvalDQNoOmnibus.js',
  'docMakerInitialEvalDQNotNotarized.js',
  'docMakerInitialEvalQualifiedHigherTeaching.js',
  'docMakerInitialEvalQualifiedWithoutDate.js'
];

for (const f of files) {
  const filepath = path.join('public', 'js', f);
  if (fs.existsSync(filepath)) {
    let content = fs.readFileSync(filepath, 'utf8');
    const regex = /const\s+customTitleHtml\s*=\s*`[\s\S]*?`;\s*const\s+headerHtml\s*=\s*await\s+window\.getDocHeader\(true,\s*customTitleHtml\);/g;
    content = content.replace(regex, "const headerHtml = await window.getDocHeader(true, '', titleText);");
    fs.writeFileSync(filepath, content);
    console.log('Updated', f);
  }
}
