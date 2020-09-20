'use strict'

Object.defineProperty(exports, '__esModule', { value: true })

const htmlTag = makeMap([
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'div',
  'p',
  'video',
  'a',
  'b',
  'br',
  'button',
  'code',
  'dd',
  'dl',
  'dt',
  'em',
  'embed',
  'fieldset',
  'form',
  'frame',
  'head',
  'hr',
  'i',
  'img',
  'input',
  'label',
  'li',
  'ol',
  'option',
  'pre',
  'q',
  'section',
  'select',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'title',
  'tr',
  'tt',
  'ul',
])

function isHtmlTag(tag) {
  return htmlTag[tag]
}

function makeMap(arr = []) {
  return arr.reduce((acc, value) => {
    acc[value] = true
    return acc
  }, Object.create(null))
}

function asTextVnode(vnode) {
  const type = typeof vnode
  return vnode === null || ['undefined', 'string', 'number'].includes(type)
}

function isText(type) {
  return type === 'NODE_TEXT'
}

function isComponent(type) {
  return typeof type === 'function'
}

function existKey(target = {}, key) {
  return typeof target[key] !== 'undefined'
}

function shallowEqual(v1, v2) {
  if (typeof v1 !== typeof v2) return false

  if (v1 === v2) return true

  if (Array.isArray(v1)) {
    if (!Array.isArray(v2)) return false
    return (
      v1.length === v2.length &&
      v1.every((v, index) => shallowEqual(v, v2[index]))
    )
  }

  if (typeof v1 === 'object') {
    const keys1 = Object.keys(v1)
    const keys2 = Object.keys(v2)
    if (keys1.length !== keys2.length) return false

    return keys1.every((key) => shallowEqual(v1[key], v2[key]))
  }
  return false
}

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

  if (isHtmlTag(fiber.type)) {
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

var fiber = {
  store,
  start,
  setWip,
  resetWip,
  setNextUnitwork,
}

function render(vnode, container) {
  if (!vnode) container.innerHTML = ''
  patch(null, vnode, container)
}

// vnode rendered in container, oldVnode, vnode may have different type
function patch(oldVnode, vnode, container) {
  // initial mount
  if (!oldVnode) {
    container.appendChild(mountVnode(vnode))
    return
  }

  // destroy, unmount old dom
  if (!vnode) {
    unmount(oldVnode)
    container.removeChild(oldVnode._dom)
    return
  }

  // vnode with different type, unmount old dom, append new dom
  if (oldVnode.type !== vnode.type) {
    unmount(oldVnode)
    container.replaceChild(oldVnode._dom, mountVnode(vnode))
    return
  }

  // vnode with same type, patch
  patchVnode(oldVnode, vnode)
}

// vnode -> dom
function mountVnode(vnode) {
  let dom
  const type = vnode.type

  // Text node
  if (isText(type)) {
    dom = createTextNode(vnode.children)
  }

  if (isHtmlTag(type)) {
    dom = createElement(vnode)
  }

  if (isComponent(type)) {
    // 实例
    const component = createComponent(type, vnode.attrs)
    // 设置props
    setComponentProps(component, vnode.attrs)
    // 挂载实例
    mountComponent(component)
    dom = component._subtree
    vnode._instance = component
  }
  vnode._dom = dom
  return dom
}

// oldVnode and vnode have same type, diff and patch dom
function patchVnode(oldVnode, vnode) {
  const type = vnode.type

  if (isText(type)) {
    patchTextNode(oldVnode, vnode)
    vnode._dom = oldVnode._dom
  } else {
    if (isHtmlTag(type)) {
      patchElement(oldVnode, vnode)
    } else if (isComponent(type)) {
      patchComponent(oldVnode, vnode)
    }
    patchChildren(oldVnode, vnode)
    vnode._dom = oldVnode._dom // dom 不变
  }
}

function patchTextNode(oldVnode, vnode) {
  if (oldVnode.children !== vnode.children) {
    // nodeValue is much more efficient than textContent
    oldVnode._dom.nodeValue = vnode.children
  }
}

function patchElement(oldVnode, vnode) {
  const dom = oldVnode._dom
  // patch attribute
  const oldAttrs = oldVnode.attrs || {}
  const newAttrs = vnode.attrs || {}
  const oldAttrsKeys = Object.keys(oldAttrs)
  const newAttrsKeys = Object.keys(newAttrs)

  for (const key of oldAttrsKeys) {
    if (key === 'key') {
      continue
    }
    // 1. key exists in old attrs but not in new attrs: REMOVE
    // if (typeof newAttrs[key] === 'undefined') {
    if (!existKey(newAttrs, key)) {
      // value is required in event unbinding
      removeElementAttribute(dom, key, oldAttrs[key])
    } else {
      // 2. key exists in old attrs and new attrs with different value: UPDATE
      if (!shallowEqual(newAttrs[key], oldAttrs[key])) {
        setElementAttribute(dom, key, newAttrs[key])
      }
    }
  }

  for (const key of newAttrsKeys) {
    if (key === 'key') {
      continue
    }
    // 3. key exists in new attrs but not in old attrs: ADD
    if (!existKey(oldAttrs, key)) {
      setElementAttribute(dom, key, newAttrs[key])
    }
  }
}

function patchComponent(oldVnode, vnode) {
  // 1. patch attrs
  // component instance
  const instance = vnode._instance
  // upadate component props
  setComponentProps(instance, vnode.attrs)

  // SCU lifecycle hook
  if (
    instance.shouldComponentUpdate &&
    instance.shouldComponentUpdate(vnode.attrs, instance.porps) === false
  ) {
    return
  }

  // 2. mount / update component
  mountComponent(instance)

  vnode._instance = instance
}

function patchChildren(oldVnode, vnode) {
  // handle list
  const oldChildren = (oldVnode.children || []).reduce((acc, child) => {
    return [].concat.call(acc, child)
  }, [])
  const newChildren = (vnode.children || []).reduce((acc, child) => {
    return [].concat.call(acc, child)
  }, [])
  const parent = oldVnode._dom
  // const oldChildren = oldVnode.children || []
  // const newChildren = vnode.children || []
  let oldStartIndex = 0
  let oldEndIndex = oldChildren.length - 1
  let newStartIndex = 0
  let newEndIndex = newChildren.length - 1
  let oldStartNode = oldChildren[oldStartIndex]
  let oldEndNode = oldChildren[oldEndIndex]
  let newStartNode = newChildren[newStartIndex]
  let newEndNode = newChildren[newEndIndex]

  let keyToIdx

  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    if (oldStartNode === null) {
      oldStartNode = oldChildren[++oldStartIndex]
    } else if (oldEndNode === null) {
      oldEndNode = oldChildren[--oldEndIndex]
    } else if (newStartNode === null) {
      newStartNode = newChildren[++newStartIndex]
    } else if (newEndNode === null) {
      newEndNode = newChildren[--newEndIndex]
    } else if (isSameNode(oldStartNode, newStartNode)) {
      patchVnode(oldStartNode, newStartNode)
      oldStartNode = oldChildren[++oldStartIndex]
      newStartNode = newChildren[++newStartIndex]
    } else if (isSameNode(oldEndNode, newEndNode)) {
      patchVnode(oldEndNode, newEndNode)
      oldEndNode = oldChildren[--oldEndIndex]
      newEndNode = newChildren[--newEndIndex]
    } else if (isSameNode(oldStartNode, newEndNode)) {
      patchVnode(oldStartNode, newEndNode)
      parent.insertBefore(newEndNode._dom, oldEndNode._dom.nextSibling)
    } else if (isSameNode(oldEndNode, newStartNode)) {
      patchVnode(oldEndNode, newStartNode)
      parent.insertBefore(newStartNode._dom, oldStartNode._dom)
    } else {
      if (!keyToIdx) {
        keyToIdx = createKeyToIndex(oldChildren, oldStartIndex, oldEndIndex)
      }
      const idxInOld = keyToIdx[newStartNode.attrs.key]
      if (idxInOld) {
        const node = oldChildren[idxInOld]
        if (node.type === newStartNode.type) {
          patchVnode(node, newStartNode)
          oldChildren[idxInOld] = undefined
          parent.insertBefore(newStartNode._dom, oldStartNode._dom)
        } else {
          parent.insertBefore(mountVnode(newStartNode), oldStartNode._dom)
        }
      } else {
        // create new element
        parent.insertBefore(mountVnode(newStartNode), oldStartNode._dom)
      }
      newStartNode = newChildren[++newStartIndex]
    }
  }

  // del node in parent
  if (oldStartIndex <= oldEndIndex) {
    for (let i = oldStartIndex; i <= oldEndIndex; i++) {
      // has been moved
      if (oldChildren[i] !== undefined) {
        unmount(oldChildren[i])
        parent.removeChild(oldChildren[i]._dom)
      }
    }
  }
  // add node in parent
  if (newStartIndex <= newEndIndex) {
    for (let i = newStartIndex; i <= newEndIndex; i++) {
      parent.insertBefore(
        mountVnode(newChildren[i]),
        newChildren[newEndIndex + 1] === null
          ? null
          : newChildren[newEndIndex + 1]
      )
    }
  }
}

