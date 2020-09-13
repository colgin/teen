import * as utils from '../shared/utils'
import fiber from './scheduler'

function render(vnode, container) {
  if (!vnode) container.innerHTML = ''
  patch(null, vnode, container)
}

// vnode rendered in container
function patch(oldVnode, vnode, container) {
  // initial mount
  if (!oldVnode) {
    container.appendChild(mountVnode(vnode))
    return
  }

  // destroy, unmount old dom
  if (!vnode) {
    if (utils.isComponent(oldVnode.type)) {
      unmountComponent(oldVnode._instance)
    }
    container.removeChild(oldVnode._dom)
    return
  }

  // vnode with different type, unmount old dom, append new dom
  if (oldVnode.type !== vnode.type) {
    if (utils.isComponent(oldVnode)) {
      unmountComponent(oldVnode._instance)
    }
    container.replaceChild(oldVnode._dom, mountVnode(vnode))
    return
  }

  // vnode with same type, patch
  patchVnode(oldVnode, vnode)
}

// vnode -> dom
function mountVnode(vnode) {
  let dom
  // Text node
  if (utils.isText(vnode.type)) {
    dom = createTextNode(vnode.children)
  }

  if (utils.isHtmlTag(vnode.type)) {
    dom = createElement(vnode)
  }

  if (utils.isComponent(vnode.type)) {
    // 实例
    const component = createComponent(vnode.type, vnode.attrs)
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

  if (utils.isText(type)) {
    patchTextNode(oldVnode, vnode)
    vnode._dom = oldVnode.dom
  } else {
    if (utils.isHtmlTag(type)) {
      patchElement(oldVnode, vnode)
    } else if (utils.isComponent(type)) {
      patchComponent(oldVnode, vnode)
    }
    patchChildren(oldVnode, vnode)
    vnode._dom = oldVnode._dom // dom 不变
  }
}

function patchTextNode(oldVnode, vnode) {
  if (oldVnode.children !== vnode.children) {
    oldVnode._dom.textContent = vnode.children
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
    // 1. key exists in old attrs but not in new attrs: REMOVE
    if (typeof newAttrs[key] === 'undefined') {
      // dom.removeAttribute(key)
      // value is required in event unbinding
      removeElementAttribute(dom, key, oldAttrs[key])
    } else {
      // 2. key exists in old attrs and new attrs with different value: UPDATE
      if (newAttrs[key] !== oldAttrs[key]) {
        setElementAttribute(dom, key, newAttrs[key])
      }
    }
  }

  for (const key of newAttrsKeys) {
    // 3. key exists in new attrs but not in old attrs: ADD
    if (typeof oldAttrs[key] === 'undefined') {
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
  const oldChildren = oldVnode.children || []
  const newChildren = vnode.children || []
  for (let i = 0; i < newChildren.length; i++) {
    // TODO
    patch(oldChildren[i], newChildren[i])
  }
}

function isSomeNode(v1, v2) {
  if (
    v1.attrs &&
    v2.attrs &&
    typeof v1.attrs.key !== 'undefined' &&
    typeof v2.attrs.key !== 'undefined'
  ) {
    return v1.type === v2.type && v1.key === v2.key
  }
  return v1.type === v2.type
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
      patch(null, child, elem)
    })
  }
  return elem
}

function setElementAttribute(dom, name, value) {
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
    dom.setAttribute(name, value)
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
  dom.removeAttribute(name)
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
  if (component.prototype && component.prototype.render) {
    instance = new component(props)
  } else {
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

// unmout the component
function unmountComponent(component) {
  if (component.componentWillUnmount) {
    component.componentWillUnmount()
  }
}

export function updateComponent(instance) {
  patch(instance._vnode, instance.render())
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

export default {
  render,
  renderWithFiber,
}
