/**
 * 转成es5，就是Object.defineProperty
 * 获取value的时候触发get
 * 设置value的时候触发set
 */
class RefImpl {
  public _value
  public __v_isRef: true
  constructor(public rawValue, public shallow) {
    this._value = rawValue
  }
  get value() {
    return this._value
  }
  set value(newValue: any) {

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

/**
 * 把对象里某个属性转成ref，一般是proxy对象上的某个属性
 * @param target 传进来的proxy对象
 * @param key 
 */
export function toRef(target, key) {

}

/**
 * 把proxy对象里所有属性转成ref
 * @param target
 */
export function toRefs(target) {}