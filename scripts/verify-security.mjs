import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const errors = []
const files = (directory) => fs.readdirSync(directory, { withFileTypes: true })
  .flatMap((entry) => entry.isDirectory()
    ? files(path.join(directory, entry.name))
    : [path.join(directory, entry.name)])

for (const directory of ['src', 'dist']) {
  const directoryPath = path.join(root, directory)
  if (!fs.existsSync(directoryPath)) {
    errors.push(`Missing ${directory}; run npm run build first.`)
    continue
  }
  for (const file of files(directoryPath)) {
    if (!/\.(js|jsx|html|css|scss)$/.test(file)) continue
    const content = fs.readFileSync(file, 'utf8')
    if (/from\s*['"]firebase|firebaseapp\.com|firebaseio\.com|googleapis\.com|cloudfunctions\.net|api\.openai\.com|AIza[0-9A-Za-z_-]{30,}|-----BEGIN (?:RSA )?PRIVATE KEY-----/.test(content)) {
      errors.push(`Live integration or secret pattern: ${path.relative(root, file)}`)
    }
    if (directory === 'src' && /https?:\/\//.test(content)) {
      errors.push(`External URL in runtime source: ${path.relative(root, file)}`)
    }
  }
}

const packageLock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'))
if (Object.keys(packageLock.packages).some((name) => /node_modules\/(?:@firebase\/|firebase(?:\/|$)|openai(?:\/|$))/.test(name))) {
  errors.push('Firebase or OpenAI package remains in lockfile.')
}
for (const name of ['functions', 'src/firebase', '.firebaserc', 'firebase.json', 'firestore.rules', 'firestore.indexes.json']) {
  if (fs.existsSync(path.join(root, name))) errors.push(`Unused integration remains: ${name}`)
}
if (fs.readdirSync(root).some((name) => name.startsWith('.env'))) {
  errors.push('This local-only demo does not need environment files.')
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exitCode = 1
} else {
  console.log('PASS: no Firebase SDK, configuration, functions, environment files, live endpoints or secret patterns in runtime source/build.')
}
