/**
 * runtime-dom是为了解决平台差异（浏览器的），核心就是提供了DOM API的方法
 * 操作节点、属性的更新
 */

import { extend } from '@vue/shared'
import { createRenderer } from '@vue/runtime-core'
import { nodeOps } from './nodeOps'
import { patchProps } from './patchProps'

// 渲染的时候用到的所有方法
const rendererOPtions = extend({ patchProps }, nodeOps)

// vue3中的runtime-core提供了核心方法，用来处理渲染的
export function createApp(rootComponent, rootProps) {
  const app: any = createRenderer(rendererOPtions).createApp(
    rootComponent,
    rootProps
  )
  const { mount } = app
  app.mount = function (container) {
    // 1. 先清空容器旧的内容
    container = nodeOps.querySelector(container)
    container.innerHTML = ''

    // 2. 将组件渲染成dom，并挂载到页面上
    mount(container)
  }
  return app
}

export * from '@vue/runtime-core'
