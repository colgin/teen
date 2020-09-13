import Component from './component'

function createElement(type, attrs, ...children) {
  return {
    type,
    attrs,
    children,
  }
}

export default {
  createElement,
  Component,
}
