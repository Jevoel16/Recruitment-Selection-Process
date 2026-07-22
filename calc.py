```python
#!/usr/bin/env python3
"""
Calculator Program - Simple arithmetic operations using Python
Save this file as calc.py to run the program directly from terminal or IDE
Run with: python3 calc.py (or just ./calc.py if executable is set)
"""

def add(x, y):
    return x + y

def subtract(x, y):
    return x - y

def multiply(x, y):
    return x * y

def divide(x, y):
    try:
        return x / y
    except ZeroDivisionError:
        print("❌ Error: Division by zero is not allowed!")


# Display calculator menu function
def display_menu():
    print("\n🧮 Welcome to Python Calculator 🧮")
    operations = {
        '1': "Addition (+)",
        '2': "Subtraction (-)",
        '3': "Multiplication (*)",
        '4': "Division (/)"
    }

    for key, value in operations.items():
        print(f"{key} - {value}")


def get_number(prompt):
    try:
        return float(input(prompt))
    except ValueError:
        print("❌ Invalid input! Please enter a number.")
        exit()


# Main calculator loop function
def run_calculator():
    
    # Ask user to start or quit
    while True:
        
        display_menu()
        
        choice = input("\nEnter operation code (1-4) or 'q' to quit: ").strip().lower()

        if choice == 'q':
            print("👋 Thank you for using the calculator. Goodbye!")
            break
        
        elif choice in operations.values():
            
            x_str, y_str = input("\nEnter two numbers (space separated): ").split()
            
            try:
                num1 = float(x_str)
                num2 = float(y_str)

                if "add" in str(operations[choice]).lower():
                    result = add(num1, num2)
                    print(f"\nResult: {num1} + {num2} = {result}")
                
                elif "subtract" in str(operations[choice]):
                    result = subtract(num1, num2)
                    print(f"\nResult: {num1} - {num2} = {result}")

                elif "multiply" in str(operations[choice]).lower():
                    result = multiply(num1, num2)
                    print(f"\nResult: {num1} × {num2} = {result}")

                else:  # Division operation
                    y_str = float(y_str).strip() if '-' not in y_str.split('/')[-1] else y_str.strip().split('')[0].rstrip('/')
                    
                    result_val = divide(num1, num2)
                    print(f"\nResult: {num1} ÷ {num2} = {result_val}")

            except ValueError as e:
                if choice != 'q': 
                    print("❌ Invalid input format. Please provide two numbers.")

        else:
            
            # Handle invalid operator selection and user-friendly messages
            error_msg = "⚠️ Operation code not recognized."
            help_info = "\n\nValid operations:\n" + "".join(f"{key} - {value}" for key, value in operations.items())
            
            if choice.startswith('c') or 'quit' == choice.lower():  # Additional quit option handling
                print("\nThe calculator is now closed.")
                
        continue

if __name__ == "__main__":  
    run_calculator()


# Sample usage:
# python calc.py (or just ./calc.py on Linux/Mac with appropriate permissions)
