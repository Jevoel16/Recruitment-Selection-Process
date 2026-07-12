const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

try {
    const content = fs.readFileSync('./public/templates/Vacancy_Endorsement_Template3.docx', 'binary');
    const zip = new PizZip(content);
    
    let docXml = zip.file('word/document.xml').asText();
    docXml = docXml.replace('<w:body>', '<w:body><w:p><w:r><w:t>{#pages}</w:t></w:r></w:p><w:p><w:r><w:t>{@pageBreak}</w:t></w:r></w:p>');
    docXml = docXml.replace('<w:sectPr', '<w:p><w:r><w:t>{/pages}</w:t></w:r></w:p><w:sectPr');
    docXml = docXml.replace('{@pagesXml}', '{@tableXml}');
    zip.file('word/document.xml', docXml);

    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    
    let pagesArray = [
        {
            tableXml: '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Table 1</w:t></w:r></w:p></w:tc></w:tr></w:tbl>',
            Date: 'July 12, 2026',
            Director_Name: 'Director 1',
            Superintendent_Name: 'Superintendent 1',
            date_footer: '07/12/2026',
            pageBreak: ''
        },
        {
            tableXml: '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Table 2</w:t></w:r></w:p></w:tc></w:tr></w:tbl>',
            Date: 'July 12, 2026',
            Director_Name: 'Director 1',
            Superintendent_Name: 'Superintendent 1',
            date_footer: '07/12/2026',
            pageBreak: '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'
        }
    ];

    doc.render({ pages: pagesArray });
    
    const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    fs.writeFileSync('./test_output.docx', buf);
    console.log('SUCCESS');
} catch (e) {
    console.error(e);
}
