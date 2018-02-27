module.exports = function callbackify(original) {
  return function(callback) {
    original().then(function (result) {
      callback(null, result)
    }).catch(function (err) {
      if (err === null) {
        err = new Error()
        err.reason = null
      }
      callback(err)
    })
  }
}
