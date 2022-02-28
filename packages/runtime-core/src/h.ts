import { isArray, isObject } from '@vue/shared'
import { createVNode, isVNode } from './vnode'

export function h(type, propsOrChildren, children) {
  // 子节点要么是字符串（文本节点），要么是一个数组
  const l = arguments.length
  if (l === 2) {
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      if (isVNode(propsOrChildren)) {
        // 判断是不是一个vnode，是的话就是子节点，此时子节点要是一个数组
        return createVNode(type, null, [propsOrChildren])
      }
      // 此时只有type和属性，没有子节点
      return createVNode(type, propsOrChildren)
    } else {
      // 如果第二个参数不是对象，那么就是数组（子节点）
      return createVNode(type, null, propsOrChildren)
    }
  } else {
    if (l > 3) {
      children = Array.prototype.slice.call(arguments, 2)
    } else if (l === 3 && isVNode(children)) {
      children = [children]
    }
    return createVNode(type, propsOrChildren, children)
  }
}