function isSameNode(v1, v2) {
  if (
    v1.attrs &&
    v2.attrs &&
    existKey(v1.attrs, 'key') &&
    existKey(v2.attrs, 'key')
  ) {
    return v1.type === v2.type && v1.attrs.key === v2.attrs.key
  }
  return v1.type === v2.type
}

function createKeyToIndex(children = [], start, end) {
  return children.slice(start, end + 1).reduce((map, child, i) => {
    if (existKey(child.attrs, 'key')) {
      map[child.attrs.key] = i + start
    }
    return map
  }, {})
}

function createTextNode(text) {
  return document.createTextNode(text)
}

// vnode -> 原生dom
function createElement(vnode) {
  const elem = document.createElement(vnode.type)

  // set attribute
  if (vnode.attrs) {
    Object.keys(vnode.attrs).forEach((key) =>
      setElementAttribute(elem, key, vnode.attrs[key])
    )
  }

  // children
  if (vnode.children && vnode.children.length) {
    vnode.children.forEach((child) => {
      // list
      if (Array.isArray(child)) {
        child.forEach((ch) => patch(null, ch, elem))
      } else {
        patch(null, child, elem)
      }
    })
  }
  return elem
}

function setElementAttribute(dom, name, value) {
  if (name === 'key') return

  // className => class
  if (name === 'className') {
    dom.class = value
    return
  }

  // 事件
  let res = name.match(/^on(\w+)$/)
  if (res) {
    dom.addEventListener(res[1].toLowerCase(), value)
    return
  }

  if (name === 'style') {
    setDomStyle(dom, value)
    return
  }
  if (value) {
    if (name in dom) {
      dom[name] = value
    } else {
      dom.setAttribute(name, value)
    }
  } else {
    dom.removeAttribute(name)
  }
}

