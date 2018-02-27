// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
module.exports = function deprecate(fn, msg) {
  var warned = false;
  function deprecated() {
    if (!warned) {
      console.error(msg);
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};
