import { updateComponent } from '../teen-dom/index'

const queue = []
const renderQueue = []

export const enqueueSetState = (stateChange, component) => {
  // async
  if (queue.length === 0) {
    defer(flush)
  }

  queue.push({
    stateChange,
    component,
  })

  if (!renderQueue.some((rq) => rq.component === component)) {
    renderQueue.push(component)
  }
}

export const flush = () => {
  let task
  while ((task = queue.pop())) {
    const { stateChange, component } = task

    if (!component._prevState) {
      component._prevState = Object.assign({}, component.state)
    }

    if (typeof stateChange === 'function') {
      const newState = stateChange(component._prevState)
      Object.assign(component.state, newState)
    } else {
      Object.assign(component.state, stateChange)
    }
    component._prevState = component.state
  }

  // render component
  let renderComponnet
  while ((renderComponnet = renderQueue.pop())) {
    updateComponent(renderComponnet)
  }
}

function defer(fn) {
  Promise.resolve().then(fn)
}
