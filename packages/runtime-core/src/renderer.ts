import { createAppAPI } from './apiCreateApp'

export function createRenderer(rendererOPtions) {
  const render = (vnode, container) => {
    console.log(vnode, container)
  }
  return {
    createApp: createAppAPI(render)
  }
}
