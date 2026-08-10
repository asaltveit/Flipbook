const fs = require('fs')
const { execSync } = require('child_process')

const viteBin = 'node_modules/.bin/vite'

if (!fs.existsSync(viteBin)) {
  console.log('vite binary link missing — running npm rebuild vite...')
  execSync('npm rebuild vite', { stdio: 'inherit' })
}

if (!fs.existsSync(viteBin)) {
  console.error(
    'vite is not available. Run: npm install --legacy-peer-deps'
  )
  process.exit(1)
}
