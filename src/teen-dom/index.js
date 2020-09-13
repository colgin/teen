import * as utils from './utils'
import fiber from './scheduler'

function render(vnode, container) {
  container.appendChild(_render(vnode))
}

// vnode => dom
function _render(vnode) {
  // handle text node
  if (vnode === null || typeof vnode === 'undefined') vnode = ''
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    vnode = String(vnode)
  }
  if (typeof vnode === 'string') {
    return createTextNode(String(vnode))
  }

  if (utils.isHtmlTag(vnode.type)) {
    return createElm(vnode)
  }

  if (typeof vnode.type === 'function') {
    const component = createComponent(vnode.type, vnode.attrs)
    // 设置props
    setComponentProps(component, vnode.attrs)
    return component._subtree
  }
}

function createTextNode(text) {
  return document.createTextNode(text)
}

function createElm(vnode) {
  const elem = document.createElement(vnode.type)

  // set attribute
  if (vnode.attrs) {
    Object.keys(vnode.attrs).forEach((key) =>
      setAttribute(elem, key, vnode.attrs[key])
    )
  }

  // children
  if (vnode.children && vnode.children.length) {
    vnode.children.forEach((child) => render(child, elem))
  }
  return elem
}

function setAttribute(dom, name, value) {
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
  mountComponent(component)
}

// mount the component
export function mountComponent(component) {
  // update the component
  if (component._subtree && component.componentWillUpdate) {
    component.componentWillUpdate()
  }
  // vnode => dom
  const vnode = component.render()
  const subtree = _render(vnode)

  // invoke lifecycle hooks
  if (component._subtree) {
    if (component.componentDidUpdate) component.componentDidUpdate()
  } else if (component.componentDidMount) {
    component.componentDidMount()
  }

  if (component._subtree && component._subtree.parentNode) {
    component._subtree.parentNode.replaceChild(subtree, component._subtree)
  }
  component._subtree = subtree
  subtree._component = component
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
