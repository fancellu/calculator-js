// Complete script.js with formatResult

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const screen = document.getElementById('screen');
    const buttonsContainer = document.querySelector('.buttons');
    const modeSelect = document.getElementById('mode-select');
    const currentModeDisplay = document.getElementById('current-mode');
    const currentBaseDisplay = document.getElementById('current-base');
    const baseControls = document.getElementById('base-controls');
    const baseButtons = baseControls.querySelectorAll('.base-btn');
    const allButtons = document.querySelectorAll('.buttons button');

    // --- State Variables ---
    let internalCurrentInput = '0'; // ALWAYS stores the value as a base-10 string
    let internalPreviousInput = ''; // ALWAYS stores the value as a base-10 string
    let operation = null;           // e.g., '+', '*', '&'
    let currentMode = 'standard';   // 'standard', 'scientific', 'programmer'
    let currentBase = 10;           // 10, 16, 2, 8 (Used ONLY for display/input validation)
    let shouldResetScreen = false;  // Flag to clear screen on next number input
    let displayValue = '0';         // Cache the currently displayed value

    // --- Core Display Logic ---
    function updateDisplay() {
        if (internalCurrentInput === 'Error') {
            displayValue = 'Error';
        } else if (currentMode === 'programmer') {
            try {
                displayValue = BigInt(internalCurrentInput).toString(currentBase).toUpperCase();
            } catch (e) {
                console.error("Error converting internal value for display:", e);
                internalCurrentInput = 'Error';
                displayValue = 'Error';
            }
        } else {
            // Standard/Scientific: display the internal (base-10) value
            // Apply formatting *only for display* if needed (e.g., separators)
            // but the stored internalCurrentInput remains the clean string.
            displayValue = internalCurrentInput;
        }
        screen.value = displayValue;
        updateButtonStates();
    }

    // --- NEW: Formatting Function ---
    function formatResult(result) {
        // Handle BigInt results separately (no rounding needed)
        if (typeof result === 'bigint') {
            return result.toString(10); // Keep as base-10 BigInt string internally
        }

        // Handle standard numbers (potential floats)
        if (typeof result === 'number') {
            if (!isFinite(result)) {
                console.warn("Formatting non-finite number:", result);
                return "Error";
            }
            // Round to handle floating-point inaccuracies
            const roundedResult = parseFloat(result.toFixed(12));
            // Convert the cleaned-up number back into the standard base-10 string
            return roundedResult.toString(10);
        }

        // Fallback for unexpected types
        console.error("Unexpected type in formatResult:", typeof result, result);
        return "Error";
    }


    // --- Input Handling ---
    function appendNumber(numberChar) {
        if (currentMode === 'programmer' && !isValidForBase(numberChar, currentBase)) {
            return;
        }
        const currentDisplay = (shouldResetScreen || displayValue === '0') ? '' : displayValue;
        const newDisplayValue = currentDisplay + numberChar;
        if (newDisplayValue.length > 32) return;

        try {
            if (currentMode === 'programmer') {
                if (newDisplayValue === '') {
                    internalCurrentInput = '0';
                } else {
                    internalCurrentInput = BigInt(parseInt(newDisplayValue, currentBase)).toString(10);
                }
            } else {
                internalCurrentInput = newDisplayValue === '' ? '0' : newDisplayValue;
            }
            shouldResetScreen = false;
        } catch (e) {
            console.error("Error parsing appended number:", e);
            internalCurrentInput = 'Error';
        }
        updateDisplay();
    }

    function appendDecimal() {
        if (currentMode === 'programmer' || internalCurrentInput.includes('.')) return;
        if (shouldResetScreen) {
            internalCurrentInput = '0.';
            shouldResetScreen = false;
        } else {
            internalCurrentInput += '.';
        }
        updateDisplay();
    }

    function deleteLast() {
        if (shouldResetScreen) return;
        let currentDisplay = displayValue;
        if (currentDisplay === 'Error') {
            clearAll();
            return;
        }
        let newDisplayValue = currentDisplay.slice(0, -1);

        if (newDisplayValue === '' || newDisplayValue === '-') {
            internalCurrentInput = '0';
        } else {
            try {
                if (currentMode === 'programmer') {
                    internalCurrentInput = BigInt(parseInt(newDisplayValue, currentBase)).toString(10);
                } else {
                    internalCurrentInput = newDisplayValue;
                }
            } catch (e) {
                console.error("Error parsing after delete:", e);
                internalCurrentInput = 'Error';
            }
        }
        updateDisplay();
    }

    function clearAll() {
        internalCurrentInput = '0';
        internalPreviousInput = '';
        operation = null;
        shouldResetScreen = false;
        updateDisplay();
    }

    // --- Operations ---
    function chooseOperation(op) {
        if (internalCurrentInput === 'Error') return;
        if (op === '~') {
            handleFunction(op);
            return;
        }
        if (operation !== null && internalPreviousInput !== '' && !shouldResetScreen) {
            if (!calculate()) return;
        }
        internalPreviousInput = internalCurrentInput;
        operation = op;
        shouldResetScreen = true;
    }

    function calculate() {
        // Guard clauses from previous version...
        if (operation === null || internalPreviousInput === '') return false;
        if (shouldResetScreen) { console.log("Calculate: Second operand not entered."); return false; }
        if (internalCurrentInput === 'Error') return false;

        let result;
        const useBigInt = currentMode === 'programmer';

        try {
            const prev = useBigInt ? BigInt(internalPreviousInput) : parseFloat(internalPreviousInput);
            const current = useBigInt ? BigInt(internalCurrentInput) : parseFloat(internalCurrentInput);

            switch (operation) {
                // Standard Arithmetic
                case '+': result = prev + current; break;
                case '-': result = prev - current; break;
                case '*': result = prev * current; break;
                case '/':
                    if (current === 0 || current === 0n) throw new Error("Division by zero");
                    result = useBigInt ? (prev / current) : (prev / current);
                    break;
                // Programmer Bitwise
                case '&': if (!useBigInt) throw new Error("& requires Programmer mode"); result = prev & current; break;
                case '|': if (!useBigInt) throw new Error("| requires Programmer mode"); result = prev | current; break;
                case '^': if (!useBigInt) throw new Error("^ requires Programmer mode"); result = prev ^ current; break;
                case '<<': if (!useBigInt) throw new Error("<< requires Programmer mode"); result = prev << BigInt(Number(current)); break;
                case '>>': if (!useBigInt) throw new Error(">> requires Programmer mode"); result = prev >> BigInt(Number(current)); break;
                // Scientific
                case 'pow': if (useBigInt) throw new Error("pow requires Scientific mode"); result = Math.pow(prev, current); break;
                default: throw new Error(`Unknown operation: ${operation}`);
            }

            if (typeof result === 'number' && !isFinite(result)) throw new Error("Result is Infinity or NaN");

            // --- MODIFIED HERE: Use formatResult ---
            internalCurrentInput = formatResult(result);
            // --- End Modification ---

            internalPreviousInput = '';
            operation = null;
            shouldResetScreen = true;
            updateDisplay();
            return true;

        } catch (error) {
            console.error("Calculation Error:", error);
            internalCurrentInput = 'Error';
            internalPreviousInput = '';
            operation = null;
            shouldResetScreen = true;
            updateDisplay();
            return false;
        }
    }

    function handleFunction(func) {
        if (internalCurrentInput === 'Error') return;

        let result;
        const useBigInt = (func === '~');

        try {
            const value = useBigInt ? BigInt(internalCurrentInput) : parseFloat(internalCurrentInput);

            switch (func) {
                case '~': result = ~value; break; // Bitwise NOT

                // Scientific (ensure value is not BigInt)
                case 'sqrt': if (useBigInt || value < 0) throw new Error("Invalid input for sqrt"); result = Math.sqrt(value); break;
                case 'sin': if (useBigInt) throw new Error("Invalid input for sin"); result = Math.sin(degreesToRadians(value)); break;
                case 'cos': if (useBigInt) throw new Error("Invalid input for cos"); result = Math.cos(degreesToRadians(value)); break;
                case 'tan': if (useBigInt) throw new Error("Invalid input for tan"); result = Math.tan(degreesToRadians(value)); break;
                case 'log': if (useBigInt || value <= 0) throw new Error("Invalid input for log"); result = Math.log10(value); break;
                case 'ln': if (useBigInt || value <= 0) throw new Error("Invalid input for ln"); result = Math.log(value); break;
                default: throw new Error(`Unknown function: ${func}`);
            }

            // --- MODIFIED HERE: Use formatResult ---
            internalCurrentInput = formatResult(result);
            // --- End Modification ---

            internalPreviousInput = '';
            operation = null;
            shouldResetScreen = true;

        } catch (error) {
            console.error("Function Error:", error);
            internalCurrentInput = 'Error';
            shouldResetScreen = true;
        }
        updateDisplay();
    }


    // --- Mode & Base Switching ---
    function changeMode(newMode) {
        // --- Preserve Value Step 1: Store current value ---
        let preservedValue = internalCurrentInput; // Store the current base-10 value
        const oldMode = currentMode; // Keep track of the mode we are coming from

        // --- Basic Mode Update ---
        currentMode = newMode; // Set the new mode state
        currentModeDisplay.textContent = newMode.charAt(0).toUpperCase() + newMode.slice(1);

        // Show/Hide relevant UI elements first
        document.querySelectorAll('.scientific-feature').forEach(el => el.classList.toggle('hidden', newMode !== 'scientific'));
        document.querySelectorAll('.programmer-feature').forEach(el => el.classList.toggle('hidden', newMode !== 'programmer'));
        baseControls.classList.toggle('hidden', newMode !== 'programmer');
        const buttonsGrid = document.querySelector('.buttons');
        buttonsGrid.className = 'buttons'; // Reset layout classes
        buttonsGrid.classList.add(`mode-${newMode}`); // Add mode class for CSS if needed

        // --- Reset Calculation State (but keep value) ---
        internalPreviousInput = ''; // Clear previous operand
        operation = null;         // Clear pending operation
        shouldResetScreen = true; // Display the preserved value, but next number input will overwrite

        // --- Preserve Value Step 2: Adjust value if needed ---
        if (preservedValue === 'Error') {
            // If the value was already Error, reset it to 0 when changing mode
            internalCurrentInput = '0';
        } else {
            internalCurrentInput = preservedValue; // Start with the preserved value

            // Handle specific transitions:
            if (newMode === 'programmer' && (oldMode === 'standard' || oldMode === 'scientific')) {
                // Switching TO Programmer FROM Standard/Scientific: Truncate decimals
                if (internalCurrentInput.includes('.')) {
                    try {
                        const num = parseFloat(internalCurrentInput);
                        // Use Math.trunc to remove decimal part, then convert back to string
                        internalCurrentInput = Math.trunc(num).toString();
                    } catch (e) {
                        console.error("Error truncating decimal for Programmer mode:", e);
                        internalCurrentInput = '0'; // Reset to 0 on error
                    }
                }
                // Ensure it's a valid integer representation (e.g., handles potential "NaN" if parse failed)
                try {
                    BigInt(internalCurrentInput); // Test if it can be BigInt
                } catch {
                    internalCurrentInput = '0'; // Reset if not valid integer string
                }

            } else if ((newMode === 'standard' || newMode === 'scientific') && oldMode === 'programmer') {
                // Switching FROM Programmer TO Standard/Scientific:
                // Value is already base-10 string. Check if it's too large? (Optional)
                // For now, we assume standard JS number limits are acceptable.
                // Potentially very large BigInts might lose precision here.
                try {
                    // Test if it's within safe integer range for standard numbers (optional check)
                    const num = BigInt(internalCurrentInput);
                    if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
                        console.warn("Large integer from Programmer mode may lose precision in Standard/Scientific mode.");
                    }
                    // No actual change needed to internalCurrentInput, it's already base-10 string.
                } catch(e) {
                    console.error("Error handling value switching from Programmer:", e);
                    internalCurrentInput = '0'; // Reset on error
                }
            }
            // If switching between Standard and Scientific, no value adjustment is needed.
        }


        // --- Update Base and Display ---
        // Ensure correct base is selected visually and buttons are updated
        if (newMode !== 'programmer') {
            changeBase(10); // Force base 10 if not programmer
        } else if (![2, 8, 10, 16].includes(currentBase)) {
            changeBase(10); // Default to DEC if entering programmer with invalid base
        } else {
            changeBase(currentBase); // Re-apply current base visuals & button states
        }

        // Crucially, call updateDisplay *after* potential value adjustment and base change
        updateDisplay();
        // updateButtonStates(); // Called within updateDisplay

    }

    function changeBase(newBase) {
        currentBase = parseInt(newBase);
        currentBaseDisplay.textContent = getBaseName(currentBase);
        baseButtons.forEach(btn => btn.classList.toggle('active', parseInt(btn.dataset.base) === currentBase));
        updateDisplay(); // Re-render internal value in new base
        updateButtonStates(); // Update enable/disable based on new base
    }

    // --- Utility Functions ---
    function getBaseName(base) { /* ... same as before ... */
        switch (base) { case 16: return 'HEX'; case 2: return 'BIN'; case 8: return 'OCT'; default: return 'DEC'; }
    }
    function isValidForBase(digit, base) { /* ... same as before ... */
        if (!digit) return false; const upperDigit = digit.toUpperCase();
        if (base === 16) return /^[0-9A-F]$/.test(upperDigit); if (base === 10) return /^[0-9]$/.test(upperDigit);
        if (base === 8) return /^[0-7]$/.test(upperDigit); if (base === 2) return /^[01]$/.test(upperDigit); return false;
    }
    function degreesToRadians(degrees) { /* ... same as before ... */ return degrees * (Math.PI / 180); }
    function handlePi() { if (currentMode === 'programmer') return; internalCurrentInput = Math.PI.toString(); shouldResetScreen = false; updateDisplay(); }
    function toggleSign() { /* ... same logic as before using BigInt or parseFloat ... */
        if (internalCurrentInput === 'Error' || internalCurrentInput === '0') return;
        try {
            if (currentMode === 'programmer') internalCurrentInput = (BigInt(internalCurrentInput) * -1n).toString();
            else internalCurrentInput = (parseFloat(internalCurrentInput) * -1).toString();
        } catch (e) { console.error("Error toggling sign:", e); internalCurrentInput = 'Error'; }
        updateDisplay();
    }

    // --- Button State Management ---
    function updateButtonStates() { /* ... same logic as before ... */
        const isError = internalCurrentInput === 'Error';
        allButtons.forEach(button => {
            const action = button.dataset.action; const value = button.dataset.value; let disabled = false;
            if (isError && !['clear'].includes(action)) { disabled = true; }
            else if (currentMode === 'programmer') {
                if (action === 'decimal' || action === 'pi' || value === 'pow' || ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt'].includes(value)) disabled = true;
                if (action === 'number' && !isValidForBase(value, currentBase)) disabled = true;
            } else {
                if (action === 'bitwise' || button.classList.contains('hex-digit')) disabled = true;
                if (action === 'decimal' && internalCurrentInput.includes('.')) disabled = true;
            }
            if (action === 'equals' && (operation === null || internalPreviousInput === '' || shouldResetScreen)) { disabled = true; } // Also disable if waiting for 2nd operand
            button.disabled = disabled;

            // Hide/Show based on mode
            if (currentMode !== 'scientific' && button.classList.contains('scientific-feature')) button.classList.add('hidden');
            else if (currentMode === 'scientific' && button.classList.contains('scientific-feature')) button.classList.remove('hidden');
            if (currentMode !== 'programmer' && button.classList.contains('programmer-feature')) button.classList.add('hidden');
            else if (currentMode === 'programmer' && button.classList.contains('programmer-feature')) button.classList.remove('hidden');
        });
    }


    // --- Event Listeners Setup ---
    buttonsContainer.addEventListener('click', (event) => { /* ... same logic as before ... */
        const target = event.target; if (!target.matches('button') || target.disabled) return;
        const action = target.dataset.action; const value = target.dataset.value;
        switch (action) {
            case 'number': appendNumber(value); break; case 'decimal': appendDecimal(); break;
            case 'operator': case 'bitwise': chooseOperation(value); break;
            case 'function': handleFunction(value); break; case 'pi': handlePi(); break;
            case 'sign': toggleSign(); break; case 'parenthesis': console.warn("Parenthesis logic not implemented"); break;
            case 'equals': calculate(); break; case 'clear': clearAll(); break; case 'delete': deleteLast(); break;
            default: console.log('Unknown button action:', action);
        }
    });
    modeSelect.addEventListener('change', (event) => changeMode(event.target.value));
    baseButtons.forEach(button => button.addEventListener('click', (event) => changeBase(event.target.dataset.base)));

    // --- Keyboard Support ---
    const keyMap = { /* ... same keyMap as before ... */
        '0': { action: 'number', value: '0' }, '1': { action: 'number', value: '1' }, '2': { action: 'number', value: '2' }, '3': { action: 'number', value: '3' }, '4': { action: 'number', value: '4' }, '5': { action: 'number', value: '5' }, '6': { action: 'number', value: '6' }, '7': { action: 'number', value: '7' }, '8': { action: 'number', value: '8' }, '9': { action: 'number', value: '9' },
        'a': { action: 'number', value: 'A' }, 'b': { action: 'number', value: 'B' }, 'c': { action: 'number', value: 'C' }, 'd': { action: 'number', value: 'D' }, 'e': { action: 'number', value: 'E' }, 'f': { action: 'number', value: 'F' }, 'A': { action: 'number', value: 'A' }, 'B': { action: 'number', value: 'B' }, 'C': { action: 'number', value: 'C' }, 'D': { action: 'number', value: 'D' }, 'E': { action: 'number', value: 'E' }, 'F': { action: 'number', value: 'F' },
        '.': { action: 'decimal', value: '.' }, '+': { action: 'operator', value: '+' }, '-': { action: 'operator', value: '-' }, '*': { action: 'operator', value: '*' }, '/': { action: 'operator', value: '/' },
        'Enter': { action: 'equals' }, '=': { action: 'equals' }, 'Backspace': { action: 'delete' }, 'Delete': { action: 'delete' }, 'Escape': { action: 'clear' },
        '&': { action: 'bitwise', value: '&' }, '|': { action: 'bitwise', value: '|' },
        '^': { action: 'bitwise', value: '^' }, // Map ^ to XOR (requires prog mode check below)
        '~': { action: 'bitwise', value: '~' }, // Map ~ to NOT (requires prog mode check below)
        'p': { action: 'operator', value: 'pow'}, '%': { action: 'operator', value: '%' },
        'r': { action: 'function', value: 'sqrt'}, 'l': { action: 'function', value: 'log'}, 'n': { action: 'function', value: 'ln'}, '(': { action: 'parenthesis', value: '(' }, ')': { action: 'parenthesis', value: ')' }
    };
    function findButton(action, value) { /* ... same as before ... */
        for (let button of allButtons) { if (button.dataset.action === action && button.dataset.value === value) return button; if (button.dataset.action === action && value === undefined && button.dataset.value === undefined) return button; }
        if (action === 'equals') return document.querySelector('.buttons button[data-action="equals"]'); if (action === 'clear') return document.querySelector('.buttons button[data-action="clear"]'); if (action === 'delete') return document.querySelector('.buttons button[data-action="delete"]'); return null;
    }
    window.addEventListener('keydown', (event) => { /* ... same logic as before, including checks for ^ and ~ in programmer mode ... */
        const key = event.key; let mappedAction = keyMap[key];
        if (key === '^' && currentMode === 'programmer') mappedAction = { action: 'bitwise', value: '^' };
        else if (key === '~' && currentMode === 'programmer') mappedAction = { action: 'bitwise', value: '~' };
        if (mappedAction) {
            const targetButton = findButton(mappedAction.action, mappedAction.value);
            if (targetButton && !targetButton.disabled && !targetButton.classList.contains('hidden')) {
                event.preventDefault(); targetButton.click();
                targetButton.classList.add('active-keypress'); setTimeout(() => targetButton.classList.remove('active-keypress'), 100);
            }
        }
    });

    // --- Initial Setup ---
    changeMode('standard');

}); // End DOMContentLoaded