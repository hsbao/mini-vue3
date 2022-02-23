import { isObject } from '@vue/shared'
import { hasChanged, isArray } from './../../shared/src/index'
import { track, trigger } from './effect'
import { TrackOperatorTypes, TriggerOperatorTypes } from './operators'
import { reactive } from './reactive'

/**
 * 转成es5，就是Object.defineProperty
 * 获取value的时候触发get
 * 设置value的时候触发set
 */
const convert = val => (isObject(val) ? reactive(val) : val)
class RefImpl {
  public _value
  public __v_isRef: true
  constructor(public rawValue, public shallow) {
    // 如果是对象，那么就使用reactive变成响应式的
    this._value = shallow ? rawValue : convert(rawValue)
  }
  get value() {
    track(this, TrackOperatorTypes.GET, 'value')
    return this._value
  }
  set value(newValue: any) {
    if (hasChanged(this.rawValue, newValue)) {
      this.rawValue = newValue
      trigger(this, TriggerOperatorTypes.SET, 'value', newValue)
      this._value = newValue
    }
  }
}

function createRef(value, shallow = false) {
  return new RefImpl(value, shallow)
}

/**
 * 将一个普通类型变成一个响应式对象
 * 如果是普通类型，使用Object.defineProperty
 * 如果是对象，直接使用reactive()转成响应式
 * @param value 目标值，可以是普通类型数据，也可以是对象
 */
export function ref(value) {
  return createRef(value)
}

export function shallowRef(value) {
  return createRef(value, true)
}

// 因为通常是把proxy中的某个属性转成ref，本身就已经有了getter和setter
// 已经具备了收集依赖和触发更新的逻辑了，这里就不用加上了
class ObjectRefImpl {
  public __v_isRef = true
  constructor(public target, public key) {}
  get value() {
    return this.target[this.key]
  }
  set value(newValue) {
    this.target[this.key] = newValue
  }
}

/**
 * 把对象里某个属性转成ref，一般是proxy对象上的某个属性
 * @param target 传进来的proxy对象
 * @param key
 */
export function toRef(target, key) {
  return new ObjectRefImpl(target, key)
}

/**
 * 把proxy对象/数组里所有属性转成ref
 * @param target
 */
export function toRefs(target) {
  const res = isArray(target) ? new Array(target.length) : {}
  for (let key in target) {
    res[key] = toRef(target, key)
  }
  return res
}
