export function createAppAPI(render) {
  return function createApp(rootComponent, rootProps) {
    const app: any = {
      mount(container) {
        let vnode = {}
        render(vnode, container)
        // 1. 根据组件创建vnode
        // 2. 获取到vnode后调用render方法进行渲染
      }
    }
    return app
  }
}
