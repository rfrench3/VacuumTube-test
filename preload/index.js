const controllerSupport = require('./modules/controller-support')
const mouseDisappear = require('./modules/mouse-disappear')

try {
    controllerSupport()
    console.log('Controller support loaded globally')
} catch (err) {
    console.error('Controller support failed to load:', err)
}

try {
    mouseDisappear()
    console.log('Mouse disappear loaded globally')
} catch (err) {
    console.error('Mouse disappear failed to load:', err)
}
