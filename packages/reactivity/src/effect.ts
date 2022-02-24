import { isArray, isIntegerKey, isSymbol } from '@vue/shared'
import { TriggerOperatorTypes } from './operators'

/**
 * 响应式变化重新执行
 * @param fn 回调：fn里的响应式属性发生变化，会重新执行effect
 * @param options
 * @returns
 */
export function effect(fn, options: any = {}) {
  const effectFn = createReactiveEffect(fn, options)

  // effect传进来的fn默认会执行一次，也可以配置默认不执行(计算属性默认不执行)
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
export function track(target, operatorType, key, value?) {
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
  // console.log(targetMap)
}

/**
 * 触发了setter，需要把这个属性收集的effect全部执行
 * @param target
 * @param type SET
 * @param key 根据当前属性去找到收集的effect并全部执行
 * @param value
 * @param oldValue
 */
export function trigger(target, type, key?, newValue?, oldValue?) {
  // 1. 如果这个属性没有收集effect，那就不处理 (判断当前target是否有缓存过)
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    return
  }

  // Map.prototype.forEach()：遍历 Map 的所有成员
  // 如果是数组：{'valueOf' => Set(1), 'toString' => Set(1), 'join' => Set(1), 'length' => Set(1), "0" => Set(1), "1" => Set(1)}
  // console.log(depsMap)

  let effects = new Set() // 当前属性收集的effect，并且去重
  const add = effectsToAdd => {
    if (effectsToAdd) {
      effectsToAdd.forEach(effect => effects.add(effect))
    }
  }

  // 2. 看是否是直接修改数组的长度length(如：arr.length = 100)，因为这样影响较大，也要触发更新
  if (key === 'length' && isArray(target)) {
    depsMap.forEach((dep, key) => {
      if (key === 'length' || (!isSymbol(key) && parseInt(key) > newValue)) {
        // key > newValue 如果修改的长度小于收集的索引，那么这索引也要触发effect重新执行
        add(dep)
      }
    })
  } else {
    // 3. 可能是对象
    if (key !== undefined) {
      // 这里一定是修改对象的某个属性
      add(depsMap.get(key)) // depsMap.get(key) 取出这个key的effect
    }
    // 还有可能是修改数组某个索引(如：arr[5] = '5')
    switch (type) {
      case TriggerOperatorTypes.ADD: // 判断如果是添加一个索引，就触发length的effect
        if (isArray(target) && isIntegerKey(key)) {
          add(depsMap.get('length'))
        }
    }
  }

  // 4. 把这个可以所有的依赖effect全部执行
  effects.forEach((effect: any) => {
    // 这里是计算属性的逻辑
    // 表示计算属性里依赖的属性发生了变化，需要改状态，下次取值需要计算最新值
    if (effect.options.scheduler) {
      effect.options.scheduler(effect)
    } else {
      effect()
    }
  })
}
