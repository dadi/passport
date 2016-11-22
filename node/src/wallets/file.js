'use strict'

const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')

const FileWallet = function (options) {
  this.path = path.resolve(options.path)
}

FileWallet.prototype.read = function () {
  try {
    const rawContent = fs.readFileSync(this.path, 'utf8')
    const parsedContent = JSON.parse(rawContent)

    return parsedContent
  } catch (e) {
    return false
  }
}

FileWallet.prototype.write = function (data) {
  return new Promise((resolve, reject) => {
    const content = {
      accessToken: data.accessToken,
      expirationDate: Math.floor(Date.now() / 1000) + data.expiresIn
    }

    mkdirp(path.dirname(this.path), err => {
      fs.writeFile(this.path, JSON.stringify(content), err => {
        return resolve()
      })
    })
  })
}

module.exports = FileWallet