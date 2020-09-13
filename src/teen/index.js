import Component from './component'
import * as utils from '../shared/utils'

// 给文本节点加上type
function parseVnode(vnode) {
  if (utils.asTextVnode(vnode)) {
    return {
      type: 'NODE_TEXT',
      children: vnode === null || typeof vnode === 'undefined' ? '' : vnode,
    }
  }
  return vnode
}

function createElement(type, attrs, ...children) {
  return {
    type,
    attrs,
    children: children.map((child) => parseVnode(child)),
  }
}

export default {
  createElement,
  Component,
}
