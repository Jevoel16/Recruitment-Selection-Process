const db = require('../db');

// Commits modifications to a position's core qualification standards and salary metrics.
// This ensures that the dynamic vacancy dashboard accurately reflects real-time Civil Service criteria.
exports.updatePosition = async (req, res) => {
    try {
        const { id, vacancyAnnouncement, plantillaItem, salaryGrade, monthlySalary, qsEducation, qsTraining, qsExperience, qsEligibility } = req.body;
        let { qsEducationLevel, qsTrainingLevel, qsExperienceLevel } = req.body;

        qsEducationLevel = qsEducationLevel || null;
        qsTrainingLevel = qsTrainingLevel || null;
        qsExperienceLevel = qsExperienceLevel || null;
        
        // Manual validation
        if (!id) return res.status(400).json({ error: "Missing ID" });

        await db.query(`UPDATE positions SET vacancyAnnouncement=?, plantillaItem=?, salaryGrade=?, monthlySalary=?, qsEducation=?, qsEducationLevel=?, qsTraining=?, qsTrainingLevel=?, qsExperience=?, qsExperienceLevel=?, qsEligibility=? WHERE id=?`, 
            [vacancyAnnouncement, plantillaItem, salaryGrade, monthlySalary, qsEducation, qsEducationLevel, qsTraining, qsTrainingLevel, qsExperience, qsExperienceLevel, qsEligibility, id]);
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Toggles a position's active recruitment status on the dashboard.
// Only positions marked as 'in_vacancy' (1) will accept new applicants and appear in the Masterlist dropdowns.
exports.togglePositionVacancy = async (req, res) => {
    try {
        const { in_vacancy } = req.body;
        if (in_vacancy === undefined) return res.status(400).json({ error: "Missing in_vacancy parameter" });

        await db.query(`UPDATE positions SET in_vacancy = ? WHERE id = ?`, [in_vacancy ? 1 : 0, req.params.id]);
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Updates the precise capacity limits and identifying codes for a specific job title.
// The vacancyCount directly limits how many applicants can ultimately be advanced to the 'ASSIGNED' state for this position.
exports.updatePlantilla = async (req, res) => {
    try {
        const { vacancyCount, plantillaItem } = req.body;
        if (vacancyCount === undefined || !plantillaItem) return res.status(400).json({ error: "Missing parameters" });

        await db.query(`UPDATE positions SET vacancyCount = ?, plantillaItem = ? WHERE id = ?`, [vacancyCount, plantillaItem, req.params.id]);
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }
};

const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

exports.exportDoc = async (req, res) => {
    try {
        const [positions] = await db.query('SELECT * FROM positions WHERE in_vacancy = 1');
        
        const grouped = {};
        for (const pos of positions) {
            let title = pos.title;
            if (title.includes('Teacher') || title.includes('Master Teacher')) {
                title = title.replace(/\s*\([^)]*\)/g, '').trim();
            }
            if (!grouped[title]) grouped[title] = [];
            
            let items = [];
            if (pos.plantillaItem && pos.plantillaItem.trim() !== "") {
                items = pos.plantillaItem.split(',').map(s => s.trim()).filter(s => s !== '');
            } else {
                items = [""]; 
            }
            grouped[title].push(...items);
        }
        
        const flatEntries = [];
        let groupIndex = 0;
        
        const getLetter = (index) => {
            let letter = '';
            while (index >= 0) {
                letter = String.fromCharCode(65 + (index % 26)) + letter;
                index = Math.floor(index / 26) - 1;
            }
            return letter;
        };

        const sortedEntries = Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));

        for (const [title, items] of sortedEntries) {
            if (items.length === 0) continue;
            const prefix = getLetter(groupIndex) + '. ';
            for (let i = 0; i < items.length; i++) {
                flatEntries.push({
                    titleStr: i === 0 ? prefix + title.toUpperCase() : '',
                    groupTitle: prefix + title.toUpperCase(),
                    isFirst: i === 0,
                    itemStr: items[i]
                });
            }
            groupIndex++;
        }
        
        // Chunk into pages of 22 entries (11 left, 11 right)
        const pages = [];
        for (let i = 0; i < flatEntries.length; i += 22) {
            pages.push(flatEntries.slice(i, i + 22));
        }

        const content = fs.readFileSync(path.resolve(__dirname, '../public/templates/Vacancy_Endorsement_Template3.docx'), 'binary');
        const zip = new PizZip(content);
        // Parameterize dynamic variables
        const directorName = 'ALONA B. CARUMBA';
        const superintendentName = 'JONATHAN S. DELA PEÑA, PhD, CESO V';
        const today = new Date();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const dateHeaderStr = `${monthNames[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;
        const dateJsdpStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;

        let tableHeader = fs.readFileSync(path.join(__dirname, '../templates_xml/table_header.xml'), 'utf8');
        tableHeader = tableHeader.replace(/ w14:paraId="[^"]+"/g, '').replace(/ w14:textId="[^"]+"/g, '');

        const tcPrLeft = '<w:tcPr><w:tcW w:w="1977" w:type="dxa"/>#MERGE#<w:tcBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="6" w:space="0" w:color="000000" w:themeColor="text1"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tcBorders><w:vAlign w:val="center"/><w:hideMark/></w:tcPr>';
        const tcPrRight = '<w:tcPr><w:tcW w:w="1977" w:type="dxa"/>#MERGE#<w:tcBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tcBorders><w:vAlign w:val="center"/><w:hideMark/></w:tcPr>';
        const tcPrItem = '<w:tcPr><w:tcW w:w="2549" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tcBorders><w:vAlign w:val="center"/></w:tcPr>';
        const innerTcPr = '<w:tcW w:w="9052" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="6" w:space="0" w:color="000000" w:themeColor="text1"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tcBorders><w:vAlign w:val="center"/>';
        
        let pagesArray = [];

        for (let pIndex = 0; pIndex < pages.length; pIndex++) {
            const chunk = pages[pIndex];
            const leftCol = chunk.slice(0, 11);
            const rightCol = chunk.slice(11, 22);
            
            let tableXml = '';
            tableXml += tableHeader;
            
            for (let r = 0; r < 11; r++) {
                if (!leftCol[r] && !rightCol[r]) break;
                
                let lEntry = leftCol[r] || { titleStr: '', itemStr: '', isFirst: false, groupTitle: '' };
                let rEntry = rightCol[r] || { titleStr: '', itemStr: '', isFirst: false, groupTitle: '' };
                
                // Add CONTINUATION if it's the first item in a page but NOT the first item in a group
                let lTitle = lEntry.titleStr;
                let rTitle = rEntry.titleStr;
                if (!lEntry.isFirst && r === 0 && lEntry.groupTitle) {
                    lTitle = lEntry.groupTitle + ' - CONTINUATION';
                    lEntry.isFirst = true; // force restart merge
                }
                if (!rEntry.isFirst && r === 0 && rEntry.groupTitle) {
                    rTitle = rEntry.groupTitle + ' - CONTINUATION';
                    rEntry.isFirst = true; // force restart merge
                }
                
                let lMerge = lEntry.isFirst ? '<w:vMerge w:val="restart"/>' : (lEntry.groupTitle ? '<w:vMerge/>' : '');
                let rMerge = rEntry.isFirst ? '<w:vMerge w:val="restart"/>' : (rEntry.groupTitle ? '<w:vMerge/>' : '');
                
                let lFontSize = lTitle.length > 15 ? 14 : 22; // Size 7 if > 15 chars, else Size 11
                let rFontSize = rTitle.length > 15 ? 14 : 22;
                
                let rowHeight = r === 0 ? 380 : 320;
                let rowXml = `<w:tr><w:trPr><w:trHeight w:val="${rowHeight}" w:hRule="exact"/></w:trPr>`;
                
                // Left Title
                rowXml += `<w:tc>${tcPrLeft.replace('#MERGE#', lMerge)}<w:p><w:r><w:rPr><w:rFonts w:ascii="Bookman Old Style" w:hAnsi="Bookman Old Style" w:cs="Times New Roman"/><w:sz w:val="${lFontSize}"/><w:szCs w:val="${lFontSize}"/></w:rPr><w:t>${lTitle}</w:t></w:r></w:p></w:tc>`;
                // Left Item (Centered)
                rowXml += `<w:tc>${tcPrItem}<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Bookman Old Style" w:hAnsi="Bookman Old Style" w:cs="Times New Roman"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t>${lEntry.itemStr}</w:t></w:r></w:p></w:tc>`;
                // Right Title
                rowXml += `<w:tc>${tcPrRight.replace('#MERGE#', rMerge)}<w:p><w:r><w:rPr><w:rFonts w:ascii="Bookman Old Style" w:hAnsi="Bookman Old Style" w:cs="Times New Roman"/><w:sz w:val="${rFontSize}"/><w:szCs w:val="${rFontSize}"/></w:rPr><w:t>${rTitle}</w:t></w:r></w:p></w:tc>`;
                // Right Item (Centered)
                rowXml += `<w:tc>${tcPrItem}<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Bookman Old Style" w:hAnsi="Bookman Old Style" w:cs="Times New Roman"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t>${rEntry.itemStr}</w:t></w:r></w:p></w:tc>`;
                
                rowXml += `</w:tr>`;
                tableXml += rowXml;
            }
            
            // Append NOTHING FOLLOWS row to EVERY page
            tableXml += `
            <w:tr>
                <w:tc>
                    <w:tcPr>
                        <w:gridSpan w:val="4"/>
                        ${innerTcPr}
                    </w:tcPr>
                    <w:p>
                        <w:pPr><w:jc w:val="center"/></w:pPr>
                        <w:r>
                            <w:rPr><w:rFonts w:ascii="Bookman Old Style" w:hAnsi="Bookman Old Style" w:cs="Times New Roman"/><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr>
                            <w:t>xxxNOTHING FOLLOWSxxx</w:t>
                        </w:r>
                    </w:p>
                </w:tc>
            </w:tr>`;
            
            tableXml += '</w:tbl>';

            pagesArray.push({
                tableXml: tableXml,
                Date: dateHeaderStr,
                Director_Name: directorName,
                Superintendent_Name: superintendentName,
                date_footer: dateJsdpStr,
                pageBreak: pIndex > 0 ? '<w:p><w:r><w:br w:type="page"/></w:r></w:p>' : ''
            });
        }

        // Dynamically wrap the entire document in the {#pages} loop 
        // to repeat the entire letterhead and footer on every page.
        let docXml = zip.file('word/document.xml').asText();
        docXml = docXml.replace('<w:body>', '<w:body><w:p><w:r><w:t>{#pages}</w:t></w:r></w:p><w:p><w:r><w:t>{@pageBreak}</w:t></w:r></w:p>');
        docXml = docXml.replace('<w:sectPr', '<w:p><w:r><w:t>{/pages}</w:t></w:r></w:p><w:sectPr');
        docXml = docXml.replace('{@pagesXml}', '{@tableXml}');
        zip.file('word/document.xml', docXml);

        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });
        
        // Render the array of pages
        doc.render({ 
            pages: pagesArray
        });
        
        const buf = doc.getZip().generate({
            type: 'nodebuffer',
            compression: 'DEFLATE',
        });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', 'attachment; filename=Vacancy_Endorsement.docx');
        res.send(buf);
        
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to generate document" });
    }
};
