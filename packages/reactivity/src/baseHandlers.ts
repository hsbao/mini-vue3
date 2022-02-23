import { extend, isObject, isArray, isIntegerKey, hasOwn, hasChanged } from '@vue/shared'
import { readonly, reactive } from './reactive'
import { track, trigger } from './effect'
import { TrackOperatorTypes, TriggerOperatorTypes } from './operators'

/**
 * 数据劫持getter，拦截获取功能
 * @param readonly 是否只读，只读set的时候会抛出异常
 * @param shallow 是否深度劫持
 */
function createGetter(isReadonly = false, shallow = false) {
  /**
   * target: 原始的对象
   * key: 属性
   * receiver：Proxy代理后的对象 --> new Proxy(target)
   */
  return function get(target, key, receiver) {
    // proxy 一般和 Reflect 一起使用。proxy上的方法，Reflect都有
    // 后续 Object 上的方法会迁移到 Reflect
    const res = Reflect.get(target, key, receiver) // 类似 target[key]

    // 不是只读的情况下才收集依赖
    if (!isReadonly) {
      // 执行effect传进去的fn，就会取值，这里需要收集key对应的effect
      track(target, TrackOperatorTypes.GET, key)
    }

    // shallow只会对对象第一层做响应式，更深层级的直接返回就好了
    if (shallow) {
      return res
    }

    // 如果是对象，继续做响应式数据劫持
    // 这里就和vue2有很大区别了，vue2是初始化的时候递归。vue3则是取值的时候才会做响应式，性能更好（懒代理）
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res)
    }

    return res
  }
}

/**
 * 数据劫持setter，拦截设置功能
 * @param shallow 是否是深度劫持
 */
function createSetter(shallow = false) {
  /**
   * target: 原始的对象
   * key: 属性 / 数组的下标 / 数组的length属性(arr.length = 100 这样就是修改数组的length)
   * value: 要给属性设置新的值
   * receiver：Proxy代理后的对象 --> new Proxy(target)
   */
  return function set(target, key, value, receiver) {
    const oldValue = target[key] // 记录下老的值

    // 对象 --> 是否已经存在这个key --> 已经存在则是修改，不存在为新增
    // 数组 --> 当前修改的下标是否在length内 --> 如果是则是修改，改的下标超出了之前的length则是新增
    const hasKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key) 

    // 类似 target[key] = value，但是这样有可能设置失败，并且如果失败了也没有任何提示
    // Reflect.set 设置的时候，如果失败，会返回false，更加方便
    const result = Reflect.set(target, key, value, receiver)
    if (!hasKey) {
      // 新增，则为这个key继续收集依赖，effect
      track(target, TriggerOperatorTypes.ADD, key, value)
    } else if (hasChanged(oldValue, value)) {
      // 修改，则需要去触发之前为这个key收集的effect
      trigger(target, TriggerOperatorTypes.SET, key, value, oldValue)
    }

    return result
  }
}

const get = createGetter()
const shallowGet = createGetter(false, true)
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)

const set = createSetter()
const shallowSet = createSetter(true)

const readonlyObject = {
  set: (target, key) => {
    console.warn(`set on key ${key} falied`)
  }
}

export const mutadleHandlers = {
  get,
  set
}
export const shallowReactiveHandlers = {
  get: shallowGet,
  set: shallowSet
}
export const readonlyHandlers = extend(
  {
    get: readonlyGet
  },
  readonlyObject
)

export const shallowReadonlyHandlers = extend(
  {
    get: shallowReadonlyGet
  },
  readonlyObject
)
