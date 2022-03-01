// 这里是对组件渲染和更新的操作

import { isFunction, isObject, ShapeFlags } from '@vue/shared'
import { PublicInstanceProxyHandles } from './componentPublicInstance'

export function createComponentInstance(vnode) {
  const instance = {
    vnode,
    type: vnode.type,
    ctx: {},

    /**
     *  <m-component a="1" b="2" c="3">  在组件内部的props只声明了a
     *  {
     *    props: {
     *      a: [String]
     *    }
     *  }
     *
     *  那么剩下的b和c都在attrs里，跟vue2的$attrs一样
     */
    props: {},
    attrs: {},
    slots: {},
    setupState: { a: 1 }, // 如果setup返回的是一个对象，那么这个对象就作为setupState
    render: null, // 如果setup返回的是一个函数，那么这个函数就作为render
    isMounted: false // 表示当前组件是否有挂载过
  }
  instance.ctx = { _: instance } // instance.ctx._ ---> instance
  return instance
}

export function setupComponent(instance) {
  const { props, children } = instance.vnode

  instance.props = props // initProps() 解析出props和attrs
  instance.children = children // initSlots() 组件的children是插槽

  const isStateful = instance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT

  // 表示这是一个带状态的组件
  if (isStateful) {
    // 调用当前实例的setup方法，把返回值填充对应的setupState或是render方法
    setupStatefulComponent(instance)
  }
}

function setupStatefulComponent(instance) {
  // 1. 代理：就是要传给render函数的参数
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandles)
  // 2. 获取属性类型，拿到setup方法
  const Component = instance.type // 如果是一个对象，说明是组件，如果是一个字符串，那就是普通元素
  const { setup, render } = Component
  if (setup) {
    const setupContext = createSetupContext(instance)
    const setupResult = setup(instance.props, setupContext) // setup接收两个参数
    handleSetupResult(instance, setupResult)
  } else {
    finishComponent(instance)
  }
}

function handleSetupResult(instance, setupResult) {
  if (isFunction(setupResult)) {
    instance.render = setupResult
  } else if (isObject(setupResult)) {
    instance.setupState = setupResult
  }
  finishComponent(instance)
}

function finishComponent(instance) {
  const Component = instance.type
  if (!instance.render) {
    // 如果都没有render，那就要对template进行编译，拿到render函数
    if (!Component.render && Component.template) {
      Component.render = '' // 编辑template，目前还没实现
    }
    instance.render = Component.render
  }
}

function createSetupContext(instance) {
  return {
    attrs: instance.attrs,
    props: instance.props,
    emit: () => {},
    expose: () => {},
    slots: instance.slots
  }
}
