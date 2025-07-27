
module.exports = function showOnScreenKeyboard() {
    // Check if overlay already exists
    const existing = document.getElementById('osk-modal-overlay');
    if (existing) {
        // If it exists, remove it (lower the keyboard)
        existing.remove();
        return;
    }

    // Create the overlay div
    const overlay = document.createElement('div');
    overlay.id = 'osk-modal-overlay';
    overlay.style.position = 'fixed';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '50vh';
    overlay.style.background = 'rgba(30,30,30,0.97)';
    overlay.style.zIndex = '999999';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.boxShadow = '0 -2px 16px rgba(0,0,0,0.4)';
    overlay.style.borderTopLeftRadius = '16px';
    overlay.style.borderTopRightRadius = '16px';

    // Create QWERTY keyboard layout
    const keyboard = document.createElement('div');
    keyboard.style.width = '90%';
    keyboard.style.height = '90%';
    keyboard.style.display = 'flex';
    keyboard.style.flexDirection = 'column';
    keyboard.style.justifyContent = 'center';
    keyboard.style.padding = '20px';
    keyboard.style.boxSizing = 'border-box';

    // Create input field
    const inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.placeholder = 'Type here...';
    inputField.style.width = '100%';
    inputField.style.height = '40px';
    inputField.style.background = '#444';
    inputField.style.border = '2px solid #666';
    inputField.style.borderRadius = '8px';
    inputField.style.color = '#fff';
    inputField.style.fontSize = '16px';
    inputField.style.fontFamily = 'monospace';
    inputField.style.padding = '0 15px';
    inputField.style.marginBottom = '20px';
    inputField.style.boxSizing = 'border-box';
    inputField.style.outline = 'none';
    
    // Add focus styles
    inputField.addEventListener('focus', () => {
        inputField.style.borderColor = '#0078d4';
    });
    inputField.addEventListener('blur', () => {
        inputField.style.borderColor = '#666';
    });

    keyboard.appendChild(inputField);

    // Keyboard state
    let isShiftPressed = false;
    let isCapsLockOn = false;

    // Function to handle key clicks
    function handleKeyClick(key, inputField) {
        const currentValue = inputField.value;
        const cursorPos = inputField.selectionStart;
        
        if (key === 'Backspace') {
            if (cursorPos > 0) {
                inputField.value = currentValue.substring(0, cursorPos - 1) + currentValue.substring(cursorPos);
                inputField.setSelectionRange(cursorPos - 1, cursorPos - 1);
            }
        } else if (key === 'Space') {
            inputField.value = currentValue.substring(0, cursorPos) + ' ' + currentValue.substring(cursorPos);
            inputField.setSelectionRange(cursorPos + 1, cursorPos + 1);
        } else if (key === 'Enter') {
            // For now, just add a newline or do nothing for single-line input
            console.log('Enter pressed, current value:', inputField.value);
        } else if (key === 'Shift') {
            isShiftPressed = !isShiftPressed;
            updateModifierKeyAppearance();
            updateKeyDisplays();
            console.log('Shift toggled:', isShiftPressed);
        } else if (key === 'Caps') {
            isCapsLockOn = !isCapsLockOn;
            updateModifierKeyAppearance();
            updateKeyDisplays();
            console.log('Caps Lock toggled:', isCapsLockOn);
        } else {
            // Regular character
            let charToInsert = key;
            
            // Apply shift/caps modifications for letters
            if (/^[a-z]$/.test(key)) {
                if ((isShiftPressed && !isCapsLockOn) || (!isShiftPressed && isCapsLockOn)) {
                    charToInsert = key.toUpperCase();
                }
                // Reset shift after use (like a real keyboard)
                if (isShiftPressed) {
                    isShiftPressed = false;
                    updateModifierKeyAppearance();
                    updateKeyDisplays();
                }
            } else if (isShiftPressed || isCapsLockOn) {
                // Handle shifted special characters (both shift and caps lock)
                const shiftMap = {
                    '1': '!', '2': '@', '3': '#', '4': '$', '5': '%',
                    '6': '^', '7': '&', '8': '*', '9': '(', '0': ')',
                    '-': '_', '=': '+', '[': '{', ']': '}', '\\': '|',
                    ';': ':', "'": '"', ',': '<', '.': '>', '/': '?'
                };
                charToInsert = shiftMap[key] || key;
                // Only reset shift if it was shift (not caps lock)
                if (isShiftPressed) {
                    isShiftPressed = false;
                    updateModifierKeyAppearance();
                    updateKeyDisplays();
                }
            }
            
            inputField.value = currentValue.substring(0, cursorPos) + charToInsert + currentValue.substring(cursorPos);
            inputField.setSelectionRange(cursorPos + 1, cursorPos + 1);
        }
        
        // Keep focus on input field
        inputField.focus();
    }

    // Function to update modifier key appearance
    function updateModifierKeyAppearance() {
        const allButtons = document.querySelectorAll('#osk-modal-overlay [data-key]');
        allButtons.forEach(button => {
            const key = button.dataset.key;
            if (key === 'Shift' && isShiftPressed) {
                button.style.background = '#ff6b35';
                button.style.border = '2px solid #ff8c42';
            } else if (key === 'Caps' && isCapsLockOn) {
                button.style.background = '#ff6b35';
                button.style.border = '2px solid #ff8c42';
            } else if (key === 'Shift' || key === 'Caps') {
                button.style.background = '#666';
                button.style.border = '1px solid #888';
            }
        });
    }

    // Function to update key displays based on shift/caps state
    function updateKeyDisplays() {
        const allButtons = document.querySelectorAll('#osk-modal-overlay [data-key]');
        const shiftMap = {
            '1': '!', '2': '@', '3': '#', '4': '$', '5': '%',
            '6': '^', '7': '&', '8': '*', '9': '(', '0': ')',
            '-': '_', '=': '+', '[': '{', ']': '}', '\\': '|',
            ';': ':', "'": '"', ',': '<', '.': '>', '/': '?'
        };

        allButtons.forEach(button => {
            const key = button.dataset.key;
            
            // Don't change display for special keys
            if (['Shift', 'Caps', 'Enter', 'Backspace', 'Space'].includes(key)) {
                return;
            }
            
            // Update display based on shift/caps state
            if (/^[a-z]$/.test(key)) {
                // Letters: show uppercase when caps or shift is active
                if ((isShiftPressed && !isCapsLockOn) || (!isShiftPressed && isCapsLockOn)) {
                    button.textContent = key.toUpperCase();
                } else {
                    button.textContent = key;
                }
            } else if (shiftMap[key]) {
                // Numbers and symbols: show shifted version when caps or shift is active
                if (isShiftPressed || isCapsLockOn) {
                    button.textContent = shiftMap[key];
                } else {
                    button.textContent = key;
                }
            }
        });
    }

    // Define QWERTY rows
    const rows = [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
        ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
        ['Caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
        ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
        ['Space']
    ];

    // Create keyboard rows container
    const keyboardRows = document.createElement('div');
    keyboardRows.style.display = 'flex';
    keyboardRows.style.flexDirection = 'column';
    keyboardRows.style.flex = '1';
    keyboardRows.style.justifyContent = 'space-between';

    rows.forEach((row, rowIndex) => {
        const rowDiv = document.createElement('div');
        rowDiv.style.display = 'flex';
        rowDiv.style.justifyContent = 'center';
        rowDiv.style.gap = '8px';
        rowDiv.style.flex = '1';
        rowDiv.style.padding = '2px 0';

        row.forEach((key, colIndex) => {
            const keyButton = document.createElement('div');
            keyButton.style.background = '#666';
            keyButton.style.border = '1px solid #888';
            keyButton.style.borderRadius = '6px';
            keyButton.style.color = '#fff';
            keyButton.style.display = 'flex';
            keyButton.style.alignItems = 'center';
            keyButton.style.justifyContent = 'center';
            keyButton.style.fontSize = '14px';
            keyButton.style.fontFamily = 'monospace';
            keyButton.style.cursor = 'pointer';
            keyButton.style.userSelect = 'none';
            keyButton.style.minHeight = '30px';
            keyButton.style.transition = 'all 0.2s ease';
            keyButton.style.margin = '1px';
            keyButton.style.boxSizing = 'border-box';
            
            // Add data attribute for key identification
            keyButton.dataset.key = key;
            
            // Set key widths
            if (key === 'Space') {
                keyButton.style.flex = '6';
            } else if (['Backspace', 'Enter', 'Shift', 'Caps'].includes(key)) {
                keyButton.style.flex = '2';
            } else {
                keyButton.style.flex = '1';
            }

            keyButton.textContent = key === 'Space' ? '' : key;
            
            // Add click handler to insert text
            keyButton.addEventListener('click', () => {
                handleKeyClick(key, inputField);
            });
            
            // Add hover effect
            keyButton.addEventListener('mouseenter', () => {
                keyButton.style.background = '#777';
            });
            keyButton.addEventListener('mouseleave', () => {
                keyButton.style.background = '#666';
            });

            rowDiv.appendChild(keyButton);
        });

        keyboardRows.appendChild(rowDiv);
    });

    keyboard.appendChild(keyboardRows);
    overlay.appendChild(keyboard);
    document.body.appendChild(overlay);
    
    // Initialize key displays
    updateKeyDisplays();
}
