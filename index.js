// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

exports.callbackify = require('./callbackify')

var debugs = {};
var debugEnviron;
exports.debuglog = function debuglog(set) {
  if (isUndefined(debugEnviron) && typeof process != 'undefined') {
    debugEnviron = process && process.env && process.env.NODE_DEBUG || '';
  }
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s: %s', set, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};

exports.deprecate = require('./deprecate');

var formatRegExp = /%[sdifjoO%]/g;
exports.format = function(f) {
  if (arguments.length <= 1) {
    return inspect(f)
  }
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%i': return Number(args[i++]);
      case '%f': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      case '%o': return inspect(args[i++], { showHidden: true, depth: 4, showProxy: true });
      case '%O': return inspect(args[i++]);
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};

/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  exports.inherits = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  exports.inherits = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = Object.assign({
    seen: [],
    indentationLvl: 0,
    stylize: stylizeNoColor
  }, inspect.defaultOptions, opts);

  // set default options
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  if (ctx.maxArrayLength === null) ctx.maxArrayLength = Infinity
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;

inspect.defaultOptions = {
  showHidden: false,
  depth: 2,
  colors: false,
  customInspect: true,
  showProxy: false,
  maxArrayLength: 100,
  breakLength: 60
}

// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan', // only applied to function
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  'regexp': 'red'
};

inspect.custom = 'inspect'


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}

// getConstructorOf is wrapped into this to save iterations
function getIdentificationOf(obj) {
  var type = getNativeClass(obj)
  if (type) {
    return type
  }
  var original = obj;
  var constructor = undefined;

  while (obj) {
    if (constructor === undefined) {
      var desc = Object.getOwnPropertyDescriptor(obj, 'constructor');
      if (desc !== undefined &&
          typeof desc.value === 'function' &&
          desc.value.name !== '')
        constructor = desc.value.name;
    }

    if (constructor !== undefined)
      break;

    obj = Object.getPrototypeOf(obj);
  }

  return constructor;
}

function formatValue(ctx, value, recurseTimes, ln) {
  var primitive = formatPrimitive(ctx.stylize, value, ctx);
  if (primitive) {
    return primitive;
  }

  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect && value) {
    try {
      var customInspect = value[inspect.custom] // can fail for some NSDistantObject
      if (isFunction(customInspect) &&
        // Filter out the util module, it's inspect function is special
        customInspect !== exports.inspect &&
        // Also filter out any prototype objects using the circular check.
        !(value.constructor && value.constructor.prototype === value)) {
        var ret = customInspect(recurseTimes, ctx);

        // If the custom inspection method returned `this`, don't go into
        // infinite recursion.
        if (ret !== value) {
          if (!isString(ret)) {
            ret = formatValue(ctx, ret, recurseTimes);
          }
        }
        return ret;
      }
    } catch (err) {}
  }

  var base = '';
  var formatter = formatObject;
  var braces = ['{', '}'];
  var noIterator = true;
  var raw;

  // if it's a MOStruct, we need to catch it early so that it doesn't fail
  if (getNativeClass(value) === 'MOStruct') {
    braces = [value.name() + ' {', '}']
    value = toObject(value)
  }

  if (value && value._isWrappedObject) {
    const propertyList = value.constructor._DefinedPropertiesKey
    const json = {}
    Object.keys(propertyList).forEach(k => {
      if (!propertyList[k].exportable) {
        return
      }
      json[k] = value[k]
      if (json[k] && !json[k]._isWrappedObject && json[k].toJSON) {
        json[k] = json[k].toJSON()
      }
    })
    value = json
  }

  var keys;

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  } else {
    keys = Object.keys(value)
  }

  var keyLength = keys.length

  var constructor = getIdentificationOf(value);
  var prefix = constructor ? (constructor + ' ') : '';

  if (isArray(value)) {
    noIterator = false
    // Only set the constructor for non ordinary ("Array [...]") arrays.
    braces = [(prefix === 'Array ' ? '' : prefix) + '[', ']'];
    if (value.length === 0 && keyLength === 0)
      return braces[0] + ']';
    formatter = formatArray;
  } else if (isFunction(value)) {
    var name = (constructor === 'Object' ? 'function MOMethod' : constructor) + (value.name ? (': ' + value.name) : '');
    if (keyLength === 0)
      return ctx.stylize(`[${name}]`, 'special');
    base = '[' + name + ']';
  } else if (prefix === 'Object ') {
    // Object fast path
    if (keyLength === 0)
      return '{}';
  } else if (isRegExp(value)) {
    // Make RegExps say that they are RegExps
    if (keyLength === 0 || recurseTimes < 0)
      return ctx.stylize(value.toString(), 'regexp');
    base = RegExp.prototype.toString.call(value);
  } else if (isDate(value)) {
    if (keyLength === 0) {
      if (Number.isNaN(value.getTime()))
        return ctx.stylize(value.toString(), 'date');
      return ctx.stylize(value.toISOString(), 'date');
    }
    // Make dates with properties first say the date
    base = value.toISOString();
  } else if (isError(value)) {
    // Make error with message first say the error
    if (keyLength === 0)
      return formatError(value);
    base = `${formatError(value)}`;
  } else if (!isObject(value) && getNativeClass(value)) {
    var description = value && value.description && String(value.description())
    var nativeClass = getNativeClass(value)
    if (description && description[0] === '<' && description.indexOf('>') > 0) {
      // most of the MS* classes
      return ctx.stylize(description.slice(0, description.indexOf('>') + 1), 'special')
    } else if (description) {
      // prefix the description with the class otherwise it can lead to some misunderstanding
      return ctx.stylize('<' + nativeClass + '> ' + description, 'special')
    } else {
      return ctx.stylize('<' + getNativeClass(value) + '>', 'special')
    }
  } else if (isObject(value) && getNativeClass(value)) {
    braces = [prefix + '{', '}'];
  }

  if (ctx.seen.indexOf(value) !== -1)
    return ctx.stylize('[Circular]', 'special')

  if (recurseTimes != null) {
    if (recurseTimes < 0)
      return ctx.stylize('[' + (constructor || 'Object') + ']', 'special');
    recurseTimes -= 1;
  }

  ctx.seen.push(value);

  var output = formatter(ctx, value, recurseTimes, keys);

  ctx.seen.pop();

  return reduceToSingleString(ctx, output, base, braces, ln);
}

