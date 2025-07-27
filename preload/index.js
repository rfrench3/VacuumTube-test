// Load controller support
const controllerSupport = require('./modules/controller-support')
try {
    controllerSupport()
    console.log('Controller support loaded globally')
} catch (err) {
    console.error('Controller support failed to load:', err)
}
