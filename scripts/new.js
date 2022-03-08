const { readdirSync } = require('fs')
const { src, dest } = require('gulp')
const replace = require('gulp-replace')
const rename = require('gulp-rename')
const dayjs = require('dayjs')

const date = dayjs().format('YYYY-MM-DD')
function checkIsExists() {
  const fileNames = readdirSync('blog/')
  return fileNames.some(name => name.includes(kebabName))
}

const [blogName] = process.argv.slice(2)

const kebabName = blogName.replace(/[A-Z]/g, (letter, index) => {
  return `${index !== 0 ? '-' : ''}${letter.toLowerCase()}`
})

if (checkIsExists()) {
  console.log(`${kebabName} 已经存在`)
  return
}

src('templates/**')
  .pipe(replace('$blog$', kebabName))
  .pipe(
    rename(path => {
      path.basename = path.basename.replace('$blog$', `${date}-${kebabName}`)
    })
  )
  .pipe(dest('blog'))
