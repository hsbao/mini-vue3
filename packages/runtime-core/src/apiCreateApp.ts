import { createVNode } from './vnode'

export function createAppAPI(render) {
  return function createApp(rootComponent, rootProps) {
    const app: any = {
      _props: rootProps,
      _component: rootComponent,
      _container: null,
      mount(container) {
        // 1. 根据组件创建vnode
        const vnode = createVNode(rootComponent, rootProps)
        // 2. 获取到vnode后调用render方法进行渲染
        render(vnode, container)
        app._container = container
      }
    }
    return app
  }
}
