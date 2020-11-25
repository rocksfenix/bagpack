const babel = require('@babel/core')
const traverse = require('@babel/traverse').default
const parser = require('@babel/parser')
const fs = require('fs')

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

module.exports = createModuleInfo
