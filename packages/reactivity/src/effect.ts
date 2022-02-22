/**
 * 响应式变化重新执行
 * @param fn 回调：fn里的响应式属性发生变化，会重新执行effect
 * @param options
 * @returns
 */
export function effect(fn, options: any = {}) {
  const effectFn = createReactiveEffect(fn, options)

  // effect传进来的fn默认会执行一次，也可以配置默认不执行
  if (!options.lazy) {
    effectFn()
  }

  return effectFn
}

let uid = 0
let activeEffect // 存储当前的effect
let effectStack = [] // 类似vue2 computed收集依赖的逻辑Dep.target
function createReactiveEffect(fn, options) {
  const effect = function reactiveEffect() {
    /**
     * effect(() => {
     *   state.name     effect1
     *   effect(() => {
     *      state.age   effect2
     *   })
     *   state.other    effect1
     * })
     * 取name的时候，应该收集effect1，所以先把effect1添加到effectStack ---> [effect1]
     * 取age的使用，是另外的effect2了，所以应该收集effect2，也添加到effectStack ---> [effect1, effect2]
     * effect2传进去的fn执行完，应该把 effect2从effectStack 中删除
     * 这样再继续给other取值的时候，才能给other收集到正常的effect1
     */
    if (!effectStack.includes(effect)) {
      // 避免重复添加effect
      try {
        effectStack.push(effect)
        activeEffect = effect
        return fn() // fn执行，里面用到了响应式数据，就会走响应式属性对应的getter
      } finally {
        effectStack.pop()
        activeEffect = effectStack[effectStack.length - 1]
      }
    }
  }

  effect.id = uid++ // 用于标识不同的effect
  effect._isEffect = true // 用于标识这是一个响应式的effect
  effect.raw = fn // 保存下传进来的fn
  effect.options = options // 保存用户传进来的options

  return effect
}

/**
 * 让对象中某个属性收集它对应的effect
 * 比如说 { name: 'hhh' } 会变成 WeakMap的格式
 * {
 *  {name: 'hhh'}: { name: [ effect ] }
 * }
 * @param target 目标对象
 * @param operatorType 取值GET/设置值SET
 * @param key 目标对象中的某个属性
 */
const targetMap = new WeakMap()
export function track(target, operatorType, key) {
  // 如果当前没有effect，说明这个key没在effect中被使用，不用收集effect
  if (!activeEffect) {
    return
  }
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    // 第一次取值的时候，默认给一个map空对象
    depsMap = new Map()
    targetMap.set(target, depsMap) // { target: {} }
  }
  let dep = depsMap.get(key)
  if (!dep) {
    dep = new Set() // []
    depsMap.set(key, dep) // { target: { name: [] } }
  }
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect) // { target: { name: [ activeEffect, ... ] } }
  }
  console.log(targetMap)
}
