// Generates the official PDF Assignment Letter using jsPDF vector rendering to match the physical template perfectly.
const loadImageForPDF = (src) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
});

window.printLetter = async function(id, name, office, dateStr, category, applicationCode, ccName, ccDesignation) {
    const startTimeMs = Date.now();
    const { jsPDF } = window.jspdf || window;
    if (!jsPDF) {
        window.showToast('jsPDF library failed to load. Please try again.', 'danger');
        return;
    }

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Renders inline rich text, specifically handling <b> tags for bolding dynamic key values.
    function drawRichText(doc, text, startX, startY, maxWidth, lineHeight, firstLineIndent = 0) {
        const parts = text.split(/(<\/b>|<b>)/);
        let currentX = startX + firstLineIndent;
        let currentY = startY;
        let isBold = false;
        
        const rightMargin = startX + maxWidth;
        
        parts.forEach(part => {
            if (part === '<b>') {
                isBold = true;
                doc.setFont("Times", "bold");
            } else if (part === '</b>') {
                isBold = false;
                doc.setFont("Times", "normal");
            } else {
                const words = part.split(' ');
                words.forEach((word, index) => {
                    if (word === '' && index > 0) return;
                    
                    const wordToDraw = word + (index < words.length - 1 ? ' ' : '');
                    const wordWidth = doc.getTextWidth(wordToDraw);
                    
                    if (currentX + wordWidth > rightMargin) {
                        currentX = startX;
                        currentY += lineHeight;
                    }
                    
                    doc.text(wordToDraw, currentX, currentY);
                    currentX += wordWidth;
                });
            }
        });
        
        return currentY + lineHeight;
    }

    // Formats the current date natively to construct the dynamic filename.
    const d = new Date();
    const formattedDate = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Maps the internal applicant category to their respective professional rank titles for the document.
    let rankTitle = 'Teacher I';

    // Extracts the sequence order number from the application code suffix to populate the tracking number.
    let orderNum = "007";
    if (applicationCode) {
        const parts = applicationCode.split('-');
        if (parts.length > 0) {
            const num = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(num)) {
                orderNum = String(num).padStart(3, '0');
            }
        }
    }

    // Fetches and registers the Canterbury custom font required for the Gothic header styling.
    let hasCustomFont = false;
    try {
        const fontRes = await fetch('/fonts/Canterbury.ttf');
        if (fontRes.ok) {
            const arrayBuffer = await fontRes.arrayBuffer();
            let binary = '';
            const bytes = new Uint8Array(arrayBuffer);
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const base64Font = btoa(binary);
            doc.addFileToVFS('Canterbury.ttf', base64Font);
            doc.addFont('Canterbury.ttf', 'Canterbury', 'normal');
            hasCustomFont = true;
        }
    } catch (err) {
        console.error('Failed to load Canterbury font, using standard font as fallback:', err);
    }

    // Draws the placement outlines and background colors for the official document seals.
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    const seal1 = await loadImageForPDF('/images/logos/DepEd Seal.png');
    if (seal1) doc.addImage(seal1, "PNG", 92.5, 2.5, 25, 15);

    // Renders the top header text utilizing the fetched Canterbury custom font for stylized branding.
    if (hasCustomFont) {
        doc.setFont("Canterbury", "normal");
        doc.setFontSize(11); // adjust scale slightly for gothic type
    } else {
        doc.setFont("Times", "normal");
        doc.setFontSize(11);
    }
    doc.setTextColor(0);
    doc.text("Republic of the Philippines", 105, 23, { align: "center" });
    
    if (hasCustomFont) {
        doc.setFont("Canterbury", "normal");
        doc.setFontSize(16); // Gothic department title is larger and elegant
    } else {
        doc.setFont("Times", "bold");
        doc.setFontSize(16);
    }
    doc.text("Department of Education", 105, 28, { align: "center" });
    
        doc.setFont("Times", "normal");
        doc.setFontSize(11);
    doc.text("Region X-Northern Mindanao", 105, 32, { align: "center" });
    
        doc.setFont("Times", "normal");
        doc.setFontSize(11);
    doc.text("SCHOOLS DIVISION OF ILIGAN CITY", 105, 36, { align: "center" });

    // Divider Lines under schools division
    // ASSIGNMENT ORDER Box Headers
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(20, 38, 190, 38);

    doc.setFont("Times", "bold");
    doc.setFontSize(20);
    doc.text("ASSIGNMENT ORDER", 105, 44, { align: "center" });
    
    doc.setLineWidth(0.8);
    doc.line(20, 46, 190, 46);

    doc.setFont("Times", "bold");
    doc.setFontSize(12);
    doc.text(`No. ${orderNum}, s. 2026`, 105, 54, { align: "center" });

    // Aligns the document date to the right margin to adhere to the official template standard.
    doc.setFont("Times", "normal");
    doc.text(formattedDate, 190, 69, { align: "right" });

    // Recipient TO Section
    doc.setFont("Times", "bold");
    doc.text("TO:", 20, 79);
    doc.text(name.toUpperCase(), 50, 79);
    doc.text(rankTitle, 50, 83);

    // Salutation
    doc.setFont("Times", "normal");
    const salutation = `Warm greetings!`;
    let currentY = drawRichText(doc, salutation, 20, 104, 170, 5, 10);

    currentY += 10;
    // Body Paragraph 1 (with bold Suarez National High School and effective Date)
    const body1 = `By virtue of an appointment duly issued by this Office, information is hereby given of your school assignment at <b>${office}</b>, Iligan City, effective this <b>${formattedDate}</b>. Thus, you shall report directly to the School Head/School Principal of the said school for further instruction.`;
    currentY = drawRichText(doc, body1, 20, currentY, 170, 5, 10);

    // Body Paragraph 2
    currentY += 7.5;
    const body2 = `Moreover, you are directed to submit the DBM-CSC Form No. 1, "Position Description Form" for the attestation of appointment to this Office thru Personnel Section within three (3) days from receipt hereof.`;
    currentY = drawRichText(doc, body2, 20, currentY, 170, 5, 10);

    // Body Paragraph 3
    currentY += 7.5;
    const body3 = "Compliance is enjoined.";
    currentY = drawRichText(doc, body3, 20, currentY, 170, 5, 10);

    // Superintendent Signature Block
    currentY += 25;
    doc.setFont("Times", "bold");
    doc.setFontSize(11);
    doc.text("JONATHAN S. DELA PEÑA, PhD, CESO V", 150, currentY + 15, { align: "center" });
    doc.setFont("Times", "normal");
    doc.text("Schools Division Superintendent", 150, currentY + 20, { align: "center" });

    // Carbon Copy (cc) section
    doc.setFontSize(9);
    doc.text("cc:", 20, currentY + 35);
    doc.setFont("Times", "bold");
    doc.text(ccName && ccName.trim() !== '' ? ccName.toUpperCase() : "LEONARDA LUNA ARAZO", 30, currentY + 35);
    doc.setFont("Times", "normal");
    doc.text(ccDesignation && ccDesignation.trim() !== '' ? ccDesignation : "School Principal I", 30, currentY + 40);
    
    // Footer section
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, 272, 190, 272);

    const seal2 = await loadImageForPDF('/images/logos/DepEd Logo.png');
    const seal3 = await loadImageForPDF('/images/logos/bagong-pilipinas-seeklogo.png');
    const seal4 = await loadImageForPDF('/images/logos/Deped Division of Iligan City.png');
    
    if (seal2) doc.addImage(seal2, "PNG", 22.5, 277.5, 22.5, 12.5);
    if (seal3) doc.addImage(seal3, "PNG", 56.5, 274.5, 17.5, 17.5);
    if (seal4) doc.addImage(seal4, "PNG", 85, 274.5, 17.5, 17.5);

    doc.setFontSize(7.5);
    doc.setTextColor(100);
    doc.setFont("Times", "bold");
    doc.text("Address:", 110, 277, { align: "left" });
    doc.setFont("Times", "normal");
    doc.text("Gen. Aguinaldo St., Iligan City", 121, 277, { align: "left" });
    doc.setFont("Times", "bold");
    doc.text("Email Address:", 110, 281, { align: "left" });
    doc.setFont("Times", "normal");
    doc.text("iligan.city@deped.gov.ph", 128, 281, { align: "left" });
    doc.setFont("Times", "bold");
    doc.text("Website:", 110, 285, { align: "left" });
    doc.setFont("Times", "normal");
    doc.text("www.iligan.deped10.com", 121, 285, { align: "left" });

    doc.setFontSize(6.5);
    doc.text("Doc. Ref. Code: DEPED-ILIGAN-AO-2026   |   Rev: 00   |   Page 1 of 1", 110, 290, { align: "left" });

    // Saves the generated PDF to the client's local filesystem and triggers the native download prompt.
    const currentDate = new Date();
    const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
    const yyyy = currentDate.getFullYear();
    const formattedDateStr = `${mm}${yyyy}`;
    doc.save(`AO-${name.replace(/\s+/g, '_')}-${formattedDateStr}.pdf`);
    const timeMs = Date.now() - startTimeMs;
    try {
        fetch('/api/logs/pdf-export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicantCode: applicationCode, pdfName: 'Letter', timeMs })
        });
    } catch(e) {}
    
    try {
        await fetch(`/api/applicants/${id}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        window.location.reload();
    } catch (e) {
        console.error('Failed to update status', e);
    }
}
window.printInitialEvalPdf = async function(id) {
    const startTimeMs = Date.now();
    const { jsPDF } = window.jspdf || window;
    if (!jsPDF) {
        window.showToast('jsPDF library failed to load.', 'danger');
        return;
    }

    let data;
    try {
        const res = await fetch(`/api/applicants/${id}/details`);
        data = await res.json();
    } catch(err) {
        window.showToast('Failed to fetch applicant data', 'danger');
        return;
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const MARGIN = 25.4;
    const PAGE_WIDTH = 210;
    const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

    let hasCustomFont = false;
    try {
        const fontRes = await fetch('/fonts/Canterbury.ttf');
        if (fontRes.ok) {
            const arrayBuffer = await fontRes.arrayBuffer();
            let binary = '';
            const bytes = new Uint8Array(arrayBuffer);
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            doc.addFileToVFS('Canterbury.ttf', btoa(binary));
            doc.addFont('Canterbury.ttf', 'Canterbury', 'normal');
            hasCustomFont = true;
        }
    } catch (err) {}

    function printMixedText(doc, textArr, startX, startY, maxWidth, justify = true) {
        let currentY = startY;
        const lineHeight = 5;

        // Flatten into tokens
        const allTokens = [];
        textArr.forEach(part => {
            const tokens = part.text.match(/(\S+|\s+|\n)/g) || [];
            tokens.forEach(t => {
                allTokens.push({ text: t, bold: part.bold, url: part.url });
            });
        });

        // Group into lines
        const lines = [];
        let currentLine = [];
        let currentLineWidth = 0;

        const measureToken = (t) => {
            if (t.text === '\n') return 0;
            doc.setFont('Times', t.bold ? 'bold' : 'normal');
            return doc.getTextWidth(t.text);
        };

        for (let i = 0; i < allTokens.length; i++) {
            const t = allTokens[i];
            
            if (t.text === '\n') {
                // Remove trailing spaces before pushing line
                while(currentLine.length > 0 && currentLine[currentLine.length - 1].text.trim() === '') {
                    const popped = currentLine.pop();
                    currentLineWidth -= measureToken(popped);
                }
                lines.push({ tokens: currentLine, isLast: true, width: currentLineWidth });
                currentLine = [];
                currentLineWidth = 0;
                continue;
            }

            const tWidth = measureToken(t);
            
            // If it's a space and it's the first token on a new line, skip it
            if (currentLine.length === 0 && t.text.trim() === '') {
                continue;
            }

            if (currentLineWidth + tWidth > maxWidth && currentLine.length > 0) {
                // Remove trailing spaces
                while(currentLine.length > 0 && currentLine[currentLine.length - 1].text.trim() === '') {
                    const popped = currentLine.pop();
                    currentLineWidth -= measureToken(popped);
                }
                lines.push({ tokens: currentLine, isLast: false, width: currentLineWidth });
                
                currentLine = [];
                currentLineWidth = 0;
                
                if (t.text.trim() === '') {
                    continue; // Skip the space that caused the wrap
                }
            }
            
            currentLine.push(t);
            currentLineWidth += tWidth;
        }
        
        if (currentLine.length > 0) {
            while(currentLine.length > 0 && currentLine[currentLine.length - 1].text.trim() === '') {
                const popped = currentLine.pop();
                currentLineWidth -= measureToken(popped);
            }
            lines.push({ tokens: currentLine, isLast: true, width: currentLineWidth });
        }

        // Render lines
        lines.forEach(line => {
            let currentX = startX;
            const isJustified = justify && !line.isLast;
            
            let spaceCount = 0;
            if (isJustified) {
                spaceCount = line.tokens.filter(t => t.text.trim() === '').length;
            }
            
            const extraSpacePerGap = (isJustified && spaceCount > 0) ? ((maxWidth - line.width) / spaceCount) : 0;

            line.tokens.forEach(t => {
                doc.setFont('Times', t.bold ? 'bold' : 'normal');
                if (t.url) doc.setTextColor(0, 0, 255);
                else doc.setTextColor(0, 0, 0);

                const tWidth = doc.getTextWidth(t.text);
                const isSpace = t.text.trim() === '';

                if (!isSpace) {
                    if (t.url) {
                        doc.textWithLink(t.text, currentX, currentY, { url: t.url });
                        doc.setDrawColor(0, 0, 255);
                        doc.setLineWidth(0.2);
                        doc.line(currentX, currentY + 0.5, currentX + tWidth, currentY + 0.5);
                    } else {
                        doc.text(t.text, currentX, currentY);
                    }
                }

                currentX += tWidth;
                if (isSpace) {
                    currentX += extraSpacePerGap;
                }
            });
            currentY += lineHeight;
        });

        doc.setTextColor(0, 0, 0); // reset color
        doc.setDrawColor(0); // reset draw color for future lines/rects
        return currentY - lineHeight;
    }

    // Header Logos
    const seal1 = await loadImageForPDF('/images/logos/DepEd Seal.png');
    if (seal1) doc.addImage(seal1, 'PNG', PAGE_WIDTH/2 - 17.5, 2.5, 35, 20);

    // Header Text
    if (hasCustomFont) {
        doc.setFont("Canterbury", "bold");
        doc.setFontSize(11);
    } else {
        doc.setFont("Times", "bold");
        doc.setFontSize(11);
    }
    doc.setTextColor(0);
    doc.text("Republic of the Philippines", PAGE_WIDTH/2, 27, { align: "center" });
    
    if (hasCustomFont) {
        doc.setFont("Canterbury", "bold");
        doc.setFontSize(18);
    } else {
        doc.setFont("Times", "bold");
        doc.setFontSize(18);
    }
    doc.text("Department of Education", PAGE_WIDTH/2, 33, { align: "center" });
    
    doc.setFont("Times", "bold");
    doc.setFontSize(10);

    doc.text("REGION X- NORTHERN MINDANAO", PAGE_WIDTH/2, 38, { align: "center" });
    doc.text("SCHOOLS DIVISION OF ILIGAN CITY", PAGE_WIDTH/2, 42, { align: "center" });

    // Title
    doc.setLineWidth(.5);
    doc.line(MARGIN, 44, PAGE_WIDTH - MARGIN, 44);
    
    doc.setFont("Times", "bold");
    doc.setFontSize(18);
    const isDisqualified = data.applicant?.status === 'DISQUALIFIED' || data.status === 'DISQUALIFIED';
    const titleText = isDisqualified ? "NOTICE OF DISQUALIFICATION" : "NOTICE OF QUALIFICATION";
    doc.text(titleText, PAGE_WIDTH/2, 51, { align: "center" });
    
    doc.line(MARGIN, 54, PAGE_WIDTH - MARGIN, 54);

    // Date
    const d = new Date();
    const dateStr = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.setFont('Times', 'normal');
    doc.setFontSize(11);
    doc.text(dateStr, MARGIN, 64);

    // Applicant Name & Address
    const appName = data.name || data.applicant?.firstName + ' ' + data.applicant?.lastName || 'Unknown Applicant';
    doc.setFont('Times', 'bold');
    doc.text(appName.toUpperCase(), MARGIN, 74);
    doc.setFont('Times', 'normal');
    const address = data.address || data.applicant?.address || 'Iligan City';
    doc.text(address, MARGIN, 79);

    // Salutation
    const sex = data.sex || data.applicant?.sex;
    const title = sex === 'Female' ? 'Madam' : 'Sir';
    doc.setFont('Times', 'bold');
    doc.text(`Dear ${title}:`, MARGIN, 89);

    // P1
    doc.setFont('Times', 'normal');
    const pos = data.position || data.applicant?.position || 'Position';
    
    const p1Arr = [
        { text: 'We are pleased to inform you that based on the initial evaluation, we have found your qualifications to be substantial vis-à-vis the Civil Service Commission (CSC) approved Qualification Standards (QS) of ', bold: false },
        { text: pos, bold: true },
        { text: ' position under ', bold: false },
        { text: 'Department of Education, Division of Iligan City', bold: true },
        { text: '. Below are the results of the initial evaluation conducted by the undersigned dated ', bold: false },
        { text: dateStr + ':', bold: true }
    ];
    
    let currentY = printMixedText(doc, p1Arr, MARGIN, 99, CONTENT_WIDTH);

    // Table
    let startY = currentY + 5;
    doc.setLineWidth(0.5);
    doc.setDrawColor(0);
    
    doc.setFont('Times', 'bold');
    doc.setFontSize(10);
    
    const col1Width = CONTENT_WIDTH * 0.15;
    const col2Width = CONTENT_WIDTH * 0.35;
    const col3Width = CONTENT_WIDTH * 0.35;
    const col4Width = CONTENT_WIDTH * 0.15;

    const col1 = MARGIN + col1Width;
    const col2 = col1 + col2Width;
    const col3 = col2 + col3Width;

    doc.rect(MARGIN, startY, CONTENT_WIDTH, 15);
    doc.line(col1, startY, col1, startY + 15);
    doc.line(col2, startY, col2, startY + 15);
    doc.line(col3, startY, col3, startY + 15);

    doc.text('POSITION\nAPPLIED\nFOR', MARGIN + (col1Width / 2), startY + 5, { align: 'center' });
    doc.text('CSC-approved QS of the\nPOSITION', col1 + (col2Width / 2), startY + 7, { align: 'center' });
    doc.text('YOUR QUALIFICATIONS', col2 + (col3Width / 2), startY + 9, { align: 'center' });
    doc.text('REMARKS', col3 + (col4Width / 2), startY + 9, { align: 'center' });

    const getRemark = (items) => {
        if(!items || items.length === 0) return 'Disqualified';
        if(items.some(i => i.status === 'DISQUALIFIED')) return 'Disqualified';
        if(items.some(i => i.status === 'PENDING' || !i.status)) return 'Pending';
        return 'Qualified';
    };

    const cleanText = (txt) => {
        if (!txt) return '';
        return String(txt).replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    };

    const rows = [
        { qs: 'Education: ' + cleanText(data.positionStandards?.qsEducation || 'N/A'), app: cleanText((data.education || []).map(e => e.degree || e.title).join(', ')) || 'None', rm: getRemark(data.education) },
        { qs: 'Training: ' + cleanText(data.positionStandards?.qsTraining || 'N/A'), app: cleanText((data.training || []).map(e => e.title).join(', ')) || 'None', rm: getRemark(data.training) },
        { qs: 'Experience: ' + cleanText(data.positionStandards?.qsExperience || 'N/A'), app: cleanText((data.experience || []).map(e => e.details).join(', ')) || 'None', rm: getRemark(data.experience) },
        { qs: 'Eligibility: ' + cleanText(data.positionStandards?.qsEligibility || 'N/A'), app: cleanText((data.eligibility || []).map(e => e.title || e.details).join(', ')) || 'None', rm: getRemark(data.eligibility) }
    ];

    currentY = startY + 15;
    
    const qsColWrap = col2Width - 3;
    const appColWrap = col3Width - 3;

    doc.setFont('Times', 'normal'); // Critical: splitTextToSize depends on font!
    const tableHeight = rows.reduce((acc, row) => {
        const qsContent = row.qs.substring(row.qs.indexOf(':') + 2);
        const qsContentLines = doc.splitTextToSize(qsContent, qsColWrap).filter(l => l.trim() !== '');
        const qsTotalLines = 1 + qsContentLines.length;
        
        const appLines = doc.splitTextToSize(row.app, appColWrap).filter(l => l.trim() !== '');
        const maxLines = Math.max(qsTotalLines, appLines.length);
        return acc + Math.max(6, maxLines * 4.2 + 1.3);
    }, 0);

    doc.rect(MARGIN, currentY, CONTENT_WIDTH, tableHeight);
    doc.line(col1, currentY, col1, currentY + tableHeight);
    doc.line(col2, currentY, col2, currentY + tableHeight);
    doc.line(col3, currentY, col3, currentY + tableHeight);

    // Print Position Name in the first column, vertically centered in the overall table
    const posLines = doc.splitTextToSize(pos, col1Width - 2).filter(l => l.trim() !== '');
    doc.setFont('Times', 'normal');
    doc.text(posLines, MARGIN + (col1Width / 2), currentY + (tableHeight/2) - ((posLines.length * 4.2)/2) + 1.5, { align: 'center' });

    rows.forEach((row, i) => {
        doc.setFont('Times', 'normal');
        const qsContent = row.qs.substring(row.qs.indexOf(':') + 2);
        const qsContentLines = doc.splitTextToSize(qsContent, qsColWrap).filter(l => l.trim() !== '');
        const qsTotalLines = 1 + qsContentLines.length;
        
        const appLines = doc.splitTextToSize(row.app, appColWrap).filter(l => l.trim() !== '');
        const maxLines = Math.max(qsTotalLines, appLines.length);
        const rowHeight = Math.max(6, maxLines * 4.2 + 1.3);

        if(i > 0) doc.line(col1, currentY, PAGE_WIDTH - MARGIN, currentY); // inner horizontal lines

        doc.setFont('Times', 'bold');
        doc.text(row.qs.split(':')[0] + ':', col1 + 1, currentY + 4);
        doc.setFont('Times', 'normal');
        doc.text(qsContentLines, col1 + 1, currentY + 8.2);
        
        doc.text(appLines, col2 + 1, currentY + 4);
        doc.text(row.rm, col3 + (col4Width / 2), currentY + (rowHeight/2) + 1.2, { align: 'center' });

        currentY += rowHeight;
    });

    currentY += 5;
    doc.setFont('Times', 'normal');
    doc.setFontSize(11);
    
    if (isDisqualified) {
        const customReason = data.disqualificationReason || data.applicant?.disqualificationReason;
        const reasonText = customReason || 'Pursuant to Section 21 of DO 7 s. 2023 provides that "Individuals who failed to submit complete mandatory documents (Items 20.a to 20.j) on the set deadline indicated in the official memorandum shall not be included in the pool of official applicants.” and upon reviewing your submitted documents, you failed to meet the complete mandatory requirements or qualifications.';
        
        const p2Arr = [
            { text: reasonText.trim() + ' Thus, we regret that you cannot proceed for the next stage of the selection process for ', bold: false },
            { text: pos, bold: true },
            { text: ' position. You may, however, continue to submit job applications in response to other vacancy announcements that we publish at ', bold: false },
            { text: 'www.csc.gov.ph/careers', bold: false, url: 'https://www.csc.gov.ph/careers' },
            { text: ', DepEd bulletin Boards, and official website ', bold: false },
            { text: 'www.depediligan.com/index.php/category/careers/', bold: false, url: 'https://www.depediligan.com/index.php/category/careers/' },
            { text: '.', bold: false }
        ];
        currentY = printMixedText(doc, p2Arr, MARGIN, currentY, CONTENT_WIDTH) + 10;
    }

    const appCode = data.applicationCode || data.applicant?.applicationCode || '[Application Code]';
    const p3Arr = [
        { text: 'The results of the initial evaluation shall be released and posted for transparency purposes. You may refer to your assigned application code ', bold: false },
        { text: appCode, bold: true },
        { text: ' in the official postings of the results.', bold: false }
    ];
    currentY = printMixedText(doc, p3Arr, MARGIN, currentY, CONTENT_WIDTH) + 10;

    doc.text('Thank you and we wish you the best of luck in your future success.', MARGIN, currentY);
    
    currentY += 10;
    doc.text('Very truly yours,', MARGIN, currentY);
    
    currentY += 10;
    doc.setFont('Times', 'bold');
    doc.text('AZOR B. QUIJANO', MARGIN, currentY);
    doc.setFont('Times', 'normal');
    doc.text('Administrative Officer IV (Personnel)', MARGIN, currentY + 5);

    // Footer
    doc.setLineWidth(.5);
    doc.line(MARGIN, 274, PAGE_WIDTH - MARGIN, 274);

    const seal2_foot = await loadImageForPDF('/images/logos/DepEd Logo.png');
    const seal3_foot = await loadImageForPDF('/images/logos/bagong-pilipinas-seeklogo.png');
    const seal4_foot = await loadImageForPDF('/images/logos/Deped Division of Iligan City.png');
    
    if (seal2_foot) doc.addImage(seal2_foot, "PNG", MARGIN + 2.5, 278.5, 22.5, 12.5);
    if (seal3_foot) doc.addImage(seal3_foot, "PNG", MARGIN + 36.5, 276.5, 17.5, 17.5);
    if (seal4_foot) doc.addImage(seal4_foot, "PNG", MARGIN + 65, 276.5, 17.5, 17.5);

    doc.setFontSize(7.5);
    doc.setTextColor(100);
    doc.setFont("Times", "bold");
    doc.text("Address:", MARGIN + 90, 277, { align: "left" });
    doc.setFont("Times", "normal");
    doc.text("Gen. Aguinaldo St., Iligan City", MARGIN + 101, 277, { align: "left" });
    doc.setFont("Times", "bold");
    doc.text("Email Address:", MARGIN + 90, 280, { align: "left" });
    doc.setFont("Times", "normal");
    doc.text("iligan.city@deped.gov.ph", MARGIN + 108, 280, { align: "left" });
    doc.setFont("Times", "bold");
    doc.text("Website:", MARGIN + 90, 283, { align: "left" });
    doc.setFont("Times", "normal");
    doc.text("www.depediligan.com", MARGIN + 101, 283, { align: "left" });

    // Document Control Table in Footer
    doc.setLineWidth(0.2);
    doc.rect(MARGIN + 90, 285, 59.2, 8); // x, y, w, h
    doc.line(MARGIN + 90, 289, MARGIN + 149.2, 289); // middle horizontal
    
    // Vertical lines for 4 columns
    doc.line(MARGIN + 110, 285, MARGIN + 110, 293); // vert 1 (between col 1 & 2)
    doc.line(MARGIN + 126, 285, MARGIN + 126, 293); // vert 2 (between col 2 & 3)
    doc.line(MARGIN + 135, 285, MARGIN + 135, 293); // vert 3 (between col 3 & 4)

    doc.setFontSize(6);
    doc.setFont("Times", "bold");
    
    // Column 1
    doc.text("Doc. Ref. Code", MARGIN + 92, 288);
    doc.text("Effectivity", MARGIN + 92, 292);
    
    // Column 3
    doc.text("Rev", MARGIN + 128, 288);
    doc.text("Page", MARGIN + 128, 292);
    
    // Column 4 (Fields for Col 3)
    doc.setFont("Times", "normal");
    doc.text("00", MARGIN + 137, 288);
    doc.text("1 of 1", MARGIN + 137, 292);

    doc.save(`Initial_Eval_${appName.replace(/\s+/g, '_')}.pdf`);
    const timeMs = Date.now() - startTimeMs;
    try {
        fetch('/api/logs/pdf-export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicantCode: appCode, pdfName: 'Initial_Eval', timeMs })
        });
    } catch(e) {}
}
