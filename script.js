// Complete script.js

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
    const themeCheckbox = document.getElementById('theme-checkbox');
    const bodyElement = document.body; // Get the body element

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
                // --- CORRECTED PART ---
                // Directly parse the internal base-10 string to BigInt
                // Avoid intermediate Number() conversion which can lose precision or fail
                const valueAsBigInt = BigInt(internalCurrentInput);
                displayValue = valueAsBigInt.toString(currentBase).toUpperCase();
                // --- END CORRECTION ---
            } catch (e) {
                console.error("Error converting internal value for programmer display:", e, internalCurrentInput);
                internalCurrentInput = 'Error'; // Mark internal state as error if conversion fails
                displayValue = 'Error';
            }
        } else {
            // Standard/Scientific: display the internal (base-10) value
            displayValue = internalCurrentInput;
        }
        screen.value = displayValue; // Update the input field value
        updateButtonStates(); // Update button states AFTER potential display changes
    }

    // --- Formatting Function ---
    function formatResult(result) {
        if (typeof result === 'bigint') {
            return result.toString(10); // Keep as base-10 BigInt string internally
        }
        if (typeof result === 'number') {
            if (!isFinite(result)) {
                console.warn("Formatting non-finite number:", result);
                return "Error";
            }
            const roundedResult = parseFloat(result.toFixed(12));
            return roundedResult.toString(10);
        }
        console.error("Unexpected type in formatResult:", typeof result, result);
        return "Error";
    }

    // --- Input Handling ---
    function appendNumber(numberChar) {
        if (currentMode === 'programmer' && !isValidForBase(numberChar, currentBase)) {
            return;
        }
        const currentDisplay = (shouldResetScreen || displayValue === '0' || displayValue === 'Error') ? '' : displayValue;
        // Prevent leading zeros unless it's the only digit or after a decimal
        let newDisplayValue = currentDisplay + numberChar;
        if(currentMode !== 'programmer' && !newDisplayValue.includes('.') && newDisplayValue.startsWith('0') && newDisplayValue.length > 1) {
            newDisplayValue = newDisplayValue.substring(1);
        }

        if (newDisplayValue.length > 32) return; // Limit input length

        try {
            if (currentMode === 'programmer') {
                if (newDisplayValue === '') {
                    internalCurrentInput = '0';
                } else {
                    // Parse the potentially non-base-10 display string back to base-10 BigInt string
                    internalCurrentInput = BigInt(parseInt(newDisplayValue, currentBase)).toString(10);
                }
            } else {
                // Standard/Scientific: The new display value *is* the base-10 value
                internalCurrentInput = newDisplayValue === '' ? '0' : newDisplayValue;
            }
            shouldResetScreen = false; // We've started typing a new number
        } catch (e) {
            console.error("Error parsing appended number:", e);
            internalCurrentInput = 'Error';
        }
        updateDisplay();
    }

    function appendDecimal() {
        if (currentMode === 'programmer') return;
        if (shouldResetScreen) { // If starting after calculation/function
            internalCurrentInput = '0.';
            shouldResetScreen = false;
        } else if (!internalCurrentInput.includes('.')) { // Only add if no decimal exists
            internalCurrentInput += '.';
            shouldResetScreen = false; // Ensure flag is off if just adding decimal
        }
        updateDisplay();
    }

    function deleteLast() {
        if (shouldResetScreen) return; // Don't delete if result is shown
        let currentDisplay = displayValue;
        if (currentDisplay === 'Error') {
            clearAll(); return;
        }
        let newDisplayValue = currentDisplay.slice(0, -1);

        if (newDisplayValue === '' || newDisplayValue === '-') {
            internalCurrentInput = '0';
        } else {
            try {
                if (currentMode === 'programmer') {
                    internalCurrentInput = BigInt(parseInt(newDisplayValue, currentBase)).toString(10);
                } else {
                    internalCurrentInput = newDisplayValue; // Already base-10
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

        if (op === '~') { // Handle unary NOT immediately
            handleFunction(op);
            return;
        }

        // If an operation is pending and a second operand has been entered, calculate first
        if (operation !== null && internalPreviousInput !== '' && !shouldResetScreen) {
            if (!calculate()) return; // Stop if intermediate calculation failed
        }
        // If switching operation after entering first number, just update operation
        // Otherwise, store state for next part
        if (internalCurrentInput !== 'Error') { // Ensure we don't store "Error" as previous input
            internalPreviousInput = internalCurrentInput;
            operation = op;
            shouldResetScreen = true; // Expecting next operand
        }
    }

    function calculate() {
        // Guard clauses
        if (operation === null || internalPreviousInput === '') return false;
        if (shouldResetScreen) { console.log("Calculate: Second operand not entered."); return false; }
        if (internalCurrentInput === 'Error') return false;

        let result;
        const useBigInt = currentMode === 'programmer';

        try {
            const prev = useBigInt ? BigInt(internalPreviousInput) : parseFloat(internalPreviousInput);
            const current = useBigInt ? BigInt(internalCurrentInput) : parseFloat(internalCurrentInput);

            switch (operation) {
                // Arithmetic
                case '+': result = prev + current; break;
                case '-': result = prev - current; break;
                case '*': result = prev * current; break;
                case '/':
                    if (current === 0 || current === 0n) throw new Error("Division by zero");
                    result = useBigInt ? (prev / current) : (prev / current); // BigInt is integer division
                    break;
                // Bitwise (Programmer)
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

            internalCurrentInput = formatResult(result); // Format and store result

            internalPreviousInput = ''; // Clear state after successful calculation
            operation = null;
            shouldResetScreen = true;
            updateDisplay();
            return true;

        } catch (error) {
            console.error("Calculation Error:", error);
            internalCurrentInput = 'Error';
            internalPreviousInput = ''; // Reset state on error
            operation = null;
            shouldResetScreen = true;
            updateDisplay();
            return false;
        }
    }

    function handleFunction(func) {
        if (internalCurrentInput === 'Error') return;

        let result;
        // Determine if BigInt needed (only for '~') or if float needed
        const useBigInt = (func === '~');
        const isProgrammerOnlyFunc = useBigInt; // Add other programmer funcs here if any

        // Prevent scientific functions in programmer mode and vice-versa
        if (currentMode === 'programmer' && !isProgrammerOnlyFunc) {
            console.warn(`Function ${func} not available in Programmer mode.`);
            return;
        }
        if (currentMode !== 'programmer' && isProgrammerOnlyFunc) {
            console.warn(`Function ${func} only available in Programmer mode.`);
            return;
        }


        try {
            // Parse input based on whether function uses BigInt or float
            const value = useBigInt ? BigInt(internalCurrentInput) : parseFloat(internalCurrentInput);

            switch (func) {
                // Programmer
                case '~': result = ~value; break;
                // Scientific
                case 'sqrt': if (value < 0) throw new Error("Invalid input for sqrt"); result = Math.sqrt(value); break;
                case 'sin': result = Math.sin(degreesToRadians(value)); break;
                case 'cos': result = Math.cos(degreesToRadians(value)); break;
                case 'tan': result = Math.tan(degreesToRadians(value)); break;
                case 'log': if (value <= 0) throw new Error("Invalid input for log"); result = Math.log10(value); break;
                case 'ln': if (value <= 0) throw new Error("Invalid input for ln"); result = Math.log(value); break;
                default: throw new Error(`Unknown function: ${func}`);
            }

            internalCurrentInput = formatResult(result); // Format and store result

            internalPreviousInput = ''; // Reset state after function
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
        let preservedValue = internalCurrentInput;
        const oldMode = currentMode;
        currentMode = newMode;
        currentModeDisplay.textContent = newMode.charAt(0).toUpperCase() + newMode.slice(1);

        // --- Simplified Toggle UI visibility ---
        document.querySelectorAll('.scientific-feature').forEach(el => el.classList.toggle('hidden', newMode !== 'scientific'));
        // This line now handles ALL programmer features, including the base controls container
        document.querySelectorAll('.programmer-feature').forEach(el => el.classList.toggle('hidden', newMode !== 'programmer'));
        // REMOVED the redundant line: baseControls.classList.toggle(...)
        // --- End Simplified Toggle ---

        // CSS might adjust layout based on body class or button visibility

        // Reset calculation state but preserve value
        internalPreviousInput = '';
        operation = null;
        shouldResetScreen = true;

        // Adjust preserved value if needed
        if (preservedValue === 'Error') {
            internalCurrentInput = '0';
        } else {
            internalCurrentInput = preservedValue; // Start with preserved value

            if (newMode === 'programmer' && (oldMode === 'standard' || oldMode === 'scientific')) {
                // Truncate decimals when entering programmer mode
                try {
                    let numStr = internalCurrentInput.includes('.') ? internalCurrentInput : internalCurrentInput + ".0";
                    const num = parseFloat(numStr);
                    internalCurrentInput = Math.trunc(num).toString();
                    BigInt(internalCurrentInput); // Validate
                } catch (e) {
                    console.error("Error truncating/validating for Programmer mode:", e, internalCurrentInput);
                    internalCurrentInput = '0'; // Reset on error
                }
            } else if ((newMode === 'standard' || newMode === 'scientific') && oldMode === 'programmer') {
                // Warn about potential precision loss from large BigInt
                try {
                    const num = BigInt(internalCurrentInput);
                    if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
                        console.warn("Large integer from Programmer mode may lose precision.");
                    }
                } catch(e) {
                    console.error("Error handling value switch from Programmer:", e);
                    internalCurrentInput = '0';
                }
            }
        }

        // Update Base and Display
        if (newMode !== 'programmer') {
            changeBase(10);
        } else if (![2, 8, 10, 16].includes(currentBase)) {
            changeBase(10);
        } else {
            changeBase(currentBase); // Re-apply current base visuals
        }
        updateDisplay(); // Update display AFTER value adjustments and base change
    } // End of changeMode function

    function changeBase(newBase) {
        currentBase = parseInt(newBase);
        currentBaseDisplay.textContent = getBaseName(currentBase);
        baseButtons.forEach(btn => btn.classList.toggle('active', parseInt(btn.dataset.base) === currentBase));
        updateDisplay(); // Re-render internal value in new base
        updateButtonStates(); // Update enable/disable based on new base
    }

    // --- Utility Functions ---
    function getBaseName(base) { switch (base) { case 16: return 'HEX'; case 2: return 'BIN'; case 8: return 'OCT'; default: return 'DEC'; } }
    function isValidForBase(digit, base) { if (!digit) return false; const upperDigit = digit.toUpperCase(); if (base === 16) return /^[0-9A-F]$/.test(upperDigit); if (base === 10) return /^[0-9]$/.test(upperDigit); if (base === 8) return /^[0-7]$/.test(upperDigit); if (base === 2) return /^[01]$/.test(upperDigit); return false; }
    function degreesToRadians(degrees) { return degrees * (Math.PI / 180); }
    function handlePi() { if (currentMode === 'programmer') return; internalCurrentInput = formatResult(Math.PI); shouldResetScreen = true; updateDisplay(); } // Use formatResult for Pi too
    function toggleSign() {
        if (internalCurrentInput === 'Error' || internalCurrentInput === '0') return;
        try {
            if (currentMode === 'programmer') internalCurrentInput = (BigInt(internalCurrentInput) * -1n).toString();
            else internalCurrentInput = (parseFloat(internalCurrentInput) * -1).toString();
            // We don't format here, just toggling sign of the internal value
        } catch (e) { console.error("Error toggling sign:", e); internalCurrentInput = 'Error'; }
        updateDisplay();
    }

    // --- Button State Management ---
    function updateButtonStates() {
        const isError = internalCurrentInput === 'Error';
        const waitingForSecondOperand = (operation !== null && shouldResetScreen);

        allButtons.forEach(button => {
            const action = button.dataset.action;
            const value = button.dataset.value;
            let disabled = false;

            if (isError && !['clear'].includes(action)) { disabled = true; }
            else if (currentMode === 'programmer') {
                if (action === 'decimal' || action === 'pi' || value === 'pow' || ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt'].includes(value)) disabled = true;
                if (action === 'number' && !isValidForBase(value, currentBase)) disabled = true;
                if (action === 'sign' && internalCurrentInput === '0') disabled = true; // Disable +/- for 0 in prog mode?
            } else { // Standard or Scientific
                if (action === 'bitwise' || button.classList.contains('hex-digit') || value === '~') disabled = true; // Disable prog features
                if (action === 'decimal' && internalCurrentInput.includes('.') && !shouldResetScreen) disabled = true; // Disable decimal if already present in current number
                if (action === 'sign' && internalCurrentInput === '0') disabled = true; // Disable +/- for 0
            }
            // Disable equals unless ready for calculation
            if (action === 'equals' && (operation === null || internalPreviousInput === '' || shouldResetScreen)) {
                disabled = true;
            }
            // Disable operators if waiting for second operand (prevents e.g., 5 + + 3)
            // Although chooseOperation handles chaining, this provides visual feedback.
            if ((action === 'operator' || action === 'bitwise') && waitingForSecondOperand) {
                // Maybe allow changing operator? For now, disable.
                // disabled = true;
            }


            button.disabled = disabled;

            // Hide/Show based on mode needs to be handled carefully with layout
            // CSS is likely handling visibility based on classes now
        });
    }


    // --- Event Listeners Setup ---
    buttonsContainer.addEventListener('click', (event) => {
        const target = event.target;
        if (!target.matches('button') || target.disabled) return;
        const action = target.dataset.action;
        const value = target.dataset.value;

        switch (action) {
            case 'number': appendNumber(value); break;
            case 'decimal': appendDecimal(); break;
            case 'operator': case 'bitwise': chooseOperation(value); break;
            case 'function': handleFunction(value); break;
            case 'pi': handlePi(); break;
            case 'sign': toggleSign(); break;
            case 'parenthesis': console.warn("Parenthesis logic not implemented"); break;
            case 'equals': calculate(); break;
            case 'clear': clearAll(); break;
            case 'delete': deleteLast(); break;
            default: console.log('Unknown button action:', action);
        }
    });
    modeSelect.addEventListener('change', (event) => changeMode(event.target.value));
    baseButtons.forEach(button => button.addEventListener('click', (event) => changeBase(event.target.dataset.base)));

    // --- Theme Handling ---
    function applyTheme(isDark) {
        bodyElement.classList.toggle('dark-mode', isDark);
        themeCheckbox.checked = isDark;
    }
    themeCheckbox.addEventListener('change', (event) => {
        applyTheme(event.target.checked);
        localStorage.setItem('theme', event.target.checked ? 'dark' : 'light');
    });
    const savedTheme = localStorage.getItem('theme');
    applyTheme(savedTheme === 'dark'); // Apply saved theme or default to light


    // --- Keyboard Support ---
    const keyMap = {
        '0':{action:'number',value:'0'},'1':{action:'number',value:'1'},'2':{action:'number',value:'2'},'3':{action:'number',value:'3'},'4':{action:'number',value:'4'},'5':{action:'number',value:'5'},'6':{action:'number',value:'6'},'7':{action:'number',value:'7'},'8':{action:'number',value:'8'},'9':{action:'number',value:'9'},
        'a':{action:'number',value:'A'},'b':{action:'number',value:'B'},'c':{action:'number',value:'C'},'d':{action:'number',value:'D'},'e':{action:'number',value:'E'},'f':{action:'number',value:'F'},'A':{action:'number',value:'A'},'B':{action:'number',value:'B'},'C':{action:'number',value:'C'},'D':{action:'number',value:'D'},'E':{action:'number',value:'E'},'F':{action:'number',value:'F'},
        '.':{action:'decimal',value:'.'},'+':{action:'operator',value:'+'},'-':{action:'operator',value:'-'},'*':{action:'operator',value:'*'},'/':{action:'operator',value:'/'},
        'Enter':{action:'equals'},'=':{action:'equals'},'Backspace':{action:'delete'},'Delete':{action:'delete'},'Escape':{action:'clear'},
        '&':{action:'bitwise',value:'&'},'|':{action:'bitwise',value:'|'},'^':{action:'bitwise',value:'^'},'~':{action:'bitwise',value:'~'},
        'p':{action:'operator',value:'pow'},'%':{action:'operator',value:'%'},
        'r':{action:'function',value:'sqrt'},'l':{action:'function',value:'log'},'n':{action:'function',value:'ln'},'(': { action: 'parenthesis', value: '(' }, ')': { action: 'parenthesis', value: ')' },
        '<': {action: 'bitwise', value: '<<'}, '>': {action: 'bitwise', value: '>>'} // Shift keys might require Shift modifier check
    };
    function findButton(action, value) {
        for(let btn of allButtons) { if(btn.dataset.action === action && btn.dataset.value === value) return btn; if(btn.dataset.action === action && value===undefined && btn.dataset.value===undefined) return btn;}
        if (action === 'equals') return document.querySelector('.buttons button[data-action="equals"]');
        if (action === 'clear') return document.querySelector('.buttons button[data-action="clear"]');
        if (action === 'delete') return document.querySelector('.buttons button[data-action="delete"]');
        return null;
    }
    window.addEventListener('keydown', (event) => {
        const key = event.key; let mappedAction = keyMap[key];
        // Mode-specific key overrides
        if (currentMode === 'programmer'){ if(key==='^') mappedAction={action:'bitwise',value:'^'}; if(key==='~') mappedAction={action:'bitwise',value:'~'}; if(key==='<') mappedAction={action:'bitwise',value:'<<'}; if(key==='>') mappedAction={action:'bitwise',value:'>>'}; }
        else { if(key==='p') mappedAction={action:'operator',value:'pow'}; /* Map p to power if not programmer */ }

        if (mappedAction) {
            const targetButton = findButton(mappedAction.action, mappedAction.value);
            if (targetButton && !targetButton.disabled && !targetButton.classList.contains('hidden')) {
                event.preventDefault(); targetButton.click();
                targetButton.classList.add('active-keypress'); setTimeout(() => targetButton.classList.remove('active-keypress'), 100);
            }
        }
    });

    // --- Initial Setup ---
    changeMode('standard'); // Initialize in standard mode

}); // End DOMContentLoaded