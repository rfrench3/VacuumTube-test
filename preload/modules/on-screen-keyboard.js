
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
    overlay.style.outline = 'none';

    // Optionally, add a border or rounded corners for visibility
    overlay.style.borderTopLeftRadius = '16px';
    overlay.style.borderTopRightRadius = '16px';

    // Create QWERTY keyboard layout
    const keyboard = document.createElement('div');
    keyboard.style.width = '90%';
    keyboard.style.height = '90%';
    keyboard.style.display = 'flex';
    keyboard.style.flexDirection = 'column';
    keyboard.style.justifyContent = 'space-between';
    keyboard.style.padding = '20px';
    keyboard.style.boxSizing = 'border-box';

    // Define QWERTY rows
    const rows = [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
        ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
        ['Caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
        ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
        ['Ctrl', 'Alt', 'Space', 'Alt', 'Ctrl']
    ];

    rows.forEach((row, rowIndex) => {
        const rowDiv = document.createElement('div');
        rowDiv.style.display = 'flex';
        rowDiv.style.justifyContent = 'center';
        rowDiv.style.gap = '4px';
        rowDiv.style.flex = '1';

        row.forEach(key => {
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
            
            // Set key widths
            if (key === 'Space') {
                keyButton.style.flex = '6';
            } else if (['Backspace', 'Enter', 'Shift', 'Tab', 'Caps'].includes(key)) {
                keyButton.style.flex = '2';
            } else if (['Ctrl', 'Alt'].includes(key)) {
                keyButton.style.flex = '1.5';
            } else {
                keyButton.style.flex = '1';
            }

            keyButton.textContent = key === 'Space' ? '' : key;
            
            // Add hover effect
            keyButton.addEventListener('mouseenter', () => {
                keyButton.style.background = '#777';
            });
            keyButton.addEventListener('mouseleave', () => {
                keyButton.style.background = '#666';
            });

            rowDiv.appendChild(keyButton);
        });

        keyboard.appendChild(rowDiv);
    });

    overlay.appendChild(keyboard);

    document.body.appendChild(overlay);
    overlay.focus();
}
