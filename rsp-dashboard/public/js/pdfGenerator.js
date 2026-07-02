// Generate PDF Letter using jsPDF directly (vector rendering matching scan template)
const loadImageForPDF = (src) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
});

window.printLetter = async function(id, name, office, dateStr, category, applicationCode, ccName, ccDesignation) {
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

    // Helper function for inline rich text rendering (handles <b> tags for key values)
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

    // Format Date using the current date
    const d = new Date();
    const formattedDate = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Map applicant category to professional rank titles
    let rankTitle = 'Teacher I';

    // Parse order number from application code sequence suffix
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

    // Fetch and register Canterbury custom font from server `/fonts/Canterbury.ttf`
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

    // Draw Seals Placement Outlines
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    const seal1 = await loadImageForPDF('/images/logos/DepEd Seal.png');
    if (seal1) doc.addImage(seal1, "PNG", 92.5, 2.5, 25, 15);

    // Top Header Text using Canterbury custom font
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

    // Date (Right-aligned)
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

    // Save and download PDF
    const currentDate = new Date();
    const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
    const yyyy = currentDate.getFullYear();
    const formattedDateStr = `${mm}${yyyy}`;
    doc.save(`AO-${name.replace(/\s+/g, '_')}-${formattedDateStr}.pdf`);
    
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
        console.error('Failed to load Canterbury font', err);
    }

    const seal1 = await loadImageForPDF('/images/logos/DepEd Seal.png');
    if (seal1) doc.addImage(seal1, 'PNG', 92.5, 2.5, 25, 15);

    doc.setFont('Times', 'bold');
    doc.setFontSize(10);
    doc.rect(160, 10, 30, 8);
    doc.text('ANNEX E-3', 175, 15.5, { align: 'center' });

    if (hasCustomFont) {
        doc.setFont("Canterbury", "normal");
        doc.setFontSize(11);
    } else {
        doc.setFont("Times", "normal");
        doc.setFontSize(11);
    }
    doc.setTextColor(0);
    doc.text("Republic of the Philippines", 105, 23, { align: "center" });
    
    if (hasCustomFont) {
        doc.setFont("Canterbury", "normal");
        doc.setFontSize(16);
    } else {
        doc.setFont("Times", "bold");
        doc.setFontSize(16);
    }
    doc.text("Department of Education", 105, 28, { align: "center" });
    
    doc.setFont("Times", "bold");
    doc.setFontSize(10);
    doc.text("REGION X-NORTHERN MINDANAO", 105, 33, { align: "center" });
    doc.text("PERSONNEL DIVISION", 105, 37, { align: "center" });

    const d = new Date();
    const dateStr = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    doc.setFont('Times', 'normal');
    doc.setFontSize(11);
    doc.text(dateStr, 20, 50);

    const appName = data.name || 'Unknown Applicant';
    doc.setFont('Times', 'bold');
    doc.text(appName.toUpperCase(), 20, 60);
    
    doc.setFont('Times', 'normal');
    const address = data.address || 'Iligan City';
    doc.text(address, 20, 65);

    doc.text(`Dear ${appName.split(' ')[0]},`, 20, 80);
    doc.setFont('Times', 'bold');
    doc.text('Congratulations!', 20, 90);

    doc.setFont('Times', 'normal');
    const pos = data.position || 'Applicant';
    const office = data.assignedOffice || 'Schools Division of Iligan City';
    
    const p1 = `We are pleased to inform you that based on the initial evaluation, we have found your qualifications to be substantial vis-a-vis the Civil Service Commission (CSC) approved Qualification Standards (QS) of ${pos} position under ${office}. Below are the results of the initial evaluation conducted by the undersigned dated ${dateStr}:`;
    
    const lines = doc.splitTextToSize(p1, 170);
    doc.text(lines, 20, 100);

    let startY = 125;
    doc.setDrawColor(0);
    doc.setFillColor(230, 230, 230);
    doc.rect(20, startY, 170, 8, 'F');
    doc.rect(20, startY, 170, 8);
    
    doc.setFont('Times', 'bold');
    doc.setFontSize(9);
    doc.text('Position Applied for', 22, startY + 5);
    doc.text('CSC-approved QS', 57, startY + 5);
    doc.text('Your Qualifications', 107, startY + 5);
    doc.text('Remarks', 162, startY + 5);

    const getRemark = (items) => {
        if(!items || items.length === 0) return 'Disqualified';
        if(items.some(i => i.status === 'DISQUALIFIED')) return 'Disqualified';
        if(items.some(i => i.status === 'PENDING' || !i.status)) return 'Pending';
        return 'Qualified';
    };

    const rows = [
        { qs: 'Education: \n' + (data.positionStandards?.qsEducation || 'N/A'), app: (data.education || []).map(e => e.degree || e.title).join(', ') || 'None', rm: getRemark(data.education) },
        { qs: 'Experience: \n' + (data.positionStandards?.qsExperience || 'N/A'), app: (data.experience || []).map(e => e.details).join(', ') || 'None', rm: getRemark(data.experience) },
        { qs: 'Training: \n' + (data.positionStandards?.qsTraining || 'N/A'), app: (data.training || []).map(e => e.title).join(', ') || 'None', rm: getRemark(data.training) },
        { qs: 'Eligibility: \n' + (data.positionStandards?.qsEligibility || 'N/A'), app: (data.eligibility || []).map(e => e.title || e.details).join(', ') || 'None', rm: getRemark(data.eligibility) === 'Qualified' ? 'Eligible' : getRemark(data.eligibility) }
    ];

    let currentY = startY + 8;
    doc.setFont('Times', 'normal');

    rows.forEach((row, i) => {
        const qsLines = doc.splitTextToSize(row.qs, 46);
        const appLines = doc.splitTextToSize(row.app, 51);
        const maxLines = Math.max(qsLines.length, appLines.length);
        const rowHeight = Math.max(10, maxLines * 5);

        doc.rect(20, currentY, 170, rowHeight);
        if (i === 0) {
            const titleLines = doc.splitTextToSize(pos, 31);
            doc.setFont('Times', 'bold');
            doc.text(titleLines, 22, currentY + 5);
            doc.setFont('Times', 'normal');
        }
        doc.text(qsLines, 57, currentY + 5);
        doc.text(appLines, 107, currentY + 5);
        doc.text(row.rm, 162, currentY + 5);

        doc.line(55, currentY, 55, currentY + rowHeight);
        doc.line(105, currentY, 105, currentY + rowHeight);
        doc.line(160, currentY, 160, currentY + rowHeight);

        currentY += rowHeight;
    });

    currentY += 10;
    doc.setFont('Times', 'normal');
    doc.setFontSize(11);
    const appCode = data.applicationCode || '[Application Code]';
    const p2 = `Please be advised of your assigned application code ${appCode} which shall be used as you proceed with the next stage of the selection process. You may refer to the official issuances of SDO Iligan City for the additional announcements in this regard.`;
    doc.text(doc.splitTextToSize(p2, 170), 20, currentY);

    currentY += 15;
    doc.text('For inquiries, you may contact personnel000@deped.gov.ph.', 20, currentY);

    currentY += 10;
    doc.text('Thank you.', 20, currentY);

    currentY += 15;
    doc.text('Very truly yours,', 20, currentY);

    currentY += 25;
    doc.setFont('Times', 'bold');
    doc.text('HRMO DESIGNATE', 20, currentY);
    doc.setFont('Times', 'normal');
    doc.text('Human Resource Management Officer', 20, currentY + 5);

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('(Insert Office Address)', 20, 275);
    doc.text('(Insert Telephone Nos.): (02) 0000-0000 Insert Email Address: personnel000@deped.gov.ph', 20, 280);

    doc.save(`Initial_Eval_${appName.replace(/\\s+/g, '_')}.pdf`);
}
