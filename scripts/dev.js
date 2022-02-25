// 只针对具体某一个模块进行构建打包
const fs = require('fs')
const execa = require('execa')

// 需要打包的模块名称
const target = 'runtime-dom'

async function build(target) {
  // 开启子进程，然后使用rollup进行构建打包
  await execa(
    'rollup',
    ['-cw', '--environment', `TARGET:${target}`], // rollup - c --environment TARGET:reactivity
    {
      stdout: 'inherit' // 子进程打包的信息共享给父进程
    }
  )
}

build(target)
