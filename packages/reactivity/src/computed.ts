import { isFunction } from '@vue/shared'
import { effect, track, trigger } from './effect'
import { TrackOperatorTypes, TriggerOperatorTypes } from './operators'

class ComputedRefImpl {
  private _dirty = true // true 表示取值时重新计算，不要用缓存。false则是使用上一次的计算结果（缓存）
  public _value
  public effect
  constructor(getter, public setter) {
    // 计算属性默认会产生一个effect
    this.effect = effect(getter, {
      lazy: true,
      scheduler: effect => {
        // 这里表示计算属性依赖的属性发生了变化，需置为false，计算属性下次取值的时候重新计算最新值
        // 这里改为false后，下次取值，就再走get value的逻辑
        if (!this._dirty) {
          this._dirty = true
          trigger(this, TriggerOperatorTypes.SET, 'value') // 把计算属性收集的依赖也执行
        }
      }
    })
  }

  // vue3的计算属性是要收集依赖的，vue3的计算属性本身就是一个effect
  // vue2的计算属性是不收集依赖的，只有它里面依赖的属性才会收集计算属性watcher和渲染watcher
  get value() {
    // 在计算属性取值的时候，判断是否要重新计算最新值
    if (this._dirty) {
      /**
       * 这里的effect执行
       * 1. 把传进去的getter执行
       * 2. getter执行的时候，会根据它里面依赖的属性取值，响应式属性取值的时候会触发属性的get
       * 3. 触发了属性的get，当前属性会把这个effect收集起来
       * 4. 下次这个属性发生变化后，会执行所收集的effect（这里的话就是computed的getter）,这样就能计算到最新值
       */
      this._value = this.effect()
      this._dirty = false // 置为false，依赖的属性没发生变化，就不重新计算
    }

    // 和vue2有区别的地方，vue3的computed在取值的时候，要收集依赖（可能是在effect中使用了计算属性）
    /**
     * effect(() => {
     *   console.log(computed.value)
     * })
     *
     * 这样的话，计算属性取值的时候，就会把这个effect收集起来
     */
    track(this, TrackOperatorTypes.GET, 'value')

    return this._value
  }

  set value(newValue) {
    this.setter(newValue) // 直接把值传给自定义的setter
  }
}

/**
 * vue2和vue3实现computed的原理并不一样
 * @param getterOrOptions 可能是一个fn，也可能是{get(){}, set() {}}
 */
export function computed(getterOrOptions) {
  let getter
  let setter
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions
    setter = () => {
      console.warn('这个计算属性的值是只读的')
    }
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  return new ComputedRefImpl(getter, setter)
}
