var fs = require('fs')
var mkdirp = require('mkdirp')
var path = require('path')

var FileWallet = function (options) {
  this.path = path.resolve(options.path)
}

FileWallet.prototype.read = function () {
  var rawContent = fs.readFileSync(this.path, 'utf8')
  
  try {
    var parsedContent = JSON.parse(rawContent)

    return parsedContent
  } catch (e) {
    return false
  }
}

FileWallet.prototype.write = function (data) {
  var content = {
    accessToken: data.accessToken,
    expirationDate: Math.floor(Date.now() / 1000) + data.expiresIn
  }

  mkdirp(path.dirname(this.path), (err) => {
    fs.writeFileSync(this.path, JSON.stringify(content), 'utf8')
  })
}

module.exports = FileWallet