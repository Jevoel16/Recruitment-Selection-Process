param($docxPath, $pdfPath)
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open($docxPath)
$doc.ExportAsFixedFormat($pdfPath, 17, $false, 1)
$doc.Close($false)
$word.Quit()
