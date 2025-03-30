# Modern Web Calculator

A feature-rich web-based calculator application built with HTML, CSS, and JavaScript. It provides Standard, Scientific, and Programmer modes with a modern, reactive user interface and keyboard support.

## Features

*   **Multiple Modes:**
    *   **Standard:** Basic arithmetic operations.
    *   **Scientific:** Trigonometric functions (sin, cos, tan - assuming degree input), square root, power (xʸ), logarithms (log, ln), Pi (π).
    *   **Programmer:** Integer-based calculations with support for multiple bases and bitwise operations.
*   **Base Conversion (Programmer Mode):**
    *   Switch between Decimal (DEC), Hexadecimal (HEX), Binary (BIN), and Octal (OCT) bases.
    *   Display updates instantly to the selected base.
    *   Input validation prevents entering digits invalid for the current base (e.g., 'A' in DEC, '2' in BIN).
*   **Bitwise Operations (Programmer Mode):**
    *   AND (`&`)
    *   OR (`|`)
    *   XOR (`^`)
    *   NOT (`~` - Two's Complement Bitwise NOT)
    *   Left Shift (`Lsh` / `<<`)
    *   Right Shift (`Rsh` / `>>` - Arithmetic Shift)
*   **User Interface:**
    *   Modern design using CSS.
    *   Responsive layout (basic adjustments for smaller screens).
    *   Clear display area showing current mode/base and input/result.
    *   Buttons grouped logically and enabled/disabled based on context (mode, base, input state).
*   **Input Methods:**
    *   Clickable buttons for all functions.
    *   Keyboard support mapping common keys to calculator actions (numbers, operators, Enter, Backspace, Esc, Hex digits, etc.).
*   **Core Functionality:**
    *   Basic arithmetic: Addition (`+`), Subtraction (`-`), Multiplication (`*`), Division (`/`).
    *   Clear All (`AC`) and Delete Last (`DEL`).
    *   Toggle Sign (`+/-`).
    *   Handles large integers in Programmer mode using `BigInt`.
*   **Usability Enhancements:**
    *   Preserves the current numerical value when switching modes (truncates decimals when entering Programmer mode).
    *   Attempts to correct minor floating-point display inaccuracies (e.g., `sin(30)` displays `0.5`).
    *   Basic error handling displays "Error" for invalid operations like division by zero.

## How to Run

1.  **Save the Files:** Ensure you have the following three files saved in the same directory:
    *   `index.html`
    *   `style.css`
    *   `script.js`
2.  **Open in Browser:** Open the `index.html` file in any modern web browser (like Chrome, Firefox, Edge, Safari).

## Preview

[Click here to Preview](http://htmlpreview.github.io/?https://github.com/fancellu/calculator-js/blob/main/index.html)

## How to Use

*   **Click Buttons:** Use your mouse to click the on-screen buttons.
*   **Keyboard Input:** Use your keyboard for number entry, operators (`+`, `-`, `*`, `/`), Hex digits (`A-F`), `Enter` (`=`), `Backspace`/`Delete`, `Escape` (`AC`), and other mapped keys (see `keyMap` in `script.js` for details).
*   **Switch Modes:** Use the dropdown menu at the top to select "Standard", "Scientific", or "Programmer".
*   **Switch Base (Programmer Mode):** Click the `DEC`, `HEX`, `BIN`, `OCT` buttons that appear in Programmer mode.

## Technologies Used

*   **HTML5:** For the structure and content of the calculator.
*   **CSS3:** For styling, layout (using Grid), and responsiveness.
*   **JavaScript (ES6+):** For all the calculator logic, DOM manipulation, event handling, state management, and `BigInt` usage.

## Known Issues & Limitations

*   **No Expression Evaluation (PEMDAS/BODMAS):** Calculations are performed immediately or sequentially based on operator input. Complex expressions like `2 + 3 * 4` are evaluated as `(2 + 3) * 4 = 20`, not `2 + (3 * 4) = 14`. Parentheses buttons are present but not functional.
*   **Trigonometry Mode:** Assumes Degree input for `sin`, `cos`, `tan`. No option to switch to Radians or Gradians.
*   **Limited Functions:** Does not include advanced functions like memory (M+, M-, MR), factorials, hyperbolic trig functions, modulo, etc.
*   **Precision:** While basic floating-point display issues are addressed, complex scientific calculations might still encounter precision limitations inherent in standard JavaScript numbers. Switching very large `BigInt` values from Programmer mode to Standard/Scientific might lose precision.
*   **Accessibility:** Basic structure is present, but full ARIA attributes and advanced keyboard navigation are not implemented.