function removeElementAttribute(dom, name, value) {
  if (name === 'className') {
    dom.class = ''
    return
  }
  // 事件
  let res = name.match(/^on(\w+)$/)
  if (res) {
    dom.removeEventListener(res[1].toLowerCase(), value)
    return
  }
  if (name in dom) {
    dom[name] = ''
  } else {
    dom.removeAttribute(name)
  }
}

function setDomStyle(dom, value) {
  if (!value) return
  // 需要处理文本形式和对象形式
  if (typeof value === 'string') {
    dom.style = value
  } else if (typeof value === 'object') {
    dom.style = Object.keys(value).reduce((css, key) => {
      css += `${key}: ${value[key]};`
      return css
    }, '')
  }
}

// create component instance
function createComponent(component, props) {
  let instance

  // class style
  if (component.prototype && component.prototype.render) {
    instance = new component(props)
  } else {
    // function style
    instance = new component(props) // 函数组件当成构造函数使用
    instance.constructor = component
    instance.render = function () {
      return this.constructor(props)
    }
  }
  return instance
}

// set props
function setComponentProps(component, props) {
  // first mount
  if (!component._subtree) {
    if (component.componentWillMount) component.componentWillMount()
  } else if (component.componentWillReceiveProps) {
    // not first mount
    component.componentWillReceiveProps(props)
  }

  component.props = props
}

// mount / update component
function mountComponent(component) {
  // update component
  if (component._subtree && component.componentWillUpdate) {
    component.componentWillUpdate()
  }

  let subtree = component._subtree
  const vnode = component.render()

  if (subtree) {
    // update
    patchVnode(component._vnode, vnode)
    if (component.componentDidUpdate) component.componentDidUpdate()
  } else {
    // initial mount
    subtree = mountVnode(vnode)
    if (component.componentDidMount) component.componentDidMount()
  }

  component._subtree = subtree
  subtree._component = component
  component._vnode = vnode
}

// unmount component and its children
function unmount(vnode) {
  if (vnode.children && vnode.children.length) {
    for (const childVnode of vnode.children) {
      unmount(childVnode)
    }
  }
  if (isComponent(vnode.type)) {
    const instance = vnode._instance
    if (instance.componentWillUnmount) {
      instance.componentWillUnmount()
    }
  }
}

function updateComponent(instance) {
  const newVnode = instance.render()
  patch(instance._vnode, newVnode)
  instance._vnode = newVnode
}

// TODO: fiber
fiber.store.wipRoot = null
fiber.store.nextUnitOfWork = null
function renderWithFiber(vnode, container) {
  const wip = {
    dom: container,
    porps: {
      // children: [vnode],
    },
    children: [vnode],
  }
  fiber.setWip(wip)
  fiber.setNextUnitwork(wip)
  fiber.start()
}

var index = {
  render,
  renderWithFiber,
}

const queue = []
const renderQueue = []

const enqueueSetState = (stateChange, component) => {
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

const flush = () => {
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

class Component {
  constructor(props = {}) {
    this.state = {}
    this.props = props
  }

  setState(value) {
    enqueueSetState(value, this)
  }
}

// 给文本节点加上type
function parseVnode(vnode) {
  if (asTextVnode(vnode)) {
    return {
      type: 'NODE_TEXT',
      children: vnode === null || typeof vnode === 'undefined' ? '' : vnode,
    }
  }

  return vnode
}

function createElement$1(type, attrs, ...children) {
  return {
    type,
    attrs,
    children: children.map((child) => parseVnode(child)),
  }
}

// function createElement(type, attrs, )

var index$1 = {
  createElement: createElement$1,
  Component,
}

exports.Teen = index$1
exports.TeenDom = index
