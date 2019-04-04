function isKindOfClass(arg, nativeClass) {
  return (
    !!arg && !!arg.isKindOfClass && toBoolean(arg.isKindOfClass(nativeClass))
  );
}

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

// check if the argument is a native sketch object
function getNativeClass(arg) {
  try {
    return (
      arg &&
      arg.isKindOfClass &&
      typeof arg.class === "function" &&
      String(arg.class())
    );
  } catch (err) {
    return undefined;
  }
}
exports.getNativeClass = getNativeClass;

function isNativeObject(arg) {
  return !!getNativeClass(arg);
}
exports.isNativeObject = isNativeObject;

/**
 * Coerce common NSObjects to their JS counterparts
 * @param arg Any object
 *
 * Converts NSDictionary, NSArray, NSString, and NSNumber to
 * native JS equivilents.
 *
 * Note that NSDictionary and NSArray elements are not recursively converted
 * unless the options.recurse is set to `true`
 */
function toJSObject(arg, options) {
  if (arg) {
    if (isObject(arg)) {
      var obj = toObject(arg, options);
      if (options && options.recurse) {
        Object.keys(obj).forEach(function(k) {
          obj[k] = toJSObject(obj[k], options);
        });
      }
      return obj;
    } else if (isArray(arg)) {
      var arr = toArray(arg, options);
      if (options && options.recurse) {
        arr.forEach(function(x, i) {
          arr[i] = toJSObject(x, options);
        });
      }
      return arr;
    } else if (isString(arg)) {
      return String(arg);
    } else if (isBoolean(arg)) {
      return toBoolean(arg);
    } else if (isNumber(arg)) {
      return Number(arg);
    }
  }
  return arg;
}
exports.toJSObject = toJSObject;

function isArray(ar) {
  if (Array.isArray(ar)) {
    return true;
  }
  return isKindOfClass(ar, NSArray);
}
exports.isArray = isArray;

function toArray(object, options) {
  if (Array.isArray(object)) {
    return object;
  }
  var arr = [];
  for (var j = 0; j < (object || []).length; j += 1) {
    arr.push(object[j]);
  }
  return arr;
}
exports.toArray = toArray;

function isBoolean(arg) {
  if (typeof arg === "boolean") {
    return true;
  }
  return getNativeClass(arg) === "__NSCFBoolean";
}
exports.isBoolean = isBoolean;

function toBoolean(arg) {
  if (typeof arg === "boolean") {
    return arg;
  }
  return Boolean(Number(arg));
}
exports.toBoolean = toBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  if (typeof arg === "number") {
    return true;
  }
  return isKindOfClass(arg, NSNumber);
}
exports.isNumber = isNumber;

function isString(arg) {
  if (typeof arg === "string") {
    return true;
  }
  return isKindOfClass(arg, NSString);
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === "symbol";
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return typeof arg === "undefined";
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === "[object RegExp]";
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  if (typeof arg === "object" && arg !== null && !isNativeObject(arg)) {
    return true;
  }
  return isKindOfClass(arg, NSDictionary) || isKindOfClass(arg, MOStruct);
}
exports.isObject = isObject;

function toObject(obj) {
  if (isKindOfClass(obj, MOStruct)) {
    return obj.memberNames().reduce(function(prev, k) {
      prev[k] = obj[k];
      return prev;
    }, {});
  } else if (isNativeObject(obj) && typeof obj.objectForKey === "function") {
    var res = {};
    Object.keys(obj).forEach(function(key) {
      res[key] = obj.objectForKey(key);
    });
    return res;
  } else if (typeof obj === "object") {
    return obj;
  }
  return Object(obj);
}
exports.toObject = toObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === "[object Date]";
}
exports.isDate = isDate;

function isError(e) {
  return (
    isObject(e) &&
    (objectToString(e) === "[object Error]" || e instanceof Error)
  );
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === "function" || arg instanceof MOMethod;
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return (
    isNull(arg) ||
    isBoolean(arg) ||
    isNumber(arg) ||
    isString(arg) ||
    isSymbol(arg) ||
    isUndefined(arg)
  );
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = function isBuffer(arg) {
  return (
    arg &&
    typeof arg === "object" &&
    typeof arg.copy === "function" &&
    typeof arg.fill === "function" &&
    typeof arg.readUInt8 === "function"
  );
};
