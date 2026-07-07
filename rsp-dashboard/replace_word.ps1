$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

$templatesDir = "C:\Users\Admin\Desktop\Personnel - RSP\Recruitment-Selection-Process\rsp-dashboard\public\templates"
$files = Get-ChildItem -Path $templatesDir -Filter "Notice*.docx"

$replacements = @{
    "May 23, 2025" = "{FormattedDate}"
    "RAMI KPOP DEHUNTERS" = "{ApplicantName}"
    "ZOEY KPOP DEHUNTERS" = "{ApplicantName}"
    "MIRA KPOP DEHUNTERS" = "{ApplicantName}"
    "GWI-MA SOUL EATER" = "{ApplicantName}"
    "Teacher III (Special Science Teacher I)" = "{Position}"
    "T3(SST1)-DOP-015" = "{ApplicationCode}"
    "JSD/MPM/ABQ/KMJ - 05/23/2025" = "{Remarks}"
    "Master’s Degree in relevant strand/subject" = "{QSEducation}"
    "BA in Sociology" = "{AppEducation}"
    "Bachelor of Secondary Education (BSED)" = "{AppEducation}"
    "4 years of relevant teaching/ industry work experience" = "{QSExperience}"
    "Cash Management and Control System (24 month)" = "{AppExperience}"
    "12 hours of training relevant to the subject area specialization" = "{QSTraining}"
    "Administrative Aide III (Clerk I) - (1 yr & 7 mos)" = "{AppTraining}"
    "Ra 1080" = "{QSEligibility}"
    "Honor Graduate Eligibility" = "{AppEligibility}"
    "Pursuant to Section 21 of DO 7 s. 2023 provides that ""Individuals who failed to submit complete mandatory documents (Items 20.a to 20.j) on the set deadline indicated in the official memorandum shall not be included in the pool of official applicants.” and upon reviewing your submitted documents, you failed to meet the complete mandatory requirements or qualifications." = "{ReasonText}"
    "Pursuant to Section 21 of DO 7 s. 2023 provides that ""Individuals who failed to submit complete mandatory documents (Items 20.a to 20.j) on the set deadline indicated in the official memorandum shall not be included in the pool of official applicants.” and upon reviewing your submitted documents, you failed to submit Omnibus Sworn Statement." = "{ReasonText}"
    "Pursuant to Section 21 of DO 7 s. 2023 provides that ""Individuals who failed to submit complete mandatory documents (Items 20.a to 20.j) on the set deadline indicated in the official memorandum shall not be included in the pool of official applicants.” and upon reviewing your submitted documents, your Omnibus Sworn Statement is not notarized." = "{ReasonText}"
}

foreach ($file in $files) {
    Write-Output "Processing $($file.Name)"
    $doc = $word.Documents.Open($file.FullName, $false, $false)
    
    foreach ($key in $replacements.Keys) {
        $findText = $key
        $replaceText = $replacements[$key]
        
        $find = $doc.Content.Find
        $find.ClearFormatting()
        $find.Text = $findText
        $find.Replacement.ClearFormatting()
        $find.Replacement.Text = $replaceText
        $find.Execute([ref]$missing, [ref]$missing, [ref]$missing, [ref]$missing, [ref]$missing, [ref]$missing, [ref]$true, [ref]1, [ref]$false, [ref]$missing, [ref]2) | Out-Null
    }
    
    $doc.Save()
    $doc.Close()
}

$word.Quit()
Write-Output "Done Word Find and Replace"
