// Shared Document Header and Footer Generator

const _cachedImages = {};

window.getBase64ImageFromUrl = async (imageUrl) => {
    if (_cachedImages[imageUrl]) return _cachedImages[imageUrl];
    try {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                _cachedImages[imageUrl] = reader.result;
                resolve(reader.result);
            };
            reader.onerror = () => resolve('');
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        return '';
    }
};

window.getDocHeader = async function(isInitialEval = false, customTitleHtml = '', docTitle = 'ASSIGNMENT ORDER') {
    const seal1 = await window.getBase64ImageFromUrl('/images/logos/image1.png');
    
    if (isInitialEval) {
        if (!customTitleHtml && docTitle) {
            customTitleHtml = `
                <div style="margin-top: 0px; margin-bottom: 0px; margin-left: 0in; line-height: 0;">
                    <v:line from="0,0" to="6.57in,0" strokecolor="black" strokeweight="1.5pt" />
                </div>
                <div style="text-align: center; margin-top: 15px; margin-bottom: 15px;">
                    <div style="font-size: 18pt; font-weight: bold;">${docTitle}</div>
                </div>
                <div style="margin-top: 0px; margin-bottom: 0px; margin-left: 0in; line-height: 0;">
                    <v:line from="0,0" to="6.57in,0" strokecolor="black" strokeweight="1.5pt" />
                </div>
            `;
        }
        return `
            <div style="text-align: center;">
                <p style="text-align: center; margin: 0; padding: 0; mso-margin-top-alt: 0; mso-margin-bottom-alt: 0;">
                    <img src="${seal1}" width="73" height="73" style="margin: 0; padding: 0;" />
                </p>
                <div style="margin-bottom: 0px; font-size: 11pt; font-family: 'Canterbury', 'Old English Text MT', serif; font-weight: bold;">Republic of the Philippines</div>
                <div style="margin-bottom: 0px; font-size: 14pt; font-family: 'Canterbury', 'Old English Text MT', serif; font-weight: bold; mso-margin-bottom-alt: 0;">Department of Education</div>
                <div style="margin-top: 5px; margin-bottom: 0px; font-size: 10pt; font-weight: bold; mso-margin-top-alt: 5px; mso-margin-bottom-alt: 0;">REGION X- NORTHERN MINDANAO</div>
                <div style="margin-bottom: 0px; font-size: 10pt; font-weight: bold; mso-margin-bottom-alt: 0;">SCHOOLS DIVISION OF ILIGAN CITY</div>
            </div>
            ${customTitleHtml}
        `;
    }
    
    return `
        <p style="text-align: center; margin: 0; padding: 0; mso-margin-top-alt: 0; mso-margin-bottom-alt: 0;">
            <img src="${seal1}" width="73" height="73" style="margin: 0; padding: 0;" />
        </p>
        <p style="text-align: center; font-size: 11pt; font-family: 'Old English Text MT', serif; margin: 0; margin-top: 5px; padding: 0; mso-margin-top-alt: 5px; mso-margin-bottom-alt: 0;">Republic of the Philippines</p>
        <p style="text-align: center; font-size: 14pt; font-family: 'Old English Text MT', serif; font-weight: bold; margin: 0; padding: 0; mso-margin-top-alt: 0; mso-margin-bottom-alt: 0;">Department of Education</p>
        <p style="text-align: center; font-size: 10pt; font-family: 'Trajan Pro', serif; margin: 0; margin-top: 5px; padding: 0; mso-margin-top-alt: 5px; mso-margin-bottom-alt: 0;">Region X-Northern Mindanao</p>
        <p style="text-align: center; font-size: 10pt; font-family: 'Trajan Pro', serif; margin: 0; padding: 0; mso-margin-top-alt: 0; mso-margin-bottom-alt: 0;">SCHOOLS DIVISION OF ILIGAN CITY</p>
        <div style="text-align: center; margin-top: 15px;">
            <div style="margin-top: 0px; margin-bottom: 0px; margin-left: 0in; line-height: 0;">
                <v:line from="0,0" to="6.57in,0" strokecolor="black" strokeweight="1.5pt" />
            </div>
            <div style="font-size: 14pt; font-family: 'Bookman Old Style', serif; font-weight: bold;">${docTitle}</div>
            <div style="margin-top: 0px; margin-bottom: 0px; margin-left: 0in; line-height: 0;">
                <v:line from="0,0" to="6.57in,0" strokecolor="black" strokeweight="1.5pt" />
            </div>
        </div>
        ${customTitleHtml}
    `;
};

window.getDocFooter = async function(showInitials = true) {
    const seal2 = await window.getBase64ImageFromUrl('/images/logos/image3.png');
    const seal4 = await window.getBase64ImageFromUrl('/images/logos/image2.png');
    
    let initialsHtml = '';
    if (showInitials) {
        const d = new Date();
        const dateStrForInitials = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
        initialsHtml = `
            <div style="font-size: 6pt; font-weight: bold; font-family: 'Bookman Old Style', serif; margin-bottom: 2px;">
                JSD/MPM/ABQ/KMJ - ${dateStrForInitials}
            </div>
        `;
    }
    
    return `
        ${initialsHtml}
        <div style="margin-top: 10px; margin-bottom: 5px; margin-left: -0.15in; line-height: 0;">
            <v:line from="0,0" to="6.57in,0" strokecolor="black" strokeweight="2.25pt" />
        </div>
        <table style="width: 100%; font-family: Calibri, sans-serif; font-size: 7.5pt; color: #555;">
            <tr>
                <td style="width: 50%; vertical-align: middle; padding-right: 10px;">
                    <table style="width: 100%;" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="width: 66.67%; text-align: left; vertical-align: middle;">
                                <img src="${seal2}" width="207" height="80" style="object-fit: contain;" />
                            </td>
                            <td style="width: 33.33%; text-align: right; vertical-align: middle;">
                                <img src="${seal4}" width="73" height="73" />
                            </td>
                        </tr>
                    </table>
                </td>
                <td style="width: 50%; vertical-align: top; padding-left: 15px;">
                    <div style="padding: 0;">
                        <table style="width: 100%; font-size: 7.5pt; color: #000;">
                            <tr>
                                <td style="font-weight: bold; width: 80px;">Address:</td>
                                <td>Gen. Aguinaldo St., Iligan City</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold;">Email Address:</td>
                                <td>iligan.city@deped.gov.ph</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold;">Website:</td>
                                <td>www.depediligan.com</td>
                            </tr>
                        </table>
                        <table border="1" style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 6pt; text-align: center; border-color: #000; color: #000;">
                            <tr>
                                <td style="font-weight: bold; padding: 2px;">Doc. Ref. Code</td>
                                <td style="font-weight: bold; padding: 2px;">Rev</td>
                                <td style="padding: 2px;">00</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; padding: 2px;">Effectivity</td>
                                <td style="font-weight: bold; padding: 2px;">Page</td>
                                <td style="padding: 2px;">1 of 1</td>
                            </tr>
                        </table>
                    </div>
                </td>
            </tr>
        </table>
    `;
};
