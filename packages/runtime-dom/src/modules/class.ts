/**
 * 修改类名的，直接把最新的类名复制给className就可以了
 * @param el 修改的元素
 * @param value 新的class name
 */
export function patchClass(el, value = '') {
  el.className = value
}
