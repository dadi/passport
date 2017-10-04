'use strict'

const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')

const FileWallet = function (options) {
  this.path = path.resolve(options.path)
}

FileWallet.prototype.read = function () {
  return new Promise((resolve, reject) => {
    fs.readFile(this.path, 'utf8', (err, data) => {
      if (err) return reject(err)

      try {
        const payload = JSON.parse(data)

        return resolve(payload)
      } catch (err) {
        return reject(err)
      }
    })
  }).catch(err => Promise.resolve(false))
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
