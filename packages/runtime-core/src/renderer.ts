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
    patchProps: hostPatchProps,
    createText: hostCreateText,
    createElement: hostCreateElement,
    setElementText: hostSetElementText,
    setText: hostSetText,
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
        }
      },
      {
        scheduler: queueJob // effect => {}
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
  const processElement = (n1, n2, container) => {
    if (!n1) {
      // 元素初始化
      mountElement(n2, container)
    } else {
      // 元素更新
    }
  }

  const mountChildren = (parentEl, children) => {
    for (let i = 0; i < children.length; i++) {
      const child = normalizeVNode(children[i])
      patch(null, child, parentEl)
    }
  }

  const mountElement = (vnode, container) => {
    const { props, type, shapeFlag, children } = vnode
    // 根据vnode创建元素，并赋值到vnode的el属性上
    const el = (vnode.el = hostCreateElement(type))
    // 给元素设置属性
    if (props) {
      for (let key in props) {
        hostPatchProps(el, key, null, props[key])
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
    hostInsert(el, container)
  }

  // 处理文本节点
  const processText = (n1, n2, container) => {
    if (!n1) {
      hostInsert((n2.el = hostCreateText(n2.children)), container)
    }
  }

  /**
   *
   * @param n1 旧的vnode
   * @param n2 新的vnode
   * @param container 容器
   */
  const patch = (n1, n2, container) => {
    const { shapeFlag, type } = n2
    // 判断当前最新vnode的类型，做不同的初始化操作
    switch (type) {
      case Text:
        processText(n1, n2, container)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          //console.log('普通元素')
          processElement(n1, n2, container)
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
