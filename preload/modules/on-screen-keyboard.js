
module.exports = function showOnScreenKeyboard() {
    // Check if overlay already exists
    const existing = document.getElementById('osk-modal-overlay');
    if (existing) {
        // If it exists, remove it (lower the keyboard)
        existing.remove();
        return;
    }

    // Capture the currently focused element before opening the keyboard
    const lastFocusedElement = document.activeElement;
    console.log('Last focused element:', lastFocusedElement);

    // Create the overlay div
    const overlay = document.createElement('div');
    overlay.id = 'osk-modal-overlay';
    overlay.tabIndex = 0; // Make it focusable
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
    overlay.style.outline = 'none';

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
    
    // Navigation state
    let currentRow = 0;
    let currentCol = 0;
    let allKeys = [];

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
            // Send the input to the last focused element and close keyboard
            commitInputToTarget();
        } else if (key === 'Exit') {
            // Exit the application
            try {
                const { ipcRenderer } = require('electron')
                ipcRenderer.invoke('exit-app')
            } catch (error) {
                console.error('Failed to exit app:', error)
                // Fallback for when electron is not available
                window.close()
            }
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
        
        // Don't automatically focus input field for navigation
        // Only focus when actually typing characters
        if (key !== 'Shift' && key !== 'Caps' && key !== 'Enter') {
            inputField.focus();
        }
    }

    // Function to check if element can receive text input
    function isInputElement(element) {
        if (!element) return false;
        
        const tagName = element.tagName.toLowerCase();
        if (tagName === 'input') {
            const type = element.type.toLowerCase();
            return ['text', 'password', 'email', 'search', 'tel', 'url'].includes(type);
        }
        return tagName === 'textarea' || element.contentEditable === 'true';
    }

    // Function to commit input to the target element and close keyboard
    function commitInputToTarget() {
        const inputValue = inputField.value;
        
        if (!lastFocusedElement || !isInputElement(lastFocusedElement)) {
            console.warn('No valid input element to send keys to');
            closeKeyboard();
            return;
        }
        
        try {
            // First, focus the target element
            lastFocusedElement.focus();
            
            if (lastFocusedElement.tagName.toLowerCase() === 'input' || 
                lastFocusedElement.tagName.toLowerCase() === 'textarea') {
                
                // For input/textarea elements, set the value directly
                const currentValue = lastFocusedElement.value || '';
                const start = lastFocusedElement.selectionStart || 0;
                const end = lastFocusedElement.selectionEnd || 0;
                
                // Insert the new text at the cursor position
                const newValue = currentValue.substring(0, start) + inputValue + currentValue.substring(end);
                lastFocusedElement.value = newValue;
                
                // Set cursor position after the inserted text
                const newCursorPos = start + inputValue.length;
                lastFocusedElement.setSelectionRange(newCursorPos, newCursorPos);
                
                // Trigger multiple events to ensure frameworks detect the change
                const events = ['input', 'change', 'keyup'];
                events.forEach(eventType => {
                    const event = new Event(eventType, { bubbles: true, cancelable: true });
                    lastFocusedElement.dispatchEvent(event);
                });
                
            } else if (lastFocusedElement.contentEditable === 'true') {
                // For contentEditable elements, use document.execCommand
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    range.insertNode(document.createTextNode(inputValue));
                    range.collapse(false);
                } else {
                    // Fallback if no selection
                    lastFocusedElement.textContent += inputValue;
                }
            }
            
            console.log('Input committed to target element:', inputValue);
            console.log('Target element:', lastFocusedElement);
            
        } catch (error) {
            console.error('Error committing input to target element:', error);
            console.log('Attempting fallback method...');
            
            // Fallback: try to set value directly
            try {
                if (lastFocusedElement.value !== undefined) {
                    lastFocusedElement.value = inputValue;
                    lastFocusedElement.dispatchEvent(new Event('input', { bubbles: true }));
                }
            } catch (fallbackError) {
                console.error('Fallback method also failed:', fallbackError);
            }
        }
        
        // Close the keyboard
        closeKeyboard();
    }

    // Function to close keyboard and restore focus
    function closeKeyboard() {
        // Remove the overlay
        overlay.remove();
        
        // Restore focus to the last focused element
        if (lastFocusedElement && isInputElement(lastFocusedElement)) {
            setTimeout(() => {
                lastFocusedElement.focus();
            }, 100);
        }
    }

    // Function to update modifier key appearance
    function updateModifierKeyAppearance() {
        const allButtons = document.querySelectorAll('#osk-modal-overlay [data-key]');
        allButtons.forEach(button => {
            const key = button.dataset.key;
            button.classList.remove('modifier-active');
            
            if (key === 'Shift' && isShiftPressed) {
                button.style.background = '#ff6b35';
                button.style.border = '2px solid #ff8c42';
                button.classList.add('modifier-active');
            } else if (key === 'Caps' && isCapsLockOn) {
                button.style.background = '#ff6b35';
                button.style.border = '2px solid #ff8c42';
                button.classList.add('modifier-active');
            } else if ((key === 'Shift' || key === 'Caps') && !button.classList.contains('selected')) {
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
            if (['Shift', 'Caps', 'Enter', 'Backspace', 'Space', 'Exit'].includes(key)) {
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

    // Function to update selection visual
    function updateSelection() {
        // Remove selection from all keys
        allKeys.flat().forEach(key => {
            key.classList.remove('selected');
            if (!key.classList.contains('modifier-active')) {
                key.style.background = '#666';
                key.style.border = '1px solid #888';
            }
            key.style.boxShadow = 'none';
        });
        
        // Add selection to current key
        if (allKeys[currentRow] && allKeys[currentRow][currentCol]) {
            const selectedKey = allKeys[currentRow][currentCol];
            selectedKey.classList.add('selected');
            selectedKey.style.background = '#0078d4';
            selectedKey.style.border = '2px solid #ffffff';
            selectedKey.style.boxShadow = '0 0 10px rgba(0, 120, 212, 0.5)';
        }
    }

    // Define QWERTY rows
    const rows = [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
        ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
        ['Caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
        ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
        ['Space', 'Exit']
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

        const rowKeys = [];

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
            keyButton.dataset.row = rowIndex;
            keyButton.dataset.col = colIndex;
            
            // Set key widths
            if (key === 'Space') {
                keyButton.style.flex = '6';
            } else if (['Backspace', 'Enter', 'Shift', 'Caps', 'Exit'].includes(key)) {
                keyButton.style.flex = '2';
            } else {
                keyButton.style.flex = '1';
            }

            keyButton.textContent = key === 'Space' ? '' : key;
            
            // Special styling for Exit button
            if (key === 'Exit') {
                keyButton.style.background = '#d32f2f';
                keyButton.style.border = '1px solid #b71c1c';
                keyButton.style.color = '#fff';
                keyButton.style.fontWeight = 'bold';
            }
            
            // Add click handler to insert text
            keyButton.addEventListener('click', () => {
                // Update navigation position to clicked key
                currentRow = rowIndex;
                currentCol = colIndex;
                updateSelection();
                handleKeyClick(key, inputField);
            });
            
            // Add hover effect
            keyButton.addEventListener('mouseenter', () => {
                if (!keyButton.classList.contains('selected')) {
                    if (key === 'Exit') {
                        keyButton.style.background = '#f44336';
                    } else {
                        keyButton.style.background = '#777';
                    }
                }
            });
            keyButton.addEventListener('mouseleave', () => {
                if (!keyButton.classList.contains('selected') && !keyButton.classList.contains('modifier-active')) {
                    if (key === 'Exit') {
                        keyButton.style.background = '#d32f2f';
                    } else {
                        keyButton.style.background = '#666';
                    }
                }
            });

            rowKeys.push(keyButton);
            rowDiv.appendChild(keyButton);
        });

        allKeys.push(rowKeys);
        keyboardRows.appendChild(rowDiv);
    });

    keyboard.appendChild(keyboardRows);
    overlay.appendChild(keyboard);
    
    // Add keyboard navigation event handlers
    const handleNavigation = (e) => {
        // Only handle navigation keys when the overlay exists
        if (!document.getElementById('osk-modal-overlay')) return;
        
        // Handle navigation keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Escape'].includes(e.key)) {
            e.preventDefault();
            e.stopPropagation();
            
            switch(e.key) {
                case 'ArrowUp':
                    if (currentRow > 0) {
                        currentRow--;
                        // Adjust column if the new row has fewer keys
                        if (currentCol >= allKeys[currentRow].length) {
                            currentCol = allKeys[currentRow].length - 1;
                        }
                        updateSelection();
                    }
                    break;
                    
                case 'ArrowDown':
                    if (currentRow < allKeys.length - 1) {
                        currentRow++;
                        // Adjust column if the new row has fewer keys
                        if (currentCol >= allKeys[currentRow].length) {
                            currentCol = allKeys[currentRow].length - 1;
                        }
                        updateSelection();
                    }
                    break;
                    
                case 'ArrowLeft':
                    if (currentCol > 0) {
                        currentCol--;
                        updateSelection();
                    } else {
                        // Wrap to rightmost key in current row
                        currentCol = allKeys[currentRow].length - 1;
                        updateSelection();
                    }
                    break;
                    
                case 'ArrowRight':
                    if (currentCol < allKeys[currentRow].length - 1) {
                        currentCol++;
                        updateSelection();
                    } else {
                        // Wrap to leftmost key in current row
                        currentCol = 0;
                        updateSelection();
                    }
                    break;
                    
                case 'Enter':
                case ' ':
                    if (allKeys[currentRow] && allKeys[currentRow][currentCol]) {
                        const selectedKey = allKeys[currentRow][currentCol];
                        const key = selectedKey.dataset.key;
                        handleKeyClick(key, inputField);
                    }
                    break;
                    
                case 'Escape':
                    closeKeyboard();
                    break;
            }
        }
    };
    
    // Add event listeners to both overlay and document
    overlay.addEventListener('keydown', handleNavigation);
    document.addEventListener('keydown', handleNavigation, true);
    
    // Clean up event listener when overlay is removed
    const originalRemove = overlay.remove;
    overlay.remove = function() {
        document.removeEventListener('keydown', handleNavigation, true);
        
        // Restore focus to the last focused element
        if (lastFocusedElement && isInputElement(lastFocusedElement)) {
            setTimeout(() => {
                lastFocusedElement.focus();
            }, 100);
        }
        
        originalRemove.call(this);
    };
    
    document.body.appendChild(overlay);
    
    // Initialize displays and focus
    updateKeyDisplays();
    updateSelection();
    
    // Focus the overlay for navigation (not the input field)
    setTimeout(() => {
        overlay.focus();
    }, 100);
}