function formatObject(ctx, value, recurseTimes, keys) {
  value = toObject(value)
  var len = keys.length;
  var output = new Array(len);
  for (var i = 0; i < len; i++)
    output[i] = formatProperty(ctx, value, recurseTimes, keys[i], 0);
  return output;
}

function formatNumber(fn, value) {
  // Format -0 as '-0'. Checking `value === -0` won't distinguish 0 from -0.
  if (Object.is(value, -0))
    return fn('-0', 'number');
  return fn('' + value, 'number');
}

var MIN_LINE_LENGTH = 16;
var readableRegExps = {};

var strEscapeSequencesRegExp = /[\x00-\x1f\x27\x5c]/;
var strEscapeSequencesReplacer = /[\x00-\x1f\x27\x5c]/g;

// Escaped special characters. Use empty strings to fill up unused entries.
var meta = [
  '\\u0000', '\\u0001', '\\u0002', '\\u0003', '\\u0004',
  '\\u0005', '\\u0006', '\\u0007', '\\b', '\\t',
  '\\n', '\\u000b', '\\f', '\\r', '\\u000e',
  '\\u000f', '\\u0010', '\\u0011', '\\u0012', '\\u0013',
  '\\u0014', '\\u0015', '\\u0016', '\\u0017', '\\u0018',
  '\\u0019', '\\u001a', '\\u001b', '\\u001c', '\\u001d',
  '\\u001e', '\\u001f', '', '', '',
  '', '', '', '', "\\'", '', '', '', '', '',
  '', '', '', '', '', '', '', '', '', '',
  '', '', '', '', '', '', '', '', '', '',
  '', '', '', '', '', '', '', '', '', '',
  '', '', '', '', '', '', '', '', '', '',
  '', '', '', '', '', '', '', '\\\\'
];

function escapeFn (str) { return meta[str.charCodeAt(0)] }

// Escape control characters, single quotes and the backslash.
// This is similar to JSON stringify escaping.
function strEscape(str) {
  // Some magic numbers that worked out fine while benchmarking with v8 6.0
  if (str.length < 5000 && !strEscapeSequencesRegExp.test(str))
    return '\'' + str + '\'';
  if (str.length > 100)
    return '\'' + str.replace(strEscapeSequencesReplacer, escapeFn) + '\'';
  var result = '';
  var last = 0;
  for (var i = 0; i < str.length; i++) {
    var point = str.charCodeAt(i);
    if (point === 39 || point === 92 || point < 32) {
      if (last === i) {
        result += meta[point];
      } else {
        result += str.slice(last, i) + meta[point];
      }
      last = i + 1;
    }
  }
  if (last === 0) {
    result = str;
  } else if (last !== i) {
    result += str.slice(last);
  }
  return '\'' + result + '\'';
}

