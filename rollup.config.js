import path from 'path'
import ts from 'rollup-plugin-typescript2'
import json from '@rollup/plugin-json'
import resolvePlugin from '@rollup/plugin-node-resolve'

// 找到packages目录
const packagesDir = path.resolve(__dirname, 'packages')

// process.env.TARGET 就是传过来的目录名称，由此找到需要打包的目录
const packageDir = path.resolve(packagesDir, process.env.TARGET)

const resolve = (pathName) => path.resolve(packageDir, pathName)

const pkg = require(resolve('package.json')) // 找到每个模块的package.json
const name = path.basename(packageDir) // 获取到打包的模块名称
const options = pkg.buildOptions // 每个模块自定义的options
const outputConfig = {
  'esm-bundler': {
    file: resolve(`dist/${name}.esm-bundler.js`),
    format: 'es'
  },
  'cjs': {
    file: resolve(`dist/${name}.cjs.js`),
    format: 'cjs'
  },
  'global': {
    file: resolve(`dist/${name}.global.js`),
    format: 'iife'
  }
}

function createConfig(format, output) {
  output.name = options.name // 当format为iife和umd时必须提供，将作为全局变量挂在window(浏览器环境)下
  output.sourcemap = true  // 生成bundle.map.js文件

  return {
    input: resolve('src/index.ts'),
    output,
    plugins: [
      json(),
      ts({
        tsconfig: path.resolve(__dirname, 'tsconfig.json')
      }),
      resolvePlugin() // 插件允许加载第三方模块
    ]
  }
}

export default options.formats.map(format => createConfig(format, outputConfig[format]))