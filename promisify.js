var customPromisify = 'promisify'

function promisify(fn) {
  if (fn[customPromisify]) {
    return fn[customPromisify]
  }
  return function () {
    var args = toArray(arguments)
    return new Promise(function (resolve, reject) {
      args.push(function (err, value) {
        if (typeof err !== 'undefined' && err !== null) {
          return reject(err)
        }
        return resolve(value)
      })
      fn.apply(this, args)
    })
  }
}
promisify.custom = customPromisify

module.exports = promisify
