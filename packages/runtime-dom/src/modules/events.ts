export function patchEvents(el, key, fn) {
  // 对函数缓存 el._vei = { onClick: fn }
  const invokers = el._vei || (el._vei = {})
  const exists = invokers[key] // el._vei[key] --> el._vei['onClick']

  if (fn && exists) {
    // 新的事件有值，并且之前已经缓存过
    // 这里的exists = createInvoker返回的invoker函数，invoker扩展了一个fn属性，
    // 把新的fn替换掉invoker上的fn，那么在调用的时候，会取到invoker上的fn并执行，那么就是最新
    exists.fn = fn
  } else {
    const eventName = key.slice(2).toLowerCase() // click
    if (fn) {
      // 第一次绑定事件，没有缓存
      let invoker = (invokers[key] = createInvoker(fn)) // invoker = el._vei['onClick'] = fn
      el.addEventListener(eventName, invoker) // 这里的invoker = createInvoker返回的方法
    } else {
      el.removeEventListener(eventName, exists)
      invokers[key] = undefined //  el._vei[key] = undefined 移除事件后清理掉之前的缓存
    }
  }
}

// 把之前事件的回调再包一层
function createInvoker(fn) {
  const invoker = e => {
    invoker.fn(e)
  }
  invoker.fn = fn
  return invoker
}