function formatPrimitive(fn, value, ctx) {
  if (isUndefined(value)) {
    return fn('undefined', 'undefined');
  }
  if (isString(value)) {
    if (ctx.compact === false &&
      value.length > MIN_LINE_LENGTH &&
      ctx.indentationLvl + value.length > ctx.breakLength) {
      var minLineLength = Math.max(ctx.breakLength - ctx.indentationLvl, MIN_LINE_LENGTH);
      var averageLineLength = Math.ceil(value.length / Math.ceil(value.length / minLineLength));
      var divisor = Math.max(averageLineLength, MIN_LINE_LENGTH);
      var res = '';
      if (readableRegExps[divisor] === undefined) {
        // Build a new RegExp that naturally breaks text into multiple lines.
        //
        // Rules
        // 1. Greedy match all text up the max line length that ends with a
        //    whitespace or the end of the string.
        // 2. If none matches, non-greedy match any text up to a whitespace or
        //    the end of the string.
        //
        // eslint-disable-next-line max-len, node-core/no-unescaped-regexp-dot
        readableRegExps[divisor] = new RegExp(`(.|\\n){1,${divisor}}(\\s|$)|(\\n|.)+?(\\s|$)`, 'gm');
      }
      var indent = getIndentation(ctx.indentationLvl);
      var matches = value.match(readableRegExps[divisor]);
      if (matches.length > 1) {
        res += fn(strEscape(matches[0]), 'string') + ' +\n';
        for (var i = 1; i < matches.length - 1; i++) {
          res += indent + '  ' + fn(strEscape(matches[i]), 'string') + ' +\n';
        }
        res += indent + '  ' + fn(strEscape(matches[i]), 'string');
        return res;
      }
    }
    return fn(strEscape(value), 'string');
  }
  if (isNumber(value)) {
    return formatNumber(fn, Number(value));
  }
  if (isBoolean(value)) {
    return fn('' + Boolean(Number(value)), 'boolean');
  }
  if (isNull(value)) {
    return fn('null', 'null');
  }
}


function formatError(value) {
  return value.stack || '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, keys) {
  value = toArray(value)
  var len = Math.min(Math.max(0, ctx.maxArrayLength), value.length);
  var hidden = ctx.showHidden ? 1 : 0;
  var valLen = value.length;

  var remaining = valLen - len;
  var output = new Array(len + (remaining > 0 ? 1 : 0) + hidden);
  for (var i = 0; i < len; i++)
    output[i] = formatProperty(ctx, value, recurseTimes, keys[i] || i, 1);
  if (remaining > 0)
    output[i++] = '... ' + remaining + ' more item' + (remaining > 1 ? 's' : '');
  if (ctx.showHidden === true)
    output[i] = formatProperty(ctx, value, recurseTimes, 'length', 2);
  return output;
}

var keyStrRegExp = /^[a-zA-Z_][a-zA-Z_0-9]*$/;

