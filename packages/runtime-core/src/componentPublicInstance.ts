import { hasOwn } from '@vue/shared'

export const PublicInstanceProxyHandles = {
  get({ _: instance }, key) {
    // 这样在rende的proxy取值时，可以通过proxy.xx的方式取到setupState, props, data上的值
    const { setupState, props, data } = instance
    if (hasOwn(setupState, key)) {
      return setupState[key]
    } else if (hasOwn(props, key)) {
      return props[key]
    } else if (hasOwn(data, key)) {
      return data[key]
    } else {
      return undefined
    }
  },
  set({ _: instance }, key, value) {
    const { setupState, props, data } = instance
    if (hasOwn(setupState, key)) {
      setupState[key] = value
    } else if (hasOwn(props, key)) {
      props[key] = value
    } else if (hasOwn(data, key)) {
      data[key] = value
    }
    return true
  }
}
