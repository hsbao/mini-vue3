let queue = []
export function queueJob(effect) {
  if (!queue.includes(effect)) {
    queue.push(effect)
    queueFlush()
  }
}

let isFlushPending = false
function queueFlush() {
  if (!isFlushPending) {
    isFlushPending = true
    Promise.resolve().then(flushJobs)
  }
}

function flushJobs() {
  isFlushPending = false
  // 需要根据调用顺序依次刷新，保证先刷新父组件再刷新子组件，所以先排序
  queue.sort((a, b) => a.id - b.id)

  for (let i = 0; i < queue.length; i++) {
    const effect = queue[i]
    effect()
  }

  queue = []
}
