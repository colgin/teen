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

export function isHtmlTag(tag) {
  return htmlTag[tag]
}

export function isClassComponent(type) {
  if (typeof type !== 'function') return false
  // maybe add type.prototype instanceof Component ?
  return type.toString.slice(0, 5) === 'class'
}

function makeMap(arr = []) {
  return arr.reduce((acc, value) => {
    acc[value] = true
    return acc
  }, Object.create(null))
}

export function asTextVnode(vnode) {
  const type = typeof vnode
  return vnode === null || ['undefined', 'string', 'number'].includes(type)
}

export function isComponent(type) {
  return typeof type === 'function'
}

export function isText(type) {
  return type === 'NODE_TEXT'
}
