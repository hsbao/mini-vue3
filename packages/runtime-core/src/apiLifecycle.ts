import { currentInstance, setCurrentInstance } from './component'
export const enum LifecycleHooks {
  BEFORE_CREATE = 'bc',
  CREATED = 'c',
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u',
  BEFORE_UNMOUNT = 'bum',
  UNMOUNTED = 'um',
  DEACTIVATED = 'da',
  ACTIVATED = 'a',
  RENDER_TRIGGERED = 'rtg',
  RENDER_TRACKED = 'rtc',
  ERROR_CAPTURED = 'ec',
  SERVER_PREFETCH = 'sp'
}

const createHook = lifecycle => {
  /**
   * @param hook 用户使用生命周期的时候传的回调
   * @param target 当前的实例
   */
  return function (hook, target = currentInstance) {
    injectHook(lifecycle, hook, target)
  }
}

/**
 * 把生命周期函数绑定到对应的实例上
 * @param type 生命周期的类型，如 onBeforeMount，onMounted
 * @param hook 生命周期的回调
 * @param target 当前的实例
 */
function injectHook(type, hook, target) {
  // 生命周期只能在setup里使用，这样才能绑定到当前组件的实例上
  if (!target) {
    return console.log(
      'injection APIs can only be used during execution of setup()'
    )
  }
  const hooks = target[type] || (target[type] = []) // target.bm = []
  const wrap = () => {
    // 确保生命周期函数被调用的时候，currentInstance都指向正确的组件实例
    // 因为target是闭包，已经存下当前的组件实例
    setCurrentInstance(target)
    hook.call(target)
    setCurrentInstance(null)
  }
  hooks.push(wrap)
}

export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)
export const onMounted = createHook(LifecycleHooks.MOUNTED)
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE)
export const onUpdated = createHook(LifecycleHooks.UPDATED)
export const onBeforeUnmount = createHook(LifecycleHooks.BEFORE_UNMOUNT)
export const onUnmounted = createHook(LifecycleHooks.UNMOUNTED)
export const onServerPrefetch = createHook(LifecycleHooks.SERVER_PREFETCH)

export function invokeArrayFns(fns) {
  fns.forEach(fn => fn())
}
