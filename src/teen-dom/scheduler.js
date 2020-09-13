import * as utils from '../shared/utils'

// TODO: scheduler
let store = {
  nextUnitwork: null,
  wipRoot: null,
}

// 这个实现非常重要
function workLoop(dealine) {
  let shouldYield = false
  console.log(store.nextUnitwork)
  while (store.nextUnitwork && !shouldYield) {
    store.nextUnitwork = performUnitOfWork(store.nextUnitwork)
    shouldYield = dealine.timeRemaining() < 1
  }

  // there is no nextFiber means finish all
  if (!store.nextUnitwork && store.wipRoot) {
    commitRoot()
  }

  /* eslint-disable-next-line */
  requestIdleCallback(workLoop)
}

// 将大任务切分为小任务，然后挨个执行，这个函数的作用是
// 执行当前工作，返回下一个工作
function performUnitOfWork(fiber) {
  // 1. add dom node
  // 2. create new fibers
  // 3. return next unit of work
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  // make sure user can't see incomplte UI
  // if (fiber.parent) {
  //   fiber.parent.dom.appendChild(fiber.dom)
  // }

  // create new fibers for children
  const children = fiber.children
  let index = 0
  let preSibling = null
  while (index < children.length) {
    const child = children[index]

    let newFiber = null
    if (typeof child === 'string') {
      newFiber = {
        type: 'TYPE_TEXT',
        parent: fiber,
        children: child,
        dom: null,
      }
    } else {
      newFiber = {
        type: child.type,
        props: child.props,
        parent: fiber,
        children: child.children,
        dom: null,
      }
    }

    // child or sibling
    if (index === 0) {
      fiber.child = newFiber
    } else {
      preSibling.sibling = newFiber
    }
    preSibling = newFiber
    index++
  }

  // return next fiber
  if (fiber.child) return fiber.child

  // then sibling, then uncle(parents's sibling)
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
}

function createDom(fiber) {
  // debugger
  if (fiber.type === 'TYPE_TEXT') return document.createTextNode(fiber.children)

  if (utils.isHtmlTag(fiber.type)) {
    const dom = document.createElement(fiber.type)

    // set attribute
    if (fiber.props) {
      Object.keys(fiber.props).forEach((key) => {
        dom.setAttribute(key, fiber.props[key])
      })
    }
    return dom
  }
}

function commitRoot() {
  commitWork(store.wipRoot.child)
  store.wipRoot = null
}

function commitWork(fiber) {
  if (!fiber) return
  const domParent = fiber.parent.dom
  domParent.appendChild(fiber.dom)
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function start() {
  requestIdleCallback(workLoop)
}

function setWip(fiber) {
  store.wipRoot = fiber
}

function resetWip() {
  store.wipRoot = null
}

function setNextUnitwork(fiber) {
  store.nextUnitwork = fiber
}

export default {
  store,
  start,
  setWip,
  resetWip,
  setNextUnitwork,
}
