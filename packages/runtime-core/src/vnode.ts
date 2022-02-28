import { isString, ShapeFlags, isObject, isArray } from '@vue/shared'
/**
 *
 * @param type  根据type来区分是组件还是元素
 * @param props 对象，一些属性
 * @param children 子节点
 */
export function createVNode(type, props, children = null) {
  // 判断是普通元素还是组件，还有可能是函数组件
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0

  const vnode = {
    __v_isVnode: true,
    type,
    props,
    children,
    component: null, // 存放组件的实例
    el: null, // 后面会把vnode和它真实节点绑定起来
    key: props && props.key,
    shapeFlag
  }
  normalizeChildren(vnode, children)
  return vnode
}

export function isVNode(vnode) {
  return vnode.__v_isVnode
}

function normalizeChildren(vnode, children) {
  let type = 0
  if (children === null) {
  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN
  } else {
    type = ShapeFlags.TEXT_CHILDREN
  }
  vnode.shapeFlag = vnode.shapeFlag | type
}

export const Text = Symbol('Text')
export function normalizeVNode(child) {
  // 如果子节点是一个对象，说明是一个vnode了，不用再处理
  if (isObject(child)) {
    return child
  }
  // 如果是字符串，转成vnode
  return createVNode(Text, null, String(child))
}
