// 对属性的操作

import { patchAttr } from './modules/attr'
import { patchClass } from './modules/class'
import { patchEvents } from './modules/events'
import { patchStyle } from './modules/style'

export function patchProps(el, key, prevValue, nextValue) {
  switch (key) {
    case 'class':
      patchClass(el, nextValue)
      break
    case 'style':
      patchStyle(el, prevValue, nextValue)
      break
    default:
      // 如果不是事件，才是属性
      if (/^on[^a-z]/.test(key)) {
        patchEvents(el, key, nextValue)
      } else {
        patchAttr(el, key, nextValue)
      }
      break
  }
}
