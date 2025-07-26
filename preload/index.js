// Load controller support for all sites
const controllerSupport = require('./modules/controller-support')
try {
    controllerSupport()
    console.log('Controller support loaded globally')
} catch (err) {
    console.error('Controller support failed to load:', err)
}

if (location.host === 'www.youtube.com') {
    const xhrModifiers = require('./util/xhrModifiers')
    xhrModifiers.block() //it makes an xhr request pretty fast as soon as it loads, so fast that some modules don't have time to modify it...

    const fs = require('fs')
    const path = require('path')

    let modulesPath = path.join(__dirname, 'modules')
    let moduleFiles = fs.readdirSync(modulesPath)

    let modules = []
    for (let file of moduleFiles) {
        if (!file.endsWith('.js')) continue;
        // Skip controller-support since we load it globally above
        if (file === 'controller-support.js') continue;

        let modulePath = path.join(modulesPath, file)
        modules.push(require(modulePath))
    }

    for (let module of modules) {
        try {
            module()
        } catch (err) {
            console.error('a module experienced failure while loading', err)
        }
    }

    xhrModifiers.unblock()
}