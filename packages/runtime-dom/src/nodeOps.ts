export const nodeOps = {
  createElement: tagName => document.createElement(tagName),
  remove: child => {
    const parentNode = child.parentNode
    if (parentNode) {
      parentNode.removeChild(child)
    }
  },
  insert: (child, parentNode, anchor = null) => {
    parentNode.insertBefore(child, anchor) // anchor不存在，则相当于appendChild
  },
  querySelector: selector => document.querySelector(selector),
  setElementText: (el, text) => (el.textContent = text),

  // 文本
  createText: text => document.createTextNode(text),
  setText: (node, text) => (node.nodeValue = text)
}
