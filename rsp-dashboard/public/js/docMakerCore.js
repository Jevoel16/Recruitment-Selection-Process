// Core utilities for generating Word documents from HTML and handling modals

window.getOrSetDocDate = async function(id, docType, applicantData) {
    let docDates = {};
    const applicantObj = applicantData.applicant || applicantData;
    if (applicantObj && applicantObj.doc_dates) {
        try {
            docDates = typeof applicantObj.doc_dates === 'string' ? JSON.parse(applicantObj.doc_dates) : applicantObj.doc_dates;
        } catch(e) {}
    }
    
    let dateStr = docDates[docType];
    let d = new Date();
    
    if (!dateStr) {
        dateStr = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        try {
            fetch('/api/applicants/' + id + '/doc-date', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ docType, dateStr })
            });
        } catch(e) { console.error('Failed to save doc date', e); }
    } else {
        d = new Date(dateStr);
    }
    
    return { dateStr, d };
};

window.exportFromTemplate = async (templateUrl, data, filename) => {
    try {
        window.showToast("Generating document...", "info");
        // Use a static version parameter to allow the browser to cache the 3MB template!
        const response = await fetch(templateUrl + "?v=2.0");
        if (!response.ok) throw new Error("Could not fetch template: " + response.statusText);
        const arrayBuffer = await response.arrayBuffer();

        const zip = new PizZip(arrayBuffer);
        const doc = new window.docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        doc.render(data);

        // Generate blob for DOCX download
        const outBlob = doc.getZip().generate({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        // Download the DOCX
        saveAs(outBlob, filename);
        window.showToast("Word document generated successfully.", "success");
    } catch (error) {
        console.error("Error generating document:", error);
        alert("Failed to generate document from template: " + (error.message || error));
    }
};

window.exportToDoc = (htmlContent, headerHtml, footerHtml, filename) => {
    const header = `<html xmlns:v="urn:schemas-microsoft-com:vml"
xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns:m="http://schemas-microsoft.com/office/2004/12/omml"
xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset='utf-8'>
<style>
    @page WordSection1 {
        size: 8.27in 11.69in; /* A4 */
        margin: 0.5in 1in 0.5in 1in;
        mso-header-margin: 0.3in;
        mso-footer-margin: 0.6in;
        mso-header: h1;
        mso-footer: f1;
    }
    div.WordSection1 { page: WordSection1; font-family: 'Bookman Old Style', serif; font-size: 11pt; color: black; }
    p { margin: 0; padding: 0; }
    table#hrdftrtbl { margin: 0in 0in 0in 900in; width: 1px; height: 1px; overflow: hidden; }
</style></head><body><div class="WordSection1">`;
    
    const footer = `</div>
<table id="hrdftrtbl" border="0" cellspacing="0" cellpadding="0">
<tr>
    <td>
        <div style="mso-element:header" id="h1">
            <div style="font-family: 'Bookman Old Style', serif; font-size: 11pt; color: black; text-align: center;">
                ${headerHtml}
            </div>
        </div>
    </td>
    <td>
        <div style="mso-element:footer" id="f1">
            <div style="font-family: Calibri, sans-serif; font-size: 11pt; color: black;">
                ${footerHtml}
            </div>
        </div>
    </td>
</tr>
</table>
</body></html>`;

    const sourceHTML = header + htmlContent + footer;
    
    // Change extension to .docx
    if (filename.endsWith('.doc')) filename = filename.replace('.doc', '.docx');

    if (window.htmlDocx) {
        const converted = htmlDocx.asBlob(sourceHTML, {orientation: 'portrait', margins: {top: 720, right: 1440, bottom: 720, left: 1440}});
        const url = URL.createObjectURL(converted);
        const fileDownload = document.createElement("a");
        document.body.appendChild(fileDownload);
        fileDownload.href = url;
        fileDownload.download = filename;
        fileDownload.click();
        document.body.removeChild(fileDownload);
        URL.revokeObjectURL(url);
        window.showToast("Document generated successfully.", "success");
    } else {
        const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
        const fileDownload = document.createElement("a");
        document.body.appendChild(fileDownload);
        fileDownload.href = source;
        fileDownload.download = filename;
        fileDownload.click();
        document.body.removeChild(fileDownload);
        window.showToast("Document generated successfully.", "success");
    }
};

let currentGenericDocParams = {};

window.openGenericDocModal = function(step, id, status, docRemark, name, office, category, applicationCode, ccName, ccDesignation) {
    currentGenericDocParams = { step, id, status, docRemark, name, office, category, applicationCode, ccName, ccDesignation };
    
    const selectEl = document.getElementById('docTypeSelect');
    
    let options = [];
    if (step === 1) {
        const isQualified = status === 'QUALIFIED' || docRemark === 'Qualified' || ['WAITING_FOR_ASSESSMENT', 'ASSESSED', 'NO_APPEARANCE', 'NEWLY_PROMOTED', 'WAITING', 'ASSIGNED', 'COMPLETED'].includes(status);
        if (isQualified) {
            options = [
                { value: 'Notice to Qualified - Higher Teaching', label: 'Notice to Qualified - Higher Teaching' },
                { value: 'Notice to Qualified - Without Date of Assessment', label: 'Notice to Qualified - Without Date of Assessment' }
            ];
        } else if (status === 'DISQUALIFIED' || status === 'DISQUALIFIED_ARCHIVED' || docRemark === 'Disqualified') {
            options = [
                { value: 'Notice to DQ - Higher Teaching', label: 'Notice to DQ - Higher Teaching' },
                { value: 'Notice to DQ - No Omnibus', label: 'Notice to DQ - No Omnibus' },
                { value: 'Notice to DQ - Not notarized Omnibus', label: 'Notice to DQ - Not notarized Omnibus' },
                { value: 'Notice to DQ', label: 'Notice to DQ' }
            ];
        }
    } else if (step === 4) {
        options = [
            { value: 'Notice of Requirements - Newly Hired', label: 'Newly Hired' },
            { value: 'Notice of Requirements - Promotion', label: 'Promotion' },
            { value: 'Transfer Acceptance', label: 'Transfer Acceptance' }
        ];
    } else if (step === 5) {
        options = [
            { value: 'Assignment Order - School-Based', label: 'Assignment Order - School-Based' },
            { value: 'Assignment Order - Division Office', label: 'Assignment Order - Division Office' }
        ];
    }

    if (selectEl.choicesInstance) {
        selectEl.choicesInstance.destroy();
        delete selectEl.choicesInstance;
    }
    
    selectEl.innerHTML = '';
    options.forEach((opt, index) => {
        const isSelected = index === 0 ? 'selected' : '';
        selectEl.insertAdjacentHTML('beforeend', `<option value="${opt.value}" ${isSelected}>${opt.label}</option>`);
    });
    
    // Explicitly re-initialize Choices on this specific element to guarantee it updates perfectly
    selectEl.choicesInstance = new Choices(selectEl, {
        searchEnabled: false,
        itemSelectText: '',
        shouldSort: false,
        position: 'bottom'
    });
    
    let modalEl = document.getElementById('docTypeModal');
    let modal = bootstrap.Modal.getInstance(modalEl);
    if (!modal) {
        modal = new bootstrap.Modal(modalEl);
    }
    modal.show();
};

window.downloadSelectedDoc = function() {
    const type = document.getElementById('docTypeSelect').value;
    const p = currentGenericDocParams;
    
    const modalEl = document.getElementById('docTypeModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if(modalInstance) modalInstance.hide();
    
    if (p.step === 1) {
        if (type === 'Notice to Qualified - Higher Teaching' && window.printInitialEvalQualifiedHigherTeaching) {
            window.printInitialEvalQualifiedHigherTeaching(p.id);
        } else if (type === 'Notice to Qualified - Without Date of Assessment' && window.printInitialEvalQualifiedWithoutDate) {
            window.printInitialEvalQualifiedWithoutDate(p.id);
        } else if (type === 'Notice to DQ - Higher Teaching' && window.printInitialEvalDQHigherTeaching) {
            window.printInitialEvalDQHigherTeaching(p.id);
        } else if (type === 'Notice to DQ - No Omnibus' && window.printInitialEvalDQNoOmnibus) {
            window.printInitialEvalDQNoOmnibus(p.id);
        } else if (type === 'Notice to DQ - Not notarized Omnibus' && window.printInitialEvalDQNotNotarized) {
            window.printInitialEvalDQNotNotarized(p.id);
        } else if (type === 'Notice to DQ' && window.printInitialEvalDQ) {
            window.printInitialEvalDQ(p.id);
        }
    } else if (p.step === 4) {
        if (type === 'Notice of Requirements - Newly Hired' && window.printReqNewlyHired) {
            window.printReqNewlyHired(p.id);
        } else if (type === 'Notice of Requirements - Promotion' && window.printReqPromotion) {
            window.printReqPromotion(p.id);
        } else if (type === 'Transfer Acceptance' && window.printTransferAcceptance) {
            window.printTransferAcceptance(p.id);
        }
    } else if (p.step === 5) {
        if (type === 'Assignment Order - School-Based' && window.printAssignmentSchool) {
            window.printAssignmentSchool(p.id, p.name, p.office, '', p.category, p.applicationCode, p.ccName, p.ccDesignation, false);
        } else if (type === 'Assignment Order - Division Office' && window.printAssignmentDivision) {
            window.printAssignmentDivision(p.id, p.name, p.office, '', p.category, p.applicationCode, p.ccName, p.ccDesignation, false);
        }
    }
};
