//controller support (normal leanback doesnt have this for some reason, not sure how the console apps do it...)

const { ipcRenderer } = require('electron')

const onScreenKeyboard = require('./on-screen-keyboard')



module.exports = async () => {
    const gamepadKeyCodeMap = { //aiming to maintain parity with the console versions of leanback
        0:  13,  //a -> enter
        1:  27,  //b -> escape
        2:  32,  //x -> space
        3:  13,  //y -> return (same as enter)
        4:  'shift+tab', //left bumper -> shift+tab
        5:  9, //right bumper -> tab
        6:  113, //left trigger -> f2 (seek backwards)
        7:  114, //right trigger -> f3 (seek forwards)
        8:  'osk', //select -> open on-screen keyboard
        9:  13,  //start -> enter
        12: 38,  //dpad up -> arrow key up
        13: 40,  //dpad down -> arrow key down
        14: 37,  //dpad left -> arrow key left
        15: 39   //dpad right -> arrow key right
    }

    // Key mapping for Electron's sendInputEvent
    const keyCodeToKeyMap = {
        13: { code: 'Return', key: 'Enter' },
        27: { code: 'Escape', key: 'Escape' },
        32: { code: 'Space', key: ' ' },
        115: { code: 'F4', key: 'F4' },
        9: { code: 'Tab', key: 'Tab' },
        113: { code: 'F2', key: 'F2' },
        114: { code: 'F3', key: 'F3' },
        38: { code: 'Up', key: 'ArrowUp' },
        40: { code: 'Down', key: 'ArrowDown' },
        37: { code: 'Left', key: 'ArrowLeft' },
        39: { code: 'Right', key: 'ArrowRight' },
        135: { code: 'F24', key: 'F24' }
    }

    const fallbackKeyCode = 135; //f24, key isn't used by youtube but is picked up and brings up the menu thing (which all buttons do if they dont do anything else)
    const keyRepeatInterval = 100;
    const keyRepeatDelay = 500;

    const pressedButtons = {}
    let keyRepeatTimeout;

    let focused = await ipcRenderer.invoke('is-focused')

    ipcRenderer.on('focus', () => {
        focused = true;
    })

    ipcRenderer.on('blur', () => {
        focused = false;
    })

    requestAnimationFrame(pollGamepads)

    function pollGamepads() {
        const gamepads = navigator.getGamepads()
        for (let index of Object.keys(pressedButtons)) {
            if (!gamepads[index]) pressedButtons[index] = null;
        }

        let steamInput = gamepads.find(g => g && g.id.endsWith('(STANDARD GAMEPAD Vendor: 28de Product: 11ff)'))
        if (steamInput) { //the one true controller here
            handleGamepad(steamInput)
        } else {
            for (let gamepad of gamepads) {
                handleGamepad(gamepad)
            }
        }

        requestAnimationFrame(pollGamepads)
    }

    function handleGamepad(gamepad) {
        if (!gamepad || !gamepad.connected) return;

        const index = gamepad.index;
        if (!pressedButtons[index]) pressedButtons[index] = {}

        for (let i = 0; i < gamepad.buttons.length; i++) {
            let keyCode = gamepadKeyCodeMap[i]
            if (!keyCode) keyCode = fallbackKeyCode;

            let button = gamepad.buttons[i]
            let buttonWasPressed = pressedButtons[index][i]

            if (button.pressed && !buttonWasPressed) {
                pressedButtons[index][i] = true;
                simulateKeyDown(keyCode)
                stopKeyRepeat()
                keyRepeatTimeout = setTimeout(() => startKeyRepeat(keyCode), keyRepeatDelay)
            } else if (!button.pressed && buttonWasPressed) {
                pressedButtons[index][i] = false;
                simulateKeyUp(keyCode)
                stopKeyRepeat()
            }
        }

        for (let i = 0; i < gamepad.axes.length; i++) {
            let axisValue = gamepad.axes[i]
            let keyCode = null;
            let axisIndex = i + gamepad.buttons.length; //this is kind of hacky but its fine

            let axisWasPressed = pressedButtons[index][axisIndex]
            let lastKeyCode = pressedButtons[index][axisIndex + '_keyCode']

            if (i === 0) {
                if (axisValue > 0.5) {
                    keyCode = 39; //right arrow
                } else if (axisValue < -0.5) {
                    keyCode = 37; //left arrow
                }
            } else if (i === 1) {
                if (axisValue > 0.5) {
                    keyCode = 40; //down arrow
                } else if (axisValue < -0.5) {
                    keyCode = 38; //up arrow
                }
            } else if (i === 2 || i === 3) {
                if (axisValue > 0.5 || axisValue < -0.5) {
                    keyCode = fallbackKeyCode;
                }
            }

            if (keyCode) {
                if (!axisWasPressed) {
                    pressedButtons[index][axisIndex] = true;
                    pressedButtons[index][axisIndex + '_keyCode'] = keyCode;
                    simulateKeyDown(keyCode)
                    stopKeyRepeat()
                    keyRepeatTimeout = setTimeout(() => startKeyRepeat(keyCode), keyRepeatDelay)
                }
            } else {
                if (axisWasPressed) {
                    pressedButtons[index][axisIndex] = false;
                    if (lastKeyCode) {
                        simulateKeyUp(lastKeyCode)
                    }
                    pressedButtons[index][axisIndex + '_keyCode'] = null;
                    stopKeyRepeat()
                }
            }
        }
    }

    function simulateKeyDown(keyCode) {
        if (!focused) return;

        // Handle special actions
        if (keyCode === 'osk') {
            onScreenKeyboard();
            return;
        }

        // Handle special key combinations
        if (keyCode === 'shift+tab') {
            const { ipcRenderer } = require('electron')
            ipcRenderer.invoke('send-key-event', 'keyDown', {
                type: 'keyDown',
                keyCode: 'Tab',
                modifiers: ['shift']
            })
            return;
        }

        const keyInfo = keyCodeToKeyMap[keyCode] || { code: 'Unidentified', key: 'Unidentified' }
        
        // Use Electron's native input events for trusted keyboard simulation
        const { ipcRenderer } = require('electron')
        ipcRenderer.invoke('send-key-event', 'keyDown', {
            type: 'keyDown',
            keyCode: keyInfo.code
        })
    }

    function simulateKeyUp(keyCode) {
        if (!focused) return;

        // Handle special actions (no keyup needed for OSK)
        if (keyCode === 'osk') {
            return;
        }

        // Handle special key combinations
        if (keyCode === 'shift+tab') {
            const { ipcRenderer } = require('electron')
            ipcRenderer.invoke('send-key-event', 'keyUp', {
                type: 'keyUp',
                keyCode: 'Tab',
                modifiers: ['shift']
            })
            return;
        }

        const keyInfo = keyCodeToKeyMap[keyCode] || { code: 'Unidentified', key: 'Unidentified' }
        
        // Use Electron's native input events for trusted keyboard simulation
        const { ipcRenderer } = require('electron')
        ipcRenderer.invoke('send-key-event', 'keyUp', {
            type: 'keyUp',
            keyCode: keyInfo.code
        })
    }    function startKeyRepeat(keyCode) {
        clearInterval(keyRepeatTimeout)
        clearTimeout(keyRepeatTimeout)
        keyRepeatTimeout = setInterval(() => simulateKeyDown(keyCode), keyRepeatInterval)
    }

    function stopKeyRepeat() {
        clearInterval(keyRepeatTimeout)
    }
}