import openpyxl

def extract_sizes():
    wb = openpyxl.load_workbook(r"C:\Users\Admin\Downloads\sdfsd).xlsx")
    ws = wb.active
    
    print("COLUMN WIDTHS:")
    for col in range(1, 21):
        col_letter = openpyxl.utils.get_column_letter(col)
        width = ws.column_dimensions[col_letter].width
        print(f"Col {col_letter}: {width}")
        
    print("\nROW HEIGHTS:")
    for row in range(1, 25):
        height = ws.row_dimensions[row].height
        print(f"Row {row}: {height}")

if __name__ == "__main__":
    extract_sizes()
