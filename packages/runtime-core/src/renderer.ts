import { ShapeFlags } from '@vue/shared'
import { createAppAPI } from './apiCreateApp'
import { createComponentInstance, setupComponent } from './component'

export function createRenderer(rendererOPtions) {
  const setupRendererEffect = () => {}

  const mountComponent = (initialVnode, container) => {
    // 组件的渲染流程：核心就是调用setup，拿到返回值
    // 然后再调用render返回的结果进行渲染 render --> vnode
    // 1. 先有实例
    const instance = (initialVnode.component =
      createComponentInstance(initialVnode))
    // 2. 需要的数据解析到实例上 因为render方法接收一个proxy
    setupComponent(instance)
    // 3. 创建一个effect，让render函数执行。这样数据更新的时候，render会再次被调用
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

  /**
   *
   * @param n1 旧的vnode
   * @param n2 新的vnode
   * @param container 容器
   */
  const patch = (n1, n2, container) => {
    const { shapeFlag } = n2
    // 判断当前最新vnode的类型，做不同的初始化操作
    if (shapeFlag & ShapeFlags.ELEMENT) {
      console.log('普通元素')
    } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      console.log('组件')
      processComponent(n1, n2, container)
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
