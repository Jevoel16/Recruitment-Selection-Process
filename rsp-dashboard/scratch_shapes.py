import openpyxl

def inspect_shapes():
    wb = openpyxl.load_workbook(r"C:\Users\Admin\Downloads\sdfsd).xlsx")
    ws = wb.active
    # Openpyxl doesn't fully support reading all text from shapes, but let's see if we can find them.
    # We might need to inspect drawing xml if there's a shape.
    print("Shapes or images in sheet:")
    if hasattr(ws, 'add_image'): # openpyxl images
        print(f"Images: {len(ws._images)}")
    
    import zipfile
    with zipfile.ZipFile(r"C:\Users\Admin\Downloads\sdfsd).xlsx", 'r') as z:
        for f in z.namelist():
            if 'drawing' in f:
                print(f"Found drawing file: {f}")
                print(z.read(f)[:200])

inspect_shapes()
