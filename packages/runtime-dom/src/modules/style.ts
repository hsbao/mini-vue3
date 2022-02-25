/**
 * 修改元素的样式
 * @param el 修改的元素
 * @param prev 一个对象，旧的样式的属性 { style: { color: 'red' } }
 * @param next 一个对象，新的样式的属性 { style: { backGround: 'blue' } }
 */
export function patchStyle(el, prev, next) {
  const style = el.style
  // 1. 如果最新的样式属性没有，则直接删除样式
  if (!next) {
    el.removeAttribute('style')
  } else {
    // 2. 如果旧的有，新的没有，则需要删除对应的样式
    if (prev) {
      for (let key in prev) {
        if (!next[key]) {
          style[key] = ''
        }
      }
    }
    // 3. 如果新的有值，需要更新到元素上
    for (let key in next) {
      style[key] = next[key]
    }
  }
}