function formatProperty(ctx, value, recurseTimes, key, array) {
  var name, str, desc;
  if (getNativeClass(value)) { // special case for native object
    desc = { value: value[key], enumerable: true }
  } else {
    desc = Object.getOwnPropertyDescriptor(value, key) ||
    { value: value[key], enumerable: true }
  }

  if (desc.value !== undefined) {
    var diff = array !== 0 || ctx.compact === false ? 2 : 3;
    ctx.indentationLvl += diff;
    str = formatValue(ctx, desc.value, recurseTimes, array === 0);
    ctx.indentationLvl -= diff;
  } else if (desc.get !== undefined) {
    if (desc.set !== undefined) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else if (desc.set !== undefined) {
    str = ctx.stylize('[Setter]', 'special');
  } else {
    str = ctx.stylize('undefined', 'undefined');
  }
  if (array === 1) {
    return str;
  }
  if (typeof key === 'symbol') {
    name = '[' + ctx.stylize(key.toString(), 'symbol') + ']';
  } else if (desc.enumerable === false) {
    name = '[' + key + ']';
  } else if (keyStrRegExp.test(key)) {
    name = ctx.stylize(key, 'name');
  } else {
    name = ctx.stylize(strEscape(key), 'string');
  }

  return name + ': ' + str;
}

var colorRegExp = /\u001b\[\d\d?m/g;

function removeColors(str) {
  return str.replace(colorRegExp, '');
}

function getIndentation(indentationLvl) {
  return Array.apply(null, Array(indentationLvl)).reduce(function(prev) { return prev + ' '}, '')
}

function reduceToSingleString(ctx, output, base, braces, addLn) {
  var breakLength = ctx.breakLength;
  var i = 0;
  if (ctx.compact === false) {
    var indentation = getIndentation(ctx.indentationLvl);
    var res = (base ? (base + ' ') : '') + braces[0] + '\n' + indentation + '  ';
    for (; i < output.length - 1; i++) {
      res += output[i] + ',\n' + indentation + '  ';
    }
    res += output[i] + '\n' + indentation + braces[1];
    return res;
  }
  if (output.length * 2 <= breakLength) {
    var length = 0;
    for (; i < output.length && length <= breakLength; i++) {
      if (ctx.colors) {
        length += removeColors(output[i]).length + 1;
      } else {
        length += output[i].length + 1;
      }
    }
    if (length <= breakLength)
      return braces[0] + (base ? (' ' + base) : '') + ' ' + output.join(', ') + ' ' +
        braces[1];
  }

  var indentation = getIndentation(ctx.indentationLvl);

  // If the opening "brace" is too large, like in the case of "Set {",
  // we need to force the first item to be on the next line or the
  // items will not line up correctly.
  var extraLn = addLn === true ? ('\n' + indentation) : '';

  var ln = base === '' && braces[0].length === 1 ?
    ' ' : ((base ? (' ' + base) : base) + '\n' + indentation + '  ');
  var str = output.join(',\n' + indentation + '  ');
  return extraLn + braces[0] + ln + str + ' ' + braces[1];
}

// check if the argument is a native sketch object
function getNativeClass(arg) {
  try {
    return arg && arg.isKindOfClass && typeof arg.class === 'function' && String(arg.class())
  } catch (err) {
    return undefined
  }
}
exports.getNativeClass = getNativeClass

function isNativeObject(arg) {
  return !!getNativeClass(arg)
}
exports.isNativeObject = isNativeObject

/**
 * Coerce common NSObjects to their JS counterparts
 * @param arg Any object
 *
 * Converts NSDictionary, NSArray, NSString, and NSNumber to
 * native JS equivilents.
 *
 * Note that NSDictionary and NSArray elements are not recursively converted
 */
function toJSObject(arg) {
  if (arg) {
    if (isObject(arg)) {
      return toObject(arg)
    } else if (isArray(arg)) {
      return toArray(arg)
    } else if (isString(arg)) {
      return String(arg)
    } else if (isNumber(arg)) {
      return Number(arg)
    } else if (isBoolean(arg)) {
      return Boolean(Number(arg))
    }
  }
  return arg
}
exports.toJSObject = toJSObject

var assimilatedArrays = ['NSArray', 'NSMutableArray', '__NSArrayM', '__NSSingleObjectArrayI', '__NSArray0', '__NSArrayI', '__NSArrayReversed', '__NSCFArray', '__NSPlaceholderArray']
function isArray(ar) {
  if (Array.isArray(ar)) {
    return true
  }
  var type = getNativeClass(ar)
  return assimilatedArrays.indexOf(type) !== -1
}
exports.isArray = isArray;

function toArray(object) {
  if (Array.isArray(object)) {
    return object
  }
  var arr = []
  for (var j = 0; j < (object || []).length; j += 1) {
    arr.push(object[j])
  }
  return arr
}
exports.toArray = toArray;

var assimilatedBooleans = ['__NSCFBoolean']
function isBoolean(arg) {
  if (typeof arg === 'boolean') {
    return true
  }
  var type = getNativeClass(arg)
  return assimilatedBooleans.indexOf(type) !== -1
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

var assimilatedNumbers = ['__NSCFNumber', 'NSNumber']
function isNumber(arg) {
  if (typeof arg === 'number') {
    return true
  }
  var type = getNativeClass(arg)
  return assimilatedNumbers.indexOf(type) !== -1
}
exports.isNumber = isNumber;

var assimilatedStrings = ['NSString', 'NSMutableString', '__NSCFString', 'NSTaggedPointerString', '__NSCFConstantString']
function isString(arg) {
  if (typeof arg === 'string') {
    return true
  }
  var type = getNativeClass(arg)
  return assimilatedStrings.indexOf(type) !== -1
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return typeof arg === 'undefined';
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

var assimilatedObjects = ['NSDictionary', 'NSMutableDictionary', '__NSDictionaryM', '__NSSingleEntryDictionaryI', '__NSDictionaryI', '__NSCFDictionary', 'MOStruct', '__NSFrozenDictionaryM', '__NSDictionary0', '__NSPlaceholderDictionary']
function isObject(arg) {
  var type = getNativeClass(arg)
  if (typeof arg === 'object' && arg !== null && !type) {
    return true
  }
  return assimilatedObjects.indexOf(type) !== -1
}
exports.isObject = isObject;

function toObject(obj) {
  var type = getNativeClass(obj)
  if (type === 'MOStruct') {
    return obj.memberNames().reduce(function(prev, k) {
      prev[k] = obj[k]
      return prev
    }, {})
  } else if (typeof obj === 'object') {
    return obj
  }
  return Object(obj)
}
exports.toObject = toObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function' || arg instanceof MOMethod;
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return isNull(arg) ||
         isBoolean(arg) ||
         isNumber(arg) ||
         isString(arg) ||
         isSymbol(arg) ||
         isUndefined(arg);
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
};

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

exports.isDeepStrictEqual = require('./deep-equal')

exports.promisify = require('./promisify')
