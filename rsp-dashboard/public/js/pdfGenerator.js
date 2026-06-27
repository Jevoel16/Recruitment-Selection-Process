// Generate PDF Letter using jsPDF directly (vector rendering matching scan template)
const loadImageForPDF = (src) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
});

window.printLetter = async function(name, office, dateStr, category, applicationCode) {
    const { jsPDF } = window.jspdf || window;
    if (!jsPDF) {
        alert('jsPDF library failed to load. Please try again.');
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
    doc.text("LEONARDA LUNA ARAZO", 30, currentY + 35);
    doc.setFont("Times", "normal");
    doc.text("School Principal I", 30, currentY + 40);
    
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
    doc.save(`${name.replace(/\s+/g, '_')}_assignment_order.pdf`);
}
