$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0 # wdAlertsNone

$templatesDir = "C:\Users\Admin\Desktop\Personnel - RSP\Recruitment-Selection-Process\rsp-dashboard\public\templates"
$files = Get-ChildItem -Path $templatesDir -Filter "*.docx"

foreach ($file in $files) {
    Write-Output "Processing: $($file.Name)"
    $doc = $word.Documents.Open($file.FullName, $false, $false)
    $doc.MailMerge.MainDocumentType = 0 # Convert to normal word doc
    
    # Loop backwards because deleting fields changes the collection
    for ($i = $doc.Fields.Count; $i -ge 1; $i--) {
        $field = $doc.Fields.Item($i)
        if ($field.Type -eq 59) { # 59 = wdFieldMergeField
            $code = $field.Code.Text
            if ($code -match "MERGEFIELD\s+([^\s\\]+)") {
                $tagName = $matches[1]
                $field.Select()
                $word.Selection.TypeText("{$tagName}")
            }
        }
    }
    
    $doc.Save()
    $doc.Close()
}

$word.Quit()
Write-Output "Done converting all templates!"
$fields | Write-Output
