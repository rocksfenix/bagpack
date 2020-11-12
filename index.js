const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const babel = require('@babel/core')
const resolve = require('resolve').sync

let ID = 0

function createModuleInfo (filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const ast = parser.parse(content, {
    sourceType: 'module'
  })

  const deps = []
  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      deps.push(node.source.value)
    }
  })

  const id = ID++
  const { code } = babel.transformFromAstSync(ast, null, {
    presets: ['@babel/preset-env']
  })

  return {
    id,
    filePath,
    deps,
    code
  }
}

function createDependencyGraph (entry) {
  const entryInfo = createModuleInfo(entry)
  const graphArr = []
  graphArr.push(entryInfo)

  for (const module of graphArr) {
    module.map = {}
    module.deps.forEach(depPath => {
      const baseDir = path.dirname(module.filePath)
      console.log('BaseDIr', baseDir)
      const moduleDepPath = resolve(path.resolve(__dirname, 'example-to-bundle', depPath), { baseDir })
      const moduleInfo = createModuleInfo(moduleDepPath)
      graphArr.push(moduleInfo)
      module.map[depPath] = moduleInfo.id
    })
  }
  return graphArr
}

function bundle (graph) {
  const moduleArgArr = graph.map(module => {
    return `${module.id}: {
      factory: (exports, require) => {
        ${module.code}
      },
      map: ${JSON.stringify(module.map)}
    }`
  })

  const iifeBundler = `(function(modules){
    const require = id => {
      const {factory, map} = modules[id]
      const localRequire = requireDeclarationName => require(map[requireDeclarationName])
      const module = {exports: {}}
      factory(module.exports, localRequire)
      return module.exports
    }
    require(0)
  })({${moduleArgArr.join()}})
  `
  return iifeBundler
}

const entry = path.resolve(__dirname, 'example-to-bundle', 'app.js')
const output = path.resolve(__dirname, 'bundle.js')

fs.writeFileSync(output, bundle(createDependencyGraph(entry)))
