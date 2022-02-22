// 对packages目录下所有模块进行构建

const fs = require('fs')
const execa = require('execa')

/**
 * 找到packages目录下所有模块
 */
const targets = fs.readdirSync('packages').filter(file => {
  // 判断是否是文件夹
  if (!fs.statSync(`packages/${file}`).isDirectory()) {
    return false
  }
  return true
})

async function build(target) {
  // 因为有很多模块，开启子进程，然后使用rollup进行构建打包
  await execa(
    'rollup',
    ['-c', '--environment', `TARGET:${target}`],
    {
      stdout: 'inherit' // 子进程打包的信息共享给父进程
    }
  )
}

function runParallel(targets, iteratorFn) {
  const res = []
  for (let target of targets) {
    const promise = iteratorFn(target)
    res.push(promise)
  }
  return Promise.all(res)
}

runParallel(targets, build)