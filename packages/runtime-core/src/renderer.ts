import { effect } from '@vue/reactivity'
import { ShapeFlags } from '@vue/shared'
import { createAppAPI } from './apiCreateApp'
import { createComponentInstance, setupComponent } from './component'
import { queueJob } from './scheduler'
import { normalizeVNode, Text } from './vnode'

export function createRenderer(rendererOptions) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createText: hostCreateText,
    createElement: hostCreateElement,
    setElementText: hostSetElementText,
    setText: hostSetText,
    nextSibling: hostNextSibling,
    querySelector: hostQuerySelector
  } = rendererOptions

  const setupRendererEffect = (instance, container) => {
    // 需要创建一个effect，然后在effect中调用render
    // 这样render中使用到属性就会收集到这个effect，属性更新的时候触发这个effect，重新执行render方法

    // vue3是组件级更新，每一个组件都有一个effect，数据更新会重新执行对应组件的effect
    effect(
      function componentEffect() {
        if (!instance.isMounted) {
          // 组件初次渲染
          let proxyToUse = instance.proxy
          let subTree = (instance.subTree = instance.render.call(
            proxyToUse,
            proxyToUse
          ))
          // 初次渲染，旧的vnode没有，然后用render函数返回的vnode进行渲染
          patch(null, subTree, container)
          instance.isMounted = true
        } else {
          // 组件更新
          const prevTree = instance.subTree // 上面是渲染，记录下上一次的vnode赋值到instance.subTree
          let proxyToUse = instance.proxy
          let nextTree = (instance.subTree = instance.render.call(
            proxyToUse,
            proxyToUse
          ))
          patch(prevTree, nextTree, container)
        }
      },
      {
        // effect => {} ，render里数据更新的时候，会调用这个，然后相当于上面的componentEffect调用一遍
        // 此时isMounted = true了，所以就走更新逻辑
        // 更新逻辑也就是再调用一次render，生成新的vnode，然后和旧的vnode进行比较
        scheduler: queueJob
      }
    )
  }

  const mountComponent = (initialVnode, container) => {
    // 组件的渲染流程：核心就是调用setup，拿到返回值
    // 然后再调用render返回的结果进行渲染 render --> vnode
    // 1. 先有实例
    const instance = (initialVnode.component =
      createComponentInstance(initialVnode))
    // 2. 需要的数据解析到实例上 因为render方法接收一个proxy
    setupComponent(instance) // 通过这个，已经把render，props，setupState处理了
    // 3. 创建一个effect，让render函数执行。这样数据更新的时候，render会再次被调用
    setupRendererEffect(instance, container)
  }

  // 处理组件
  const processComponent = (n1, n2, container) => {
    if (!n1) {
      // 如果没有旧的vnode，说明是第一个渲染初始化的流程
      mountComponent(n2, container)
    } else {
      // 组件更新的流程
    }
  }

  // 处理普通元素
  const processElement = (n1, n2, container, anchor = null) => {
    if (!n1) {
      // 元素初始化
      mountElement(n2, container, anchor)
    } else {
      // 元素更新
      patchElement(n1, n2, container)
    }
  }
  // 挂载子节点
  const mountChildren = (parentEl, children) => {
    for (let i = 0; i < children.length; i++) {
      const child = normalizeVNode(children[i])
      patch(null, child, parentEl)
    }
  }
  // 挂载元素
  const mountElement = (vnode, container, anchor = null) => {
    const { props, type, shapeFlag, children } = vnode
    // 根据vnode创建元素，并赋值到vnode的el属性上
    const el = (vnode.el = hostCreateElement(type))
    // 给元素设置属性
    if (props) {
      for (let key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }

    // 处理子节点
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children) // 子节点只有一个并且是文本时，直接el.textContent = text
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 子节点有多个
      mountChildren(el, children)
    }

    // 插入容器
    hostInsert(el, container, anchor)
  }
  // 更新元素
  const patchElement = (n1, n2, container) => {
    const el = (n2.el = n1.el) // 复用节点
    const oldProps = n1.props || {}
    const newProps = n2.props || {}

    patchProps(oldProps, newProps, el)
    patchChildren(n1, n2, el)
  }
  // 更新元素的属性
  const patchProps = (oldProps, newProps, el) => {
    if (oldProps !== newProps) {
      // 遍历新的props，如果新旧属性值不一样，用新的替换旧的
      for (let key in newProps) {
        const prev = oldProps[key]
        const next = newProps[key]
        if (prev !== next) {
          hostPatchProp(el, key, prev, next)
        }
      }
      // 遍历旧的props，如果旧的有，新的里面找不到，说明需要删除该属性
      for (let key in oldProps) {
        if (!(key in newProps)) {
          hostPatchProp(el, key, oldProps[key], null)
        }
      }
    }
  }
  // 更新子节点
  const patchChildren = (n1, n2, parentNode) => {
    const oldChildren = n1.children // 旧的子节点
    const newChildren = n2.children // 新的子节点

    const prevShapeFlag = n1.shapeFlag
    const nextShapeFlag = n2.shapeFlag

    // 1. 新的vnode的子节点只有一个文本节点
    if (nextShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 旧的子节点是数组，需要删除掉之前的
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(oldChildren)
      }
      // 2. 如果新旧都是文本，直接替换文本就好了
      if (newChildren !== oldChildren) {
        hostSetElementText(parentNode, newChildren)
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (nextShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 3. 新旧都是数组，要进行dom-diff，核心
          patchKeyChildren(oldChildren, newChildren, parentNode)
        } else {
          // 代表新的vnode的children为空
          unmountChildren(oldChildren)
        }
      } else {
        // 上一次是文本
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(parentNode, '')
        }
        // 旧的子节点是文本，新的子节点是数组，则把文本设置为空，然后渲染子节点
        if (nextShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(parentNode, newChildren)
        }
      }
    }
  }
  // dom-diff核心
  const patchKeyChildren = (oldChildren, newChildren, parentNode) => {
    let i = 0 // 默认从0开始比较
    let e1 = oldChildren.length - 1 // 旧的最后一个下标
    let e2 = newChildren.length - 1 // 新的最后一个下标

    // 1. 从0开始，如果遇到新旧不相同的。直接停止
    while (i <= e1 && i <= e2) {
      const n1 = oldChildren[i]
      const n2 = newChildren[i]
      if (isSameVNodeType(n1, n2)) {
        // 如果两个相同，进行patch
        patch(n1, n2, parentNode)
      } else {
        break
      }
      i++ // 递增
    }

    // 2. 如果头头比较匹配不上，就从后面开始比较
    while (i <= e1 && i <= e2) {
      const n1 = oldChildren[e1]
      const n2 = newChildren[e2]
      if (isSameVNodeType(n1, n2)) {
        // 如果两个相同，进行patch
        patch(n1, n2, parentNode)
      } else {
        break
      }
      e1-- // 递增
      e2--
    }

    // abecd
    // abfmcd ---> 经过上面两个循环，就找到e，还有fm没有对比到

    if (i > e1) {
      // 新的多，老的少
      if (i <= e2) {
        // 需要新增,i和e2之前有多少个就新增多少个
        while (i <= e2) {
          // 找到e2下一个节点
          const nextPos = e2 + 1
          // [1, 2, 3, 4] ,如果nextPos大于数组的长度，说明已经在最后面了
          // 如果小于数组的长度，说明在中间，需要插入到某个节点之前
          const anchor =
            nextPos < newChildren.length ? newChildren[nextPos].el : null
          patch(null, newChildren[i], parentNode, anchor)
          i++
        }
      }
    } else if (i > e2) {
      // 老的多，新的少，需要删除一部分
      while (i <= e1) {
        unmount(oldChildren[i])
        i++
      }
    } else {
      // 最核心的，乱序比较。用新的列表做成一个映射表，然后循环老的列表，找到就复用，找不到就删除或是新增

      let s1 = i // 旧的children中还没比较到的子节点，最开始的下标
      let s2 = i // 新的children中还没比较到的子节点，最开始的下标

      // 1. vue3用新的children做映射表，vue2用就的列表做映射表
      const keyToNewIndexMap = new Map()
      for (let i = s2; i < e2; i++) {
        const childVNode = newChildren[i]
        keyToNewIndexMap.set(childVNode.key, i)
      }
      console.log(keyToNewIndexMap) // {a:0, b:1, c:2}  key: index

      /**
       *            s1=i=2              e1=5
       *  a       b         c d e q          f      g
       *  a       b         e c d h          f      g
       *            s2=i=2              e2=5
       * 
       *  经过上面头头比较，尾尾比较, s1和s2和i一样等于2，e1和e2一样等于5
       *  
       *  e2 - s2 + 1则是新的子节点中没比较到的个数，也就是 e c d h 这4个
       */
      const toBaPatched = e2 - s2 + 1
      console.log('newChildren 中还没对比到的个数：', toBaPatched)

      const newIndexToOldIndexMap = new Array(toBaPatched).fill(0) // [0, 0, 0, 0]

      // 2. 构建好映射表后，遍历老的列表，看有没有一样的key
      for (let i = s1; i < e1; i++) {
        const oldVNode = oldChildren[i]
        const newIndex = keyToNewIndexMap.get(oldVNode.key)
        if (!newIndex) {
          // 如果没有，说明这个老的vnode在新的列表里没找到，需要删除
          unmount(oldVNode)
        } else {
          newIndexToOldIndexMap[newIndex - s2] = i + 1

          // 有则说明找到了，进行patch
          patch(oldVNode, newChildren[newIndex], parentNode)
        }
      }
      console.log(newIndexToOldIndexMap)

      // 3.最后是移动节点，并且将新增的节点插入正确的位置
    }
  }
  // 处理文本节点
  const processText = (n1, n2, container) => {
    if (!n1) {
      hostInsert((n2.el = hostCreateText(n2.children)), container)
    }
  }

  // 根据vnode删除节点
  const unmount = vnode => {
    // 后续需要加上，如果是组件，要调一下组件的声明周期 卸载时
    hostRemove(vnode.el)
  }
  // 删除子节点，数组
  const unmountChildren = children => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i])
    }
  }
  // 判断两个vnode是否可复用
  const isSameVNodeType = (n1, n2) => {
    return n1.type === n2.type && n1.key === n2.key
  }

  /**
   *
   * @param n1 旧的vnode
   * @param n2 新的vnode
   * @param container 容器
   * @param anchor 参照dom，如果有值，说明是要插入到这个之前，如果为null，就是appendChild
   */
  const patch = (n1, n2, container, anchor = null) => {
    const { shapeFlag, type } = n2

    // n1有值说明是更新操作，判断是否可以复用，不可复用就删除老的，创建新的
    if (n1 && !isSameVNodeType(n1, n2)) {
      // 删除老的，并找到它下一个兄弟节点，用于判断是插入到某个元素之前还是插入到最后面
      anchor = hostNextSibling(n1.el)
      unmount(n1)
      n1 = null // 删除n1对应的dom后，把n1设置为null，后面的流程没有n1，就跟初次渲染一样的流程，重新渲染n2对应的内容
    }

    // 判断当前最新vnode的类型，做不同的初始化操作
    switch (type) {
      case Text:
        processText(n1, n2, container)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          //console.log('普通元素')
          processElement(n1, n2, container, anchor)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          //console.log('组件')
          processComponent(n1, n2, container)
        }
        break
    }
  }

  const render = (vnode, container) => {
    // runtime-core的核心
    // 默认调用patch，是初始化的流程
    patch(null, vnode, container)
  }
  return {
    createApp: createAppAPI(render)
  }
}
