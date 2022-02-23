export const isObject = value => typeof value === 'object' && value !== null
export const extend = Object.assign
export const isArray = Array.isArray
export const isFunction = value => typeof value === 'function'
export const isNumber = value => typeof value === 'number'
export const isString = value => typeof value === 'string'
export const isIntegerKey = key => parseInt(key) + '' === key // 判断一个对象的key是不是整形
export const isSymbol = value => typeof value === 'symbol'

// 判断对象上是否有这个key
const hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (target, key) => hasOwnProperty.call(target, key)

export const hasChanged = (oldValue, value) => oldValue !== value