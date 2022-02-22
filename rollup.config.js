import path from 'path'

// 找到packages目录
const packagesDir = path.resolve(__dirname, 'packages')

// process.env.TARGET 就是传过来的目录名称，由此找到需要打包的目录
const packageDir = path.resolve(packagesDir, process.env.TARGET)

const resolve = (pathName) => path.resolve(packageDir, pathName)