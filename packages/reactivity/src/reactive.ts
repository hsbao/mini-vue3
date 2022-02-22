import { isObject } from '@vue/shared'
import {
  mutadleHandlers,
  shallowReactiveHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers
} from './baseHandlers'

export function reactive(target) {
  return createReactiveObject(target, false, mutadleHandlers)
}

export function shallowReactive(target) {
  return createReactiveObject(target, false, shallowReactiveHandlers)
}

export function readonly(target) {
  return createReactiveObject(target, true, readonlyHandlers)
}

export function shallowReadonly(target) {
  return createReactiveObject(target, true, shallowReadonlyHandlers)
}

const reactiveMap = new WeakMap() // 存储reactive代理的对象
const readonlyMap = new WeakMap() // 存储readonly代码的对象
export function createReactiveObject(target, isReadonly, baseHandler) {
  // 只能拦截对象类型
  if (!isObject(target)) {
    return target
  }

  // 某个对象可能被代理过了，就不用重复代理
  const proxyMap = isReadonly ? reactiveMap : reactiveMap
  const existProxy = proxyMap.get(target)
  // 如果存在，直接返回之前的代理结果
  if (existProxy) {
    return existProxy
  }
  const proxy = new Proxy(target, baseHandler)
  proxyMap.set(target, proxy) // 缓存起来，避免重复代理

  return proxy
}
