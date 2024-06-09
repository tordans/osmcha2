var __create = Object.create
var __defProp = Object.defineProperty
var __getProtoOf = Object.getPrototypeOf
var __getOwnPropNames = Object.getOwnPropertyNames
var __hasOwnProp = Object.prototype.hasOwnProperty
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {}
  const to =
    isNodeMode || !mod || !mod.__esModule
      ? __defProp(target, 'default', { value: mod, enumerable: true })
      : target
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true,
      })
  return to
}
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports)
var __require = ((x) =>
  typeof require !== 'undefined'
    ? require
    : typeof Proxy !== 'undefined'
      ? new Proxy(x, {
          get: (a, b) => (typeof require !== 'undefined' ? require : a)[b],
        })
      : x)(function (x) {
  if (typeof require !== 'undefined') return require.apply(this, arguments)
  throw Error('Dynamic require of "' + x + '" is not supported')
})

// node_modules/object-keys/isArguments.js
var require_isArguments = __commonJS((exports, module) => {
  var toStr = Object.prototype.toString
  module.exports = function isArguments(value) {
    var str = toStr.call(value)
    var isArgs = str === '[object Arguments]'
    if (!isArgs) {
      isArgs =
        str !== '[object Array]' &&
        value !== null &&
        typeof value === 'object' &&
        typeof value.length === 'number' &&
        value.length >= 0 &&
        toStr.call(value.callee) === '[object Function]'
    }
    return isArgs
  }
})

// node_modules/object-keys/implementation.js
var require_implementation = __commonJS((exports, module) => {
  var keysShim
  if (!Object.keys) {
    has = Object.prototype.hasOwnProperty
    toStr = Object.prototype.toString
    isArgs = require_isArguments()
    isEnumerable = Object.prototype.propertyIsEnumerable
    hasDontEnumBug = !isEnumerable.call({ toString: null }, 'toString')
    hasProtoEnumBug = isEnumerable.call(function () {}, 'prototype')
    dontEnums = [
      'toString',
      'toLocaleString',
      'valueOf',
      'hasOwnProperty',
      'isPrototypeOf',
      'propertyIsEnumerable',
      'constructor',
    ]
    equalsConstructorPrototype = function (o) {
      var ctor = o.constructor
      return ctor && ctor.prototype === o
    }
    excludedKeys = {
      $applicationCache: true,
      $console: true,
      $external: true,
      $frame: true,
      $frameElement: true,
      $frames: true,
      $innerHeight: true,
      $innerWidth: true,
      $onmozfullscreenchange: true,
      $onmozfullscreenerror: true,
      $outerHeight: true,
      $outerWidth: true,
      $pageXOffset: true,
      $pageYOffset: true,
      $parent: true,
      $scrollLeft: true,
      $scrollTop: true,
      $scrollX: true,
      $scrollY: true,
      $self: true,
      $webkitIndexedDB: true,
      $webkitStorageInfo: true,
      $window: true,
    }
    hasAutomationEqualityBug = (function () {
      if (typeof window === 'undefined') {
        return false
      }
      for (var k in window) {
        try {
          if (
            !excludedKeys['$' + k] &&
            has.call(window, k) &&
            window[k] !== null &&
            typeof window[k] === 'object'
          ) {
            try {
              equalsConstructorPrototype(window[k])
            } catch (e) {
              return true
            }
          }
        } catch (e) {
          return true
        }
      }
      return false
    })()
    equalsConstructorPrototypeIfNotBuggy = function (o) {
      if (typeof window === 'undefined' || !hasAutomationEqualityBug) {
        return equalsConstructorPrototype(o)
      }
      try {
        return equalsConstructorPrototype(o)
      } catch (e) {
        return false
      }
    }
    keysShim = function keys(object) {
      var isObject = object !== null && typeof object === 'object'
      var isFunction = toStr.call(object) === '[object Function]'
      var isArguments = isArgs(object)
      var isString = isObject && toStr.call(object) === '[object String]'
      var theKeys = []
      if (!isObject && !isFunction && !isArguments) {
        throw new TypeError('Object.keys called on a non-object')
      }
      var skipProto = hasProtoEnumBug && isFunction
      if (isString && object.length > 0 && !has.call(object, 0)) {
        for (var i = 0; i < object.length; ++i) {
          theKeys.push(String(i))
        }
      }
      if (isArguments && object.length > 0) {
        for (var j = 0; j < object.length; ++j) {
          theKeys.push(String(j))
        }
      } else {
        for (var name in object) {
          if (!(skipProto && name === 'prototype') && has.call(object, name)) {
            theKeys.push(String(name))
          }
        }
      }
      if (hasDontEnumBug) {
        var skipConstructor = equalsConstructorPrototypeIfNotBuggy(object)
        for (var k = 0; k < dontEnums.length; ++k) {
          if (
            !(skipConstructor && dontEnums[k] === 'constructor') &&
            has.call(object, dontEnums[k])
          ) {
            theKeys.push(dontEnums[k])
          }
        }
      }
      return theKeys
    }
  }
  var has
  var toStr
  var isArgs
  var isEnumerable
  var hasDontEnumBug
  var hasProtoEnumBug
  var dontEnums
  var equalsConstructorPrototype
  var excludedKeys
  var hasAutomationEqualityBug
  var equalsConstructorPrototypeIfNotBuggy
  module.exports = keysShim
})

// node_modules/object-keys/index.js
var require_object_keys = __commonJS((exports, module) => {
  var slice = Array.prototype.slice
  var isArgs = require_isArguments()
  var origKeys = Object.keys
  var keysShim = origKeys
    ? function keys(o) {
        return origKeys(o)
      }
    : require_implementation()
  var originalKeys = Object.keys
  keysShim.shim = function shimObjectKeys() {
    if (Object.keys) {
      var keysWorksWithArguments = (function () {
        var args = Object.keys(arguments)
        return args && args.length === arguments.length
      })(1, 2)
      if (!keysWorksWithArguments) {
        Object.keys = function keys(object) {
          if (isArgs(object)) {
            return originalKeys(slice.call(object))
          }
          return originalKeys(object)
        }
      }
    } else {
      Object.keys = keysShim
    }
    return Object.keys || keysShim
  }
  module.exports = keysShim
})

// node_modules/es-errors/index.js
var require_es_errors = __commonJS((exports, module) => {
  module.exports = Error
})

// node_modules/es-errors/eval.js
var require_eval = __commonJS((exports, module) => {
  module.exports = EvalError
})

// node_modules/es-errors/range.js
var require_range = __commonJS((exports, module) => {
  module.exports = RangeError
})

// node_modules/es-errors/ref.js
var require_ref = __commonJS((exports, module) => {
  module.exports = ReferenceError
})

// node_modules/es-errors/syntax.js
var require_syntax = __commonJS((exports, module) => {
  module.exports = SyntaxError
})

// node_modules/es-errors/type.js
var require_type = __commonJS((exports, module) => {
  module.exports = TypeError
})

// node_modules/es-errors/uri.js
var require_uri = __commonJS((exports, module) => {
  module.exports = URIError
})

// node_modules/has-symbols/shams.js
var require_shams = __commonJS((exports, module) => {
  module.exports = function hasSymbols() {
    if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') {
      return false
    }
    if (typeof Symbol.iterator === 'symbol') {
      return true
    }
    var obj = {}
    var sym = Symbol('test')
    var symObj = Object(sym)
    if (typeof sym === 'string') {
      return false
    }
    if (Object.prototype.toString.call(sym) !== '[object Symbol]') {
      return false
    }
    if (Object.prototype.toString.call(symObj) !== '[object Symbol]') {
      return false
    }
    var symVal = 42
    obj[sym] = symVal
    for (sym in obj) {
      return false
    }
    if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) {
      return false
    }
    if (
      typeof Object.getOwnPropertyNames === 'function' &&
      Object.getOwnPropertyNames(obj).length !== 0
    ) {
      return false
    }
    var syms = Object.getOwnPropertySymbols(obj)
    if (syms.length !== 1 || syms[0] !== sym) {
      return false
    }
    if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) {
      return false
    }
    if (typeof Object.getOwnPropertyDescriptor === 'function') {
      var descriptor = Object.getOwnPropertyDescriptor(obj, sym)
      if (descriptor.value !== symVal || descriptor.enumerable !== true) {
        return false
      }
    }
    return true
  }
})

// node_modules/has-symbols/index.js
var require_has_symbols = __commonJS((exports, module) => {
  var origSymbol = typeof Symbol !== 'undefined' && Symbol
  var hasSymbolSham = require_shams()
  module.exports = function hasNativeSymbols() {
    if (typeof origSymbol !== 'function') {
      return false
    }
    if (typeof Symbol !== 'function') {
      return false
    }
    if (typeof origSymbol('foo') !== 'symbol') {
      return false
    }
    if (typeof Symbol('bar') !== 'symbol') {
      return false
    }
    return hasSymbolSham()
  }
})

// node_modules/has-proto/index.js
var require_has_proto = __commonJS((exports, module) => {
  var test = {
    __proto__: null,
    foo: {},
  }
  var $Object = Object
  module.exports = function hasProto() {
    return { __proto__: test }.foo === test.foo && !(test instanceof $Object)
  }
})

// node_modules/function-bind/implementation.js
var require_implementation2 = __commonJS((exports, module) => {
  var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible '
  var toStr = Object.prototype.toString
  var max = Math.max
  var funcType = '[object Function]'
  var concatty = function concatty(a, b) {
    var arr = []
    for (var i = 0; i < a.length; i += 1) {
      arr[i] = a[i]
    }
    for (var j = 0; j < b.length; j += 1) {
      arr[j + a.length] = b[j]
    }
    return arr
  }
  var slicy = function slicy(arrLike, offset) {
    var arr = []
    for (var i = offset || 0, j = 0; i < arrLike.length; i += 1, j += 1) {
      arr[j] = arrLike[i]
    }
    return arr
  }
  var joiny = function (arr, joiner) {
    var str = ''
    for (var i = 0; i < arr.length; i += 1) {
      str += arr[i]
      if (i + 1 < arr.length) {
        str += joiner
      }
    }
    return str
  }
  module.exports = function bind(that) {
    var target = this
    if (typeof target !== 'function' || toStr.apply(target) !== funcType) {
      throw new TypeError(ERROR_MESSAGE + target)
    }
    var args = slicy(arguments, 1)
    var bound
    var binder = function () {
      if (this instanceof bound) {
        var result = target.apply(this, concatty(args, arguments))
        if (Object(result) === result) {
          return result
        }
        return this
      }
      return target.apply(that, concatty(args, arguments))
    }
    var boundLength = max(0, target.length - args.length)
    var boundArgs = []
    for (var i = 0; i < boundLength; i++) {
      boundArgs[i] = '$' + i
    }
    bound = Function(
      'binder',
      'return function (' + joiny(boundArgs, ',') + '){ return binder.apply(this,arguments); }',
    )(binder)
    if (target.prototype) {
      var Empty = function Empty() {}
      Empty.prototype = target.prototype
      bound.prototype = new Empty()
      Empty.prototype = null
    }
    return bound
  }
})

// node_modules/function-bind/index.js
var require_function_bind = __commonJS((exports, module) => {
  var implementation = require_implementation2()
  module.exports = Function.prototype.bind || implementation
})

// node_modules/hasown/index.js
var require_hasown = __commonJS((exports, module) => {
  var call = Function.prototype.call
  var $hasOwn = Object.prototype.hasOwnProperty
  var bind = require_function_bind()
  module.exports = bind.call(call, $hasOwn)
})

// node_modules/get-intrinsic/index.js
var require_get_intrinsic = __commonJS((exports, module) => {
  var undefined2
  var $Error = require_es_errors()
  var $EvalError = require_eval()
  var $RangeError = require_range()
  var $ReferenceError = require_ref()
  var $SyntaxError = require_syntax()
  var $TypeError = require_type()
  var $URIError = require_uri()
  var $Function = Function
  var getEvalledConstructor = function (expressionSyntax) {
    try {
      return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')()
    } catch (e) {}
  }
  var $gOPD = Object.getOwnPropertyDescriptor
  if ($gOPD) {
    try {
      $gOPD({}, '')
    } catch (e) {
      $gOPD = null
    }
  }
  var throwTypeError = function () {
    throw new $TypeError()
  }
  var ThrowTypeError = $gOPD
    ? (function () {
        try {
          arguments.callee
          return throwTypeError
        } catch (calleeThrows) {
          try {
            return $gOPD(arguments, 'callee').get
          } catch (gOPDthrows) {
            return throwTypeError
          }
        }
      })()
    : throwTypeError
  var hasSymbols = require_has_symbols()()
  var hasProto = require_has_proto()()
  var getProto =
    Object.getPrototypeOf ||
    (hasProto
      ? function (x) {
          return x.__proto__
        }
      : null)
  var needsEval = {}
  var TypedArray =
    typeof Uint8Array === 'undefined' || !getProto ? undefined2 : getProto(Uint8Array)
  var INTRINSICS = {
    __proto__: null,
    '%AggregateError%': typeof AggregateError === 'undefined' ? undefined2 : AggregateError,
    '%Array%': Array,
    '%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined2 : ArrayBuffer,
    '%ArrayIteratorPrototype%':
      hasSymbols && getProto ? getProto([][Symbol.iterator]()) : undefined2,
    '%AsyncFromSyncIteratorPrototype%': undefined2,
    '%AsyncFunction%': needsEval,
    '%AsyncGenerator%': needsEval,
    '%AsyncGeneratorFunction%': needsEval,
    '%AsyncIteratorPrototype%': needsEval,
    '%Atomics%': typeof Atomics === 'undefined' ? undefined2 : Atomics,
    '%BigInt%': typeof BigInt === 'undefined' ? undefined2 : BigInt,
    '%BigInt64Array%': typeof BigInt64Array === 'undefined' ? undefined2 : BigInt64Array,
    '%BigUint64Array%': typeof BigUint64Array === 'undefined' ? undefined2 : BigUint64Array,
    '%Boolean%': Boolean,
    '%DataView%': typeof DataView === 'undefined' ? undefined2 : DataView,
    '%Date%': Date,
    '%decodeURI%': decodeURI,
    '%decodeURIComponent%': decodeURIComponent,
    '%encodeURI%': encodeURI,
    '%encodeURIComponent%': encodeURIComponent,
    '%Error%': $Error,
    '%eval%': eval,
    '%EvalError%': $EvalError,
    '%Float32Array%': typeof Float32Array === 'undefined' ? undefined2 : Float32Array,
    '%Float64Array%': typeof Float64Array === 'undefined' ? undefined2 : Float64Array,
    '%FinalizationRegistry%':
      typeof FinalizationRegistry === 'undefined' ? undefined2 : FinalizationRegistry,
    '%Function%': $Function,
    '%GeneratorFunction%': needsEval,
    '%Int8Array%': typeof Int8Array === 'undefined' ? undefined2 : Int8Array,
    '%Int16Array%': typeof Int16Array === 'undefined' ? undefined2 : Int16Array,
    '%Int32Array%': typeof Int32Array === 'undefined' ? undefined2 : Int32Array,
    '%isFinite%': isFinite,
    '%isNaN%': isNaN,
    '%IteratorPrototype%':
      hasSymbols && getProto ? getProto(getProto([][Symbol.iterator]())) : undefined2,
    '%JSON%': typeof JSON === 'object' ? JSON : undefined2,
    '%Map%': typeof Map === 'undefined' ? undefined2 : Map,
    '%MapIteratorPrototype%':
      typeof Map === 'undefined' || !hasSymbols || !getProto
        ? undefined2
        : getProto(new Map()[Symbol.iterator]()),
    '%Math%': Math,
    '%Number%': Number,
    '%Object%': Object,
    '%parseFloat%': parseFloat,
    '%parseInt%': parseInt,
    '%Promise%': typeof Promise === 'undefined' ? undefined2 : Promise,
    '%Proxy%': typeof Proxy === 'undefined' ? undefined2 : Proxy,
    '%RangeError%': $RangeError,
    '%ReferenceError%': $ReferenceError,
    '%Reflect%': typeof Reflect === 'undefined' ? undefined2 : Reflect,
    '%RegExp%': RegExp,
    '%Set%': typeof Set === 'undefined' ? undefined2 : Set,
    '%SetIteratorPrototype%':
      typeof Set === 'undefined' || !hasSymbols || !getProto
        ? undefined2
        : getProto(new Set()[Symbol.iterator]()),
    '%SharedArrayBuffer%':
      typeof SharedArrayBuffer === 'undefined' ? undefined2 : SharedArrayBuffer,
    '%String%': String,
    '%StringIteratorPrototype%':
      hasSymbols && getProto ? getProto(''[Symbol.iterator]()) : undefined2,
    '%Symbol%': hasSymbols ? Symbol : undefined2,
    '%SyntaxError%': $SyntaxError,
    '%ThrowTypeError%': ThrowTypeError,
    '%TypedArray%': TypedArray,
    '%TypeError%': $TypeError,
    '%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined2 : Uint8Array,
    '%Uint8ClampedArray%':
      typeof Uint8ClampedArray === 'undefined' ? undefined2 : Uint8ClampedArray,
    '%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined2 : Uint16Array,
    '%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined2 : Uint32Array,
    '%URIError%': $URIError,
    '%WeakMap%': typeof WeakMap === 'undefined' ? undefined2 : WeakMap,
    '%WeakRef%': typeof WeakRef === 'undefined' ? undefined2 : WeakRef,
    '%WeakSet%': typeof WeakSet === 'undefined' ? undefined2 : WeakSet,
  }
  if (getProto) {
    try {
      null.error
    } catch (e) {
      errorProto = getProto(getProto(e))
      INTRINSICS['%Error.prototype%'] = errorProto
    }
  }
  var errorProto
  var doEval = function doEval(name) {
    var value
    if (name === '%AsyncFunction%') {
      value = getEvalledConstructor('async function () {}')
    } else if (name === '%GeneratorFunction%') {
      value = getEvalledConstructor('function* () {}')
    } else if (name === '%AsyncGeneratorFunction%') {
      value = getEvalledConstructor('async function* () {}')
    } else if (name === '%AsyncGenerator%') {
      var fn = doEval('%AsyncGeneratorFunction%')
      if (fn) {
        value = fn.prototype
      }
    } else if (name === '%AsyncIteratorPrototype%') {
      var gen = doEval('%AsyncGenerator%')
      if (gen && getProto) {
        value = getProto(gen.prototype)
      }
    }
    INTRINSICS[name] = value
    return value
  }
  var LEGACY_ALIASES = {
    __proto__: null,
    '%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
    '%ArrayPrototype%': ['Array', 'prototype'],
    '%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
    '%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
    '%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
    '%ArrayProto_values%': ['Array', 'prototype', 'values'],
    '%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
    '%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
    '%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
    '%BooleanPrototype%': ['Boolean', 'prototype'],
    '%DataViewPrototype%': ['DataView', 'prototype'],
    '%DatePrototype%': ['Date', 'prototype'],
    '%ErrorPrototype%': ['Error', 'prototype'],
    '%EvalErrorPrototype%': ['EvalError', 'prototype'],
    '%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
    '%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
    '%FunctionPrototype%': ['Function', 'prototype'],
    '%Generator%': ['GeneratorFunction', 'prototype'],
    '%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
    '%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
    '%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
    '%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
    '%JSONParse%': ['JSON', 'parse'],
    '%JSONStringify%': ['JSON', 'stringify'],
    '%MapPrototype%': ['Map', 'prototype'],
    '%NumberPrototype%': ['Number', 'prototype'],
    '%ObjectPrototype%': ['Object', 'prototype'],
    '%ObjProto_toString%': ['Object', 'prototype', 'toString'],
    '%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
    '%PromisePrototype%': ['Promise', 'prototype'],
    '%PromiseProto_then%': ['Promise', 'prototype', 'then'],
    '%Promise_all%': ['Promise', 'all'],
    '%Promise_reject%': ['Promise', 'reject'],
    '%Promise_resolve%': ['Promise', 'resolve'],
    '%RangeErrorPrototype%': ['RangeError', 'prototype'],
    '%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
    '%RegExpPrototype%': ['RegExp', 'prototype'],
    '%SetPrototype%': ['Set', 'prototype'],
    '%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
    '%StringPrototype%': ['String', 'prototype'],
    '%SymbolPrototype%': ['Symbol', 'prototype'],
    '%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
    '%TypedArrayPrototype%': ['TypedArray', 'prototype'],
    '%TypeErrorPrototype%': ['TypeError', 'prototype'],
    '%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
    '%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
    '%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
    '%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
    '%URIErrorPrototype%': ['URIError', 'prototype'],
    '%WeakMapPrototype%': ['WeakMap', 'prototype'],
    '%WeakSetPrototype%': ['WeakSet', 'prototype'],
  }
  var bind = require_function_bind()
  var hasOwn = require_hasown()
  var $concat = bind.call(Function.call, Array.prototype.concat)
  var $spliceApply = bind.call(Function.apply, Array.prototype.splice)
  var $replace = bind.call(Function.call, String.prototype.replace)
  var $strSlice = bind.call(Function.call, String.prototype.slice)
  var $exec = bind.call(Function.call, RegExp.prototype.exec)
  var rePropName =
    /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g
  var reEscapeChar = /\\(\\)?/g
  var stringToPath = function stringToPath(string) {
    var first = $strSlice(string, 0, 1)
    var last = $strSlice(string, -1)
    if (first === '%' && last !== '%') {
      throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`')
    } else if (last === '%' && first !== '%') {
      throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`')
    }
    var result = []
    $replace(string, rePropName, function (match, number, quote, subString) {
      result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : number || match
    })
    return result
  }
  var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
    var intrinsicName = name
    var alias
    if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
      alias = LEGACY_ALIASES[intrinsicName]
      intrinsicName = '%' + alias[0] + '%'
    }
    if (hasOwn(INTRINSICS, intrinsicName)) {
      var value = INTRINSICS[intrinsicName]
      if (value === needsEval) {
        value = doEval(intrinsicName)
      }
      if (typeof value === 'undefined' && !allowMissing) {
        throw new $TypeError(
          'intrinsic ' + name + ' exists, but is not available. Please file an issue!',
        )
      }
      return {
        alias,
        name: intrinsicName,
        value,
      }
    }
    throw new $SyntaxError('intrinsic ' + name + ' does not exist!')
  }
  module.exports = function GetIntrinsic(name, allowMissing) {
    if (typeof name !== 'string' || name.length === 0) {
      throw new $TypeError('intrinsic name must be a non-empty string')
    }
    if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
      throw new $TypeError('"allowMissing" argument must be a boolean')
    }
    if ($exec(/^%?[^%]*%?$/, name) === null) {
      throw new $SyntaxError(
        '`%` may not be present anywhere but at the beginning and end of the intrinsic name',
      )
    }
    var parts = stringToPath(name)
    var intrinsicBaseName = parts.length > 0 ? parts[0] : ''
    var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing)
    var intrinsicRealName = intrinsic.name
    var value = intrinsic.value
    var skipFurtherCaching = false
    var alias = intrinsic.alias
    if (alias) {
      intrinsicBaseName = alias[0]
      $spliceApply(parts, $concat([0, 1], alias))
    }
    for (var i = 1, isOwn = true; i < parts.length; i += 1) {
      var part = parts[i]
      var first = $strSlice(part, 0, 1)
      var last = $strSlice(part, -1)
      if (
        (first === '"' ||
          first === "'" ||
          first === '`' ||
          last === '"' ||
          last === "'" ||
          last === '`') &&
        first !== last
      ) {
        throw new $SyntaxError('property names with quotes must have matching quotes')
      }
      if (part === 'constructor' || !isOwn) {
        skipFurtherCaching = true
      }
      intrinsicBaseName += '.' + part
      intrinsicRealName = '%' + intrinsicBaseName + '%'
      if (hasOwn(INTRINSICS, intrinsicRealName)) {
        value = INTRINSICS[intrinsicRealName]
      } else if (value != null) {
        if (!(part in value)) {
          if (!allowMissing) {
            throw new $TypeError(
              'base intrinsic for ' + name + ' exists, but the property is not available.',
            )
          }
          return
        }
        if ($gOPD && i + 1 >= parts.length) {
          var desc = $gOPD(value, part)
          isOwn = !!desc
          if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
            value = desc.get
          } else {
            value = value[part]
          }
        } else {
          isOwn = hasOwn(value, part)
          value = value[part]
        }
        if (isOwn && !skipFurtherCaching) {
          INTRINSICS[intrinsicRealName] = value
        }
      }
    }
    return value
  }
})

// node_modules/es-define-property/index.js
var require_es_define_property = __commonJS((exports, module) => {
  var GetIntrinsic = require_get_intrinsic()
  var $defineProperty = GetIntrinsic('%Object.defineProperty%', true) || false
  if ($defineProperty) {
    try {
      $defineProperty({}, 'a', { value: 1 })
    } catch (e) {
      $defineProperty = false
    }
  }
  module.exports = $defineProperty
})

// node_modules/gopd/index.js
var require_gopd = __commonJS((exports, module) => {
  var GetIntrinsic = require_get_intrinsic()
  var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%', true)
  if ($gOPD) {
    try {
      $gOPD([], 'length')
    } catch (e) {
      $gOPD = null
    }
  }
  module.exports = $gOPD
})

// node_modules/define-data-property/index.js
var require_define_data_property = __commonJS((exports, module) => {
  var $defineProperty = require_es_define_property()
  var $SyntaxError = require_syntax()
  var $TypeError = require_type()
  var gopd = require_gopd()
  module.exports = function defineDataProperty(obj, property, value) {
    if (!obj || (typeof obj !== 'object' && typeof obj !== 'function')) {
      throw new $TypeError('`obj` must be an object or a function`')
    }
    if (typeof property !== 'string' && typeof property !== 'symbol') {
      throw new $TypeError('`property` must be a string or a symbol`')
    }
    if (arguments.length > 3 && typeof arguments[3] !== 'boolean' && arguments[3] !== null) {
      throw new $TypeError('`nonEnumerable`, if provided, must be a boolean or null')
    }
    if (arguments.length > 4 && typeof arguments[4] !== 'boolean' && arguments[4] !== null) {
      throw new $TypeError('`nonWritable`, if provided, must be a boolean or null')
    }
    if (arguments.length > 5 && typeof arguments[5] !== 'boolean' && arguments[5] !== null) {
      throw new $TypeError('`nonConfigurable`, if provided, must be a boolean or null')
    }
    if (arguments.length > 6 && typeof arguments[6] !== 'boolean') {
      throw new $TypeError('`loose`, if provided, must be a boolean')
    }
    var nonEnumerable = arguments.length > 3 ? arguments[3] : null
    var nonWritable = arguments.length > 4 ? arguments[4] : null
    var nonConfigurable = arguments.length > 5 ? arguments[5] : null
    var loose = arguments.length > 6 ? arguments[6] : false
    var desc = !!gopd && gopd(obj, property)
    if ($defineProperty) {
      $defineProperty(obj, property, {
        configurable: nonConfigurable === null && desc ? desc.configurable : !nonConfigurable,
        enumerable: nonEnumerable === null && desc ? desc.enumerable : !nonEnumerable,
        value,
        writable: nonWritable === null && desc ? desc.writable : !nonWritable,
      })
    } else if (loose || (!nonEnumerable && !nonWritable && !nonConfigurable)) {
      obj[property] = value
    } else {
      throw new $SyntaxError(
        'This environment does not support defining a property as non-configurable, non-writable, or non-enumerable.',
      )
    }
  }
})

// node_modules/has-property-descriptors/index.js
var require_has_property_descriptors = __commonJS((exports, module) => {
  var $defineProperty = require_es_define_property()
  var hasPropertyDescriptors = function hasPropertyDescriptors() {
    return !!$defineProperty
  }
  hasPropertyDescriptors.hasArrayLengthDefineBug = function hasArrayLengthDefineBug() {
    if (!$defineProperty) {
      return null
    }
    try {
      return $defineProperty([], 'length', { value: 1 }).length !== 1
    } catch (e) {
      return true
    }
  }
  module.exports = hasPropertyDescriptors
})

// node_modules/define-properties/index.js
var require_define_properties = __commonJS((exports, module) => {
  var keys = require_object_keys()
  var hasSymbols = typeof Symbol === 'function' && typeof Symbol('foo') === 'symbol'
  var toStr = Object.prototype.toString
  var concat = Array.prototype.concat
  var defineDataProperty = require_define_data_property()
  var isFunction = function (fn) {
    return typeof fn === 'function' && toStr.call(fn) === '[object Function]'
  }
  var supportsDescriptors = require_has_property_descriptors()()
  var defineProperty = function (object, name, value, predicate) {
    if (name in object) {
      if (predicate === true) {
        if (object[name] === value) {
          return
        }
      } else if (!isFunction(predicate) || !predicate()) {
        return
      }
    }
    if (supportsDescriptors) {
      defineDataProperty(object, name, value, true)
    } else {
      defineDataProperty(object, name, value)
    }
  }
  var defineProperties = function (object, map) {
    var predicates = arguments.length > 2 ? arguments[2] : {}
    var props = keys(map)
    if (hasSymbols) {
      props = concat.call(props, Object.getOwnPropertySymbols(map))
    }
    for (var i = 0; i < props.length; i += 1) {
      defineProperty(object, props[i], map[props[i]], predicates[props[i]])
    }
  }
  defineProperties.supportsDescriptors = !!supportsDescriptors
  module.exports = defineProperties
})

// node_modules/set-function-length/index.js
var require_set_function_length = __commonJS((exports, module) => {
  var GetIntrinsic = require_get_intrinsic()
  var define = require_define_data_property()
  var hasDescriptors = require_has_property_descriptors()()
  var gOPD = require_gopd()
  var $TypeError = require_type()
  var $floor = GetIntrinsic('%Math.floor%')
  module.exports = function setFunctionLength(fn, length) {
    if (typeof fn !== 'function') {
      throw new $TypeError('`fn` is not a function')
    }
    if (
      typeof length !== 'number' ||
      length < 0 ||
      length > 4294967295 ||
      $floor(length) !== length
    ) {
      throw new $TypeError('`length` must be a positive 32-bit integer')
    }
    var loose = arguments.length > 2 && !!arguments[2]
    var functionLengthIsConfigurable = true
    var functionLengthIsWritable = true
    if ('length' in fn && gOPD) {
      var desc = gOPD(fn, 'length')
      if (desc && !desc.configurable) {
        functionLengthIsConfigurable = false
      }
      if (desc && !desc.writable) {
        functionLengthIsWritable = false
      }
    }
    if (functionLengthIsConfigurable || functionLengthIsWritable || !loose) {
      if (hasDescriptors) {
        define(fn, 'length', length, true, true)
      } else {
        define(fn, 'length', length)
      }
    }
    return fn
  }
})

// node_modules/call-bind/index.js
var require_call_bind = __commonJS((exports, module) => {
  var bind = require_function_bind()
  var GetIntrinsic = require_get_intrinsic()
  var setFunctionLength = require_set_function_length()
  var $TypeError = require_type()
  var $apply = GetIntrinsic('%Function.prototype.apply%')
  var $call = GetIntrinsic('%Function.prototype.call%')
  var $reflectApply = GetIntrinsic('%Reflect.apply%', true) || bind.call($call, $apply)
  var $defineProperty = require_es_define_property()
  var $max = GetIntrinsic('%Math.max%')
  module.exports = function callBind(originalFunction) {
    if (typeof originalFunction !== 'function') {
      throw new $TypeError('a function is required')
    }
    var func = $reflectApply(bind, $call, arguments)
    return setFunctionLength(
      func,
      1 + $max(0, originalFunction.length - (arguments.length - 1)),
      true,
    )
  }
  var applyBind = function applyBind() {
    return $reflectApply(bind, $apply, arguments)
  }
  if ($defineProperty) {
    $defineProperty(module.exports, 'apply', { value: applyBind })
  } else {
    module.exports.apply = applyBind
  }
})

// node_modules/call-bind/callBound.js
var require_callBound = __commonJS((exports, module) => {
  var GetIntrinsic = require_get_intrinsic()
  var callBind = require_call_bind()
  var $indexOf = callBind(GetIntrinsic('String.prototype.indexOf'))
  module.exports = function callBoundIntrinsic(name, allowMissing) {
    var intrinsic = GetIntrinsic(name, !!allowMissing)
    if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.') > -1) {
      return callBind(intrinsic)
    }
    return intrinsic
  }
})

// node_modules/object.assign/implementation.js
var require_implementation3 = __commonJS((exports, module) => {
  var objectKeys = require_object_keys()
  var hasSymbols = require_shams()()
  var callBound = require_callBound()
  var toObject = Object
  var $push = callBound('Array.prototype.push')
  var $propIsEnumerable = callBound('Object.prototype.propertyIsEnumerable')
  var originalGetSymbols = hasSymbols ? Object.getOwnPropertySymbols : null
  module.exports = function assign(target, source1) {
    if (target == null) {
      throw new TypeError('target must be an object')
    }
    var to = toObject(target)
    if (arguments.length === 1) {
      return to
    }
    for (var s = 1; s < arguments.length; ++s) {
      var from = toObject(arguments[s])
      var keys = objectKeys(from)
      var getSymbols = hasSymbols && (Object.getOwnPropertySymbols || originalGetSymbols)
      if (getSymbols) {
        var syms = getSymbols(from)
        for (var j = 0; j < syms.length; ++j) {
          var key = syms[j]
          if ($propIsEnumerable(from, key)) {
            $push(keys, key)
          }
        }
      }
      for (var i = 0; i < keys.length; ++i) {
        var nextKey = keys[i]
        if ($propIsEnumerable(from, nextKey)) {
          var propValue = from[nextKey]
          to[nextKey] = propValue
        }
      }
    }
    return to
  }
})

// node_modules/object.assign/polyfill.js
var require_polyfill = __commonJS((exports, module) => {
  var implementation = require_implementation3()
  var lacksProperEnumerationOrder = function () {
    if (!Object.assign) {
      return false
    }
    var str = 'abcdefghijklmnopqrst'
    var letters = str.split('')
    var map = {}
    for (var i = 0; i < letters.length; ++i) {
      map[letters[i]] = letters[i]
    }
    var obj = Object.assign({}, map)
    var actual = ''
    for (var k in obj) {
      actual += k
    }
    return str !== actual
  }
  var assignHasPendingExceptions = function () {
    if (!Object.assign || !Object.preventExtensions) {
      return false
    }
    var thrower = Object.preventExtensions({ 1: 2 })
    try {
      Object.assign(thrower, 'xy')
    } catch (e) {
      return thrower[1] === 'y'
    }
    return false
  }
  module.exports = function getPolyfill() {
    if (!Object.assign) {
      return implementation
    }
    if (lacksProperEnumerationOrder()) {
      return implementation
    }
    if (assignHasPendingExceptions()) {
      return implementation
    }
    return Object.assign
  }
})

// node_modules/object.assign/shim.js
var require_shim = __commonJS((exports, module) => {
  var define = require_define_properties()
  var getPolyfill = require_polyfill()
  module.exports = function shimAssign() {
    var polyfill = getPolyfill()
    define(
      Object,
      { assign: polyfill },
      {
        assign: function () {
          return Object.assign !== polyfill
        },
      },
    )
    return polyfill
  }
})

// node_modules/object.assign/index.js
var require_object = __commonJS((exports, module) => {
  var defineProperties = require_define_properties()
  var callBind = require_call_bind()
  var implementation = require_implementation3()
  var getPolyfill = require_polyfill()
  var shim = require_shim()
  var polyfill = callBind.apply(getPolyfill())
  var bound = function assign(target, source1) {
    return polyfill(Object, arguments)
  }
  defineProperties(bound, {
    getPolyfill,
    implementation,
    shim,
  })
  module.exports = bound
})

// node_modules/functions-have-names/index.js
var require_functions_have_names = __commonJS((exports, module) => {
  var functionsHaveNames = function functionsHaveNames() {
    return typeof function f() {}.name === 'string'
  }
  var gOPD = Object.getOwnPropertyDescriptor
  if (gOPD) {
    try {
      gOPD([], 'length')
    } catch (e) {
      gOPD = null
    }
  }
  functionsHaveNames.functionsHaveConfigurableNames = function functionsHaveConfigurableNames() {
    if (!functionsHaveNames() || !gOPD) {
      return false
    }
    var desc = gOPD(function () {}, 'name')
    return !!desc && !!desc.configurable
  }
  var $bind = Function.prototype.bind
  functionsHaveNames.boundFunctionsHaveNames = function boundFunctionsHaveNames() {
    return functionsHaveNames() && typeof $bind === 'function' && function f() {}.bind().name !== ''
  }
  module.exports = functionsHaveNames
})

// node_modules/set-function-name/index.js
var require_set_function_name = __commonJS((exports, module) => {
  var define = require_define_data_property()
  var hasDescriptors = require_has_property_descriptors()()
  var functionsHaveConfigurableNames =
    require_functions_have_names().functionsHaveConfigurableNames()
  var $TypeError = require_type()
  module.exports = function setFunctionName(fn, name) {
    if (typeof fn !== 'function') {
      throw new $TypeError('`fn` is not a function')
    }
    var loose = arguments.length > 2 && !!arguments[2]
    if (!loose || functionsHaveConfigurableNames) {
      if (hasDescriptors) {
        define(fn, 'name', name, true, true)
      } else {
        define(fn, 'name', name)
      }
    }
    return fn
  }
})

// node_modules/regexp.prototype.flags/implementation.js
var require_implementation4 = __commonJS((exports, module) => {
  var setFunctionName = require_set_function_name()
  var $TypeError = require_type()
  var $Object = Object
  module.exports = setFunctionName(
    function flags() {
      if (this == null || this !== $Object(this)) {
        throw new $TypeError('RegExp.prototype.flags getter called on non-object')
      }
      var result = ''
      if (this.hasIndices) {
        result += 'd'
      }
      if (this.global) {
        result += 'g'
      }
      if (this.ignoreCase) {
        result += 'i'
      }
      if (this.multiline) {
        result += 'm'
      }
      if (this.dotAll) {
        result += 's'
      }
      if (this.unicode) {
        result += 'u'
      }
      if (this.unicodeSets) {
        result += 'v'
      }
      if (this.sticky) {
        result += 'y'
      }
      return result
    },
    'get flags',
    true,
  )
})

// node_modules/regexp.prototype.flags/polyfill.js
var require_polyfill2 = __commonJS((exports, module) => {
  var implementation = require_implementation4()
  var supportsDescriptors = require_define_properties().supportsDescriptors
  var $gOPD = Object.getOwnPropertyDescriptor
  module.exports = function getPolyfill() {
    if (supportsDescriptors && /a/gim.flags === 'gim') {
      var descriptor = $gOPD(RegExp.prototype, 'flags')
      if (
        descriptor &&
        typeof descriptor.get === 'function' &&
        typeof RegExp.prototype.dotAll === 'boolean' &&
        typeof RegExp.prototype.hasIndices === 'boolean'
      ) {
        var calls = ''
        var o = {}
        Object.defineProperty(o, 'hasIndices', {
          get: function () {
            calls += 'd'
          },
        })
        Object.defineProperty(o, 'sticky', {
          get: function () {
            calls += 'y'
          },
        })
        if (calls === 'dy') {
          return descriptor.get
        }
      }
    }
    return implementation
  }
})

// node_modules/regexp.prototype.flags/shim.js
var require_shim2 = __commonJS((exports, module) => {
  var supportsDescriptors = require_define_properties().supportsDescriptors
  var getPolyfill = require_polyfill2()
  var gOPD = Object.getOwnPropertyDescriptor
  var defineProperty = Object.defineProperty
  var TypeErr = TypeError
  var getProto = Object.getPrototypeOf
  var regex = /a/
  module.exports = function shimFlags() {
    if (!supportsDescriptors || !getProto) {
      throw new TypeErr(
        'RegExp.prototype.flags requires a true ES5 environment that supports property descriptors',
      )
    }
    var polyfill = getPolyfill()
    var proto = getProto(regex)
    var descriptor = gOPD(proto, 'flags')
    if (!descriptor || descriptor.get !== polyfill) {
      defineProperty(proto, 'flags', {
        configurable: true,
        enumerable: false,
        get: polyfill,
      })
    }
    return polyfill
  }
})

// node_modules/regexp.prototype.flags/index.js
var require_regexp_prototype = __commonJS((exports, module) => {
  var define = require_define_properties()
  var callBind = require_call_bind()
  var implementation = require_implementation4()
  var getPolyfill = require_polyfill2()
  var shim = require_shim2()
  var flagsBound = callBind(getPolyfill())
  define(flagsBound, {
    getPolyfill,
    implementation,
    shim,
  })
  module.exports = flagsBound
})

// node_modules/has-tostringtag/shams.js
var require_shams2 = __commonJS((exports, module) => {
  var hasSymbols = require_shams()
  module.exports = function hasToStringTagShams() {
    return hasSymbols() && !!Symbol.toStringTag
  }
})

// node_modules/is-arguments/index.js
var require_is_arguments = __commonJS((exports, module) => {
  var hasToStringTag = require_shams2()()
  var callBound = require_callBound()
  var $toString = callBound('Object.prototype.toString')
  var isStandardArguments = function isArguments(value) {
    if (hasToStringTag && value && typeof value === 'object' && Symbol.toStringTag in value) {
      return false
    }
    return $toString(value) === '[object Arguments]'
  }
  var isLegacyArguments = function isArguments(value) {
    if (isStandardArguments(value)) {
      return true
    }
    return (
      value !== null &&
      typeof value === 'object' &&
      typeof value.length === 'number' &&
      value.length >= 0 &&
      $toString(value) !== '[object Array]' &&
      $toString(value.callee) === '[object Function]'
    )
  }
  var supportsStandardArguments = (function () {
    return isStandardArguments(arguments)
  })()
  isStandardArguments.isLegacyArguments = isLegacyArguments
  module.exports = supportsStandardArguments ? isStandardArguments : isLegacyArguments
})

// node_modules/object-inspect/index.js
var require_object_inspect = __commonJS((exports, module) => {
  var addNumericSeparator = function (num, str) {
    if (
      num === Infinity ||
      num === -Infinity ||
      num !== num ||
      (num && num > -1000 && num < 1000) ||
      $test.call(/e/, str)
    ) {
      return str
    }
    var sepRegex = /[0-9](?=(?:[0-9]{3})+(?![0-9]))/g
    if (typeof num === 'number') {
      var int = num < 0 ? -$floor(-num) : $floor(num)
      if (int !== num) {
        var intStr = String(int)
        var dec = $slice.call(str, intStr.length + 1)
        return (
          $replace.call(intStr, sepRegex, '$&_') +
          '.' +
          $replace.call($replace.call(dec, /([0-9]{3})/g, '$&_'), /_$/, '')
        )
      }
    }
    return $replace.call(str, sepRegex, '$&_')
  }
  var wrapQuotes = function (s, defaultStyle, opts) {
    var quoteChar = (opts.quoteStyle || defaultStyle) === 'double' ? '"' : "'"
    return quoteChar + s + quoteChar
  }
  var quote = function (s) {
    return $replace.call(String(s), /"/g, '&quot;')
  }
  var isArray = function (obj) {
    return (
      toStr(obj) === '[object Array]' &&
      (!toStringTag || !(typeof obj === 'object' && toStringTag in obj))
    )
  }
  var isDate = function (obj) {
    return (
      toStr(obj) === '[object Date]' &&
      (!toStringTag || !(typeof obj === 'object' && toStringTag in obj))
    )
  }
  var isRegExp = function (obj) {
    return (
      toStr(obj) === '[object RegExp]' &&
      (!toStringTag || !(typeof obj === 'object' && toStringTag in obj))
    )
  }
  var isError = function (obj) {
    return (
      toStr(obj) === '[object Error]' &&
      (!toStringTag || !(typeof obj === 'object' && toStringTag in obj))
    )
  }
  var isString = function (obj) {
    return (
      toStr(obj) === '[object String]' &&
      (!toStringTag || !(typeof obj === 'object' && toStringTag in obj))
    )
  }
  var isNumber = function (obj) {
    return (
      toStr(obj) === '[object Number]' &&
      (!toStringTag || !(typeof obj === 'object' && toStringTag in obj))
    )
  }
  var isBoolean = function (obj) {
    return (
      toStr(obj) === '[object Boolean]' &&
      (!toStringTag || !(typeof obj === 'object' && toStringTag in obj))
    )
  }
  var isSymbol = function (obj) {
    if (hasShammedSymbols) {
      return obj && typeof obj === 'object' && obj instanceof Symbol
    }
    if (typeof obj === 'symbol') {
      return true
    }
    if (!obj || typeof obj !== 'object' || !symToString) {
      return false
    }
    try {
      symToString.call(obj)
      return true
    } catch (e) {}
    return false
  }
  var isBigInt = function (obj) {
    if (!obj || typeof obj !== 'object' || !bigIntValueOf) {
      return false
    }
    try {
      bigIntValueOf.call(obj)
      return true
    } catch (e) {}
    return false
  }
  var has = function (obj, key) {
    return hasOwn.call(obj, key)
  }
  var toStr = function (obj) {
    return objectToString.call(obj)
  }
  var nameOf = function (f) {
    if (f.name) {
      return f.name
    }
    var m = $match.call(functionToString.call(f), /^function\s*([\w$]+)/)
    if (m) {
      return m[1]
    }
    return null
  }
  var indexOf = function (xs, x) {
    if (xs.indexOf) {
      return xs.indexOf(x)
    }
    for (var i = 0, l = xs.length; i < l; i++) {
      if (xs[i] === x) {
        return i
      }
    }
    return -1
  }
  var isMap = function (x) {
    if (!mapSize || !x || typeof x !== 'object') {
      return false
    }
    try {
      mapSize.call(x)
      try {
        setSize.call(x)
      } catch (s) {
        return true
      }
      return x instanceof Map
    } catch (e) {}
    return false
  }
  var isWeakMap = function (x) {
    if (!weakMapHas || !x || typeof x !== 'object') {
      return false
    }
    try {
      weakMapHas.call(x, weakMapHas)
      try {
        weakSetHas.call(x, weakSetHas)
      } catch (s) {
        return true
      }
      return x instanceof WeakMap
    } catch (e) {}
    return false
  }
  var isWeakRef = function (x) {
    if (!weakRefDeref || !x || typeof x !== 'object') {
      return false
    }
    try {
      weakRefDeref.call(x)
      return true
    } catch (e) {}
    return false
  }
  var isSet = function (x) {
    if (!setSize || !x || typeof x !== 'object') {
      return false
    }
    try {
      setSize.call(x)
      try {
        mapSize.call(x)
      } catch (m) {
        return true
      }
      return x instanceof Set
    } catch (e) {}
    return false
  }
  var isWeakSet = function (x) {
    if (!weakSetHas || !x || typeof x !== 'object') {
      return false
    }
    try {
      weakSetHas.call(x, weakSetHas)
      try {
        weakMapHas.call(x, weakMapHas)
      } catch (s) {
        return true
      }
      return x instanceof WeakSet
    } catch (e) {}
    return false
  }
  var isElement = function (x) {
    if (!x || typeof x !== 'object') {
      return false
    }
    if (typeof HTMLElement !== 'undefined' && x instanceof HTMLElement) {
      return true
    }
    return typeof x.nodeName === 'string' && typeof x.getAttribute === 'function'
  }
  var inspectString = function (str, opts) {
    if (str.length > opts.maxStringLength) {
      var remaining = str.length - opts.maxStringLength
      var trailer = '... ' + remaining + ' more character' + (remaining > 1 ? 's' : '')
      return inspectString($slice.call(str, 0, opts.maxStringLength), opts) + trailer
    }
    var s = $replace.call($replace.call(str, /(['\\])/g, '\\$1'), /[\x00-\x1f]/g, lowbyte)
    return wrapQuotes(s, 'single', opts)
  }
  var lowbyte = function (c) {
    var n = c.charCodeAt(0)
    var x = {
      8: 'b',
      9: 't',
      10: 'n',
      12: 'f',
      13: 'r',
    }[n]
    if (x) {
      return '\\' + x
    }
    return '\\x' + (n < 16 ? '0' : '') + $toUpperCase.call(n.toString(16))
  }
  var markBoxed = function (str) {
    return 'Object(' + str + ')'
  }
  var weakCollectionOf = function (type) {
    return type + ' { ? }'
  }
  var collectionOf = function (type, size, entries, indent) {
    var joinedEntries = indent ? indentedJoin(entries, indent) : $join.call(entries, ', ')
    return type + ' (' + size + ') {' + joinedEntries + '}'
  }
  var singleLineValues = function (xs) {
    for (var i = 0; i < xs.length; i++) {
      if (indexOf(xs[i], '\n') >= 0) {
        return false
      }
    }
    return true
  }
  var getIndent = function (opts, depth) {
    var baseIndent
    if (opts.indent === '\t') {
      baseIndent = '\t'
    } else if (typeof opts.indent === 'number' && opts.indent > 0) {
      baseIndent = $join.call(Array(opts.indent + 1), ' ')
    } else {
      return null
    }
    return {
      base: baseIndent,
      prev: $join.call(Array(depth + 1), baseIndent),
    }
  }
  var indentedJoin = function (xs, indent) {
    if (xs.length === 0) {
      return ''
    }
    var lineJoiner = '\n' + indent.prev + indent.base
    return lineJoiner + $join.call(xs, ',' + lineJoiner) + '\n' + indent.prev
  }
  var arrObjKeys = function (obj, inspect) {
    var isArr = isArray(obj)
    var xs = []
    if (isArr) {
      xs.length = obj.length
      for (var i = 0; i < obj.length; i++) {
        xs[i] = has(obj, i) ? inspect(obj[i], obj) : ''
      }
    }
    var syms = typeof gOPS === 'function' ? gOPS(obj) : []
    var symMap
    if (hasShammedSymbols) {
      symMap = {}
      for (var k = 0; k < syms.length; k++) {
        symMap['$' + syms[k]] = syms[k]
      }
    }
    for (var key in obj) {
      if (!has(obj, key)) {
        continue
      }
      if (isArr && String(Number(key)) === key && key < obj.length) {
        continue
      }
      if (hasShammedSymbols && symMap['$' + key] instanceof Symbol) {
        continue
      } else if ($test.call(/[^\w$]/, key)) {
        xs.push(inspect(key, obj) + ': ' + inspect(obj[key], obj))
      } else {
        xs.push(key + ': ' + inspect(obj[key], obj))
      }
    }
    if (typeof gOPS === 'function') {
      for (var j = 0; j < syms.length; j++) {
        if (isEnumerable.call(obj, syms[j])) {
          xs.push('[' + inspect(syms[j]) + ']: ' + inspect(obj[syms[j]], obj))
        }
      }
    }
    return xs
  }
  var hasMap = typeof Map === 'function' && Map.prototype
  var mapSizeDescriptor =
    Object.getOwnPropertyDescriptor && hasMap
      ? Object.getOwnPropertyDescriptor(Map.prototype, 'size')
      : null
  var mapSize =
    hasMap && mapSizeDescriptor && typeof mapSizeDescriptor.get === 'function'
      ? mapSizeDescriptor.get
      : null
  var mapForEach = hasMap && Map.prototype.forEach
  var hasSet = typeof Set === 'function' && Set.prototype
  var setSizeDescriptor =
    Object.getOwnPropertyDescriptor && hasSet
      ? Object.getOwnPropertyDescriptor(Set.prototype, 'size')
      : null
  var setSize =
    hasSet && setSizeDescriptor && typeof setSizeDescriptor.get === 'function'
      ? setSizeDescriptor.get
      : null
  var setForEach = hasSet && Set.prototype.forEach
  var hasWeakMap = typeof WeakMap === 'function' && WeakMap.prototype
  var weakMapHas = hasWeakMap ? WeakMap.prototype.has : null
  var hasWeakSet = typeof WeakSet === 'function' && WeakSet.prototype
  var weakSetHas = hasWeakSet ? WeakSet.prototype.has : null
  var hasWeakRef = typeof WeakRef === 'function' && WeakRef.prototype
  var weakRefDeref = hasWeakRef ? WeakRef.prototype.deref : null
  var booleanValueOf = Boolean.prototype.valueOf
  var objectToString = Object.prototype.toString
  var functionToString = Function.prototype.toString
  var $match = String.prototype.match
  var $slice = String.prototype.slice
  var $replace = String.prototype.replace
  var $toUpperCase = String.prototype.toUpperCase
  var $toLowerCase = String.prototype.toLowerCase
  var $test = RegExp.prototype.test
  var $concat = Array.prototype.concat
  var $join = Array.prototype.join
  var $arrSlice = Array.prototype.slice
  var $floor = Math.floor
  var bigIntValueOf = typeof BigInt === 'function' ? BigInt.prototype.valueOf : null
  var gOPS = Object.getOwnPropertySymbols
  var symToString =
    typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol'
      ? Symbol.prototype.toString
      : null
  var hasShammedSymbols = typeof Symbol === 'function' && typeof Symbol.iterator === 'object'
  var toStringTag =
    typeof Symbol === 'function' &&
    Symbol.toStringTag &&
    (typeof Symbol.toStringTag === hasShammedSymbols ? 'object' : 'symbol')
      ? Symbol.toStringTag
      : null
  var isEnumerable = Object.prototype.propertyIsEnumerable
  var gPO =
    (typeof Reflect === 'function' ? Reflect.getPrototypeOf : Object.getPrototypeOf) ||
    ([].__proto__ === Array.prototype
      ? function (O) {
          return O.__proto__
        }
      : null)
  var utilInspect = () => ({})
  var inspectCustom = utilInspect.custom
  var inspectSymbol = isSymbol(inspectCustom) ? inspectCustom : null
  module.exports = function inspect_(obj, options, depth, seen) {
    var opts = options || {}
    if (has(opts, 'quoteStyle') && opts.quoteStyle !== 'single' && opts.quoteStyle !== 'double') {
      throw new TypeError('option "quoteStyle" must be "single" or "double"')
    }
    if (
      has(opts, 'maxStringLength') &&
      (typeof opts.maxStringLength === 'number'
        ? opts.maxStringLength < 0 && opts.maxStringLength !== Infinity
        : opts.maxStringLength !== null)
    ) {
      throw new TypeError(
        'option "maxStringLength", if provided, must be a positive integer, Infinity, or `null`',
      )
    }
    var customInspect = has(opts, 'customInspect') ? opts.customInspect : true
    if (typeof customInspect !== 'boolean' && customInspect !== 'symbol') {
      throw new TypeError(
        'option "customInspect", if provided, must be `true`, `false`, or `\'symbol\'`',
      )
    }
    if (
      has(opts, 'indent') &&
      opts.indent !== null &&
      opts.indent !== '\t' &&
      !(parseInt(opts.indent, 10) === opts.indent && opts.indent > 0)
    ) {
      throw new TypeError('option "indent" must be "\\t", an integer > 0, or `null`')
    }
    if (has(opts, 'numericSeparator') && typeof opts.numericSeparator !== 'boolean') {
      throw new TypeError('option "numericSeparator", if provided, must be `true` or `false`')
    }
    var numericSeparator = opts.numericSeparator
    if (typeof obj === 'undefined') {
      return 'undefined'
    }
    if (obj === null) {
      return 'null'
    }
    if (typeof obj === 'boolean') {
      return obj ? 'true' : 'false'
    }
    if (typeof obj === 'string') {
      return inspectString(obj, opts)
    }
    if (typeof obj === 'number') {
      if (obj === 0) {
        return Infinity / obj > 0 ? '0' : '-0'
      }
      var str = String(obj)
      return numericSeparator ? addNumericSeparator(obj, str) : str
    }
    if (typeof obj === 'bigint') {
      var bigIntStr = String(obj) + 'n'
      return numericSeparator ? addNumericSeparator(obj, bigIntStr) : bigIntStr
    }
    var maxDepth = typeof opts.depth === 'undefined' ? 5 : opts.depth
    if (typeof depth === 'undefined') {
      depth = 0
    }
    if (depth >= maxDepth && maxDepth > 0 && typeof obj === 'object') {
      return isArray(obj) ? '[Array]' : '[Object]'
    }
    var indent = getIndent(opts, depth)
    if (typeof seen === 'undefined') {
      seen = []
    } else if (indexOf(seen, obj) >= 0) {
      return '[Circular]'
    }
    function inspect(value, from, noIndent) {
      if (from) {
        seen = $arrSlice.call(seen)
        seen.push(from)
      }
      if (noIndent) {
        var newOpts = {
          depth: opts.depth,
        }
        if (has(opts, 'quoteStyle')) {
          newOpts.quoteStyle = opts.quoteStyle
        }
        return inspect_(value, newOpts, depth + 1, seen)
      }
      return inspect_(value, opts, depth + 1, seen)
    }
    if (typeof obj === 'function' && !isRegExp(obj)) {
      var name = nameOf(obj)
      var keys = arrObjKeys(obj, inspect)
      return (
        '[Function' +
        (name ? ': ' + name : ' (anonymous)') +
        ']' +
        (keys.length > 0 ? ' { ' + $join.call(keys, ', ') + ' }' : '')
      )
    }
    if (isSymbol(obj)) {
      var symString = hasShammedSymbols
        ? $replace.call(String(obj), /^(Symbol\(.*\))_[^)]*$/, '$1')
        : symToString.call(obj)
      return typeof obj === 'object' && !hasShammedSymbols ? markBoxed(symString) : symString
    }
    if (isElement(obj)) {
      var s = '<' + $toLowerCase.call(String(obj.nodeName))
      var attrs = obj.attributes || []
      for (var i = 0; i < attrs.length; i++) {
        s += ' ' + attrs[i].name + '=' + wrapQuotes(quote(attrs[i].value), 'double', opts)
      }
      s += '>'
      if (obj.childNodes && obj.childNodes.length) {
        s += '...'
      }
      s += '</' + $toLowerCase.call(String(obj.nodeName)) + '>'
      return s
    }
    if (isArray(obj)) {
      if (obj.length === 0) {
        return '[]'
      }
      var xs = arrObjKeys(obj, inspect)
      if (indent && !singleLineValues(xs)) {
        return '[' + indentedJoin(xs, indent) + ']'
      }
      return '[ ' + $join.call(xs, ', ') + ' ]'
    }
    if (isError(obj)) {
      var parts = arrObjKeys(obj, inspect)
      if (!('cause' in Error.prototype) && 'cause' in obj && !isEnumerable.call(obj, 'cause')) {
        return (
          '{ [' +
          String(obj) +
          '] ' +
          $join.call($concat.call('[cause]: ' + inspect(obj.cause), parts), ', ') +
          ' }'
        )
      }
      if (parts.length === 0) {
        return '[' + String(obj) + ']'
      }
      return '{ [' + String(obj) + '] ' + $join.call(parts, ', ') + ' }'
    }
    if (typeof obj === 'object' && customInspect) {
      if (inspectSymbol && typeof obj[inspectSymbol] === 'function' && utilInspect) {
        return utilInspect(obj, { depth: maxDepth - depth })
      } else if (customInspect !== 'symbol' && typeof obj.inspect === 'function') {
        return obj.inspect()
      }
    }
    if (isMap(obj)) {
      var mapParts = []
      if (mapForEach) {
        mapForEach.call(obj, function (value, key) {
          mapParts.push(inspect(key, obj, true) + ' => ' + inspect(value, obj))
        })
      }
      return collectionOf('Map', mapSize.call(obj), mapParts, indent)
    }
    if (isSet(obj)) {
      var setParts = []
      if (setForEach) {
        setForEach.call(obj, function (value) {
          setParts.push(inspect(value, obj))
        })
      }
      return collectionOf('Set', setSize.call(obj), setParts, indent)
    }
    if (isWeakMap(obj)) {
      return weakCollectionOf('WeakMap')
    }
    if (isWeakSet(obj)) {
      return weakCollectionOf('WeakSet')
    }
    if (isWeakRef(obj)) {
      return weakCollectionOf('WeakRef')
    }
    if (isNumber(obj)) {
      return markBoxed(inspect(Number(obj)))
    }
    if (isBigInt(obj)) {
      return markBoxed(inspect(bigIntValueOf.call(obj)))
    }
    if (isBoolean(obj)) {
      return markBoxed(booleanValueOf.call(obj))
    }
    if (isString(obj)) {
      return markBoxed(inspect(String(obj)))
    }
    if (typeof window !== 'undefined' && obj === window) {
      return '{ [object Window] }'
    }
    if (obj === global) {
      return '{ [object globalThis] }'
    }
    if (!isDate(obj) && !isRegExp(obj)) {
      var ys = arrObjKeys(obj, inspect)
      var isPlainObject = gPO
        ? gPO(obj) === Object.prototype
        : obj instanceof Object || obj.constructor === Object
      var protoTag = obj instanceof Object ? '' : 'null prototype'
      var stringTag =
        !isPlainObject && toStringTag && Object(obj) === obj && toStringTag in obj
          ? $slice.call(toStr(obj), 8, -1)
          : protoTag
            ? 'Object'
            : ''
      var constructorTag =
        isPlainObject || typeof obj.constructor !== 'function'
          ? ''
          : obj.constructor.name
            ? obj.constructor.name + ' '
            : ''
      var tag =
        constructorTag +
        (stringTag || protoTag
          ? '[' + $join.call($concat.call([], stringTag || [], protoTag || []), ': ') + '] '
          : '')
      if (ys.length === 0) {
        return tag + '{}'
      }
      if (indent) {
        return tag + '{' + indentedJoin(ys, indent) + '}'
      }
      return tag + '{ ' + $join.call(ys, ', ') + ' }'
    }
    return String(obj)
  }
  var hasOwn =
    Object.prototype.hasOwnProperty ||
    function (key) {
      return key in this
    }
})

// node_modules/side-channel/index.js
var require_side_channel = __commonJS((exports, module) => {
  var GetIntrinsic = require_get_intrinsic()
  var callBound = require_callBound()
  var inspect = require_object_inspect()
  var $TypeError = require_type()
  var $WeakMap = GetIntrinsic('%WeakMap%', true)
  var $Map = GetIntrinsic('%Map%', true)
  var $weakMapGet = callBound('WeakMap.prototype.get', true)
  var $weakMapSet = callBound('WeakMap.prototype.set', true)
  var $weakMapHas = callBound('WeakMap.prototype.has', true)
  var $mapGet = callBound('Map.prototype.get', true)
  var $mapSet = callBound('Map.prototype.set', true)
  var $mapHas = callBound('Map.prototype.has', true)
  var listGetNode = function (list, key) {
    var prev = list
    var curr
    for (; (curr = prev.next) !== null; prev = curr) {
      if (curr.key === key) {
        prev.next = curr.next
        curr.next = list.next
        list.next = curr
        return curr
      }
    }
  }
  var listGet = function (objects, key) {
    var node = listGetNode(objects, key)
    return node && node.value
  }
  var listSet = function (objects, key, value) {
    var node = listGetNode(objects, key)
    if (node) {
      node.value = value
    } else {
      objects.next = {
        key,
        next: objects.next,
        value,
      }
    }
  }
  var listHas = function (objects, key) {
    return !!listGetNode(objects, key)
  }
  module.exports = function getSideChannel() {
    var $wm
    var $m
    var $o
    var channel = {
      assert: function (key) {
        if (!channel.has(key)) {
          throw new $TypeError('Side channel does not contain ' + inspect(key))
        }
      },
      get: function (key) {
        if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
          if ($wm) {
            return $weakMapGet($wm, key)
          }
        } else if ($Map) {
          if ($m) {
            return $mapGet($m, key)
          }
        } else {
          if ($o) {
            return listGet($o, key)
          }
        }
      },
      has: function (key) {
        if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
          if ($wm) {
            return $weakMapHas($wm, key)
          }
        } else if ($Map) {
          if ($m) {
            return $mapHas($m, key)
          }
        } else {
          if ($o) {
            return listHas($o, key)
          }
        }
        return false
      },
      set: function (key, value) {
        if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
          if (!$wm) {
            $wm = new $WeakMap()
          }
          $weakMapSet($wm, key, value)
        } else if ($Map) {
          if (!$m) {
            $m = new $Map()
          }
          $mapSet($m, key, value)
        } else {
          if (!$o) {
            $o = { key: {}, next: null }
          }
          listSet($o, key, value)
        }
      },
    }
    return channel
  }
})

// node_modules/internal-slot/index.js
var require_internal_slot = __commonJS((exports, module) => {
  var hasOwn = require_hasown()
  var channel = require_side_channel()()
  var $TypeError = require_type()
  var SLOT = {
    assert: function (O, slot) {
      if (!O || (typeof O !== 'object' && typeof O !== 'function')) {
        throw new $TypeError('`O` is not an object')
      }
      if (typeof slot !== 'string') {
        throw new $TypeError('`slot` must be a string')
      }
      channel.assert(O)
      if (!SLOT.has(O, slot)) {
        throw new $TypeError('`' + slot + '` is not present on `O`')
      }
    },
    get: function (O, slot) {
      if (!O || (typeof O !== 'object' && typeof O !== 'function')) {
        throw new $TypeError('`O` is not an object')
      }
      if (typeof slot !== 'string') {
        throw new $TypeError('`slot` must be a string')
      }
      var slots = channel.get(O)
      return slots && slots['$' + slot]
    },
    has: function (O, slot) {
      if (!O || (typeof O !== 'object' && typeof O !== 'function')) {
        throw new $TypeError('`O` is not an object')
      }
      if (typeof slot !== 'string') {
        throw new $TypeError('`slot` must be a string')
      }
      var slots = channel.get(O)
      return !!slots && hasOwn(slots, '$' + slot)
    },
    set: function (O, slot, V) {
      if (!O || (typeof O !== 'object' && typeof O !== 'function')) {
        throw new $TypeError('`O` is not an object')
      }
      if (typeof slot !== 'string') {
        throw new $TypeError('`slot` must be a string')
      }
      var slots = channel.get(O)
      if (!slots) {
        slots = {}
        channel.set(O, slots)
      }
      slots['$' + slot] = V
    },
  }
  if (Object.freeze) {
    Object.freeze(SLOT)
  }
  module.exports = SLOT
})

// node_modules/stop-iteration-iterator/index.js
var require_stop_iteration_iterator = __commonJS((exports, module) => {
  var SLOT = require_internal_slot()
  var $SyntaxError = SyntaxError
  var $StopIteration = typeof StopIteration === 'object' ? StopIteration : null
  module.exports = function getStopIterationIterator(origIterator) {
    if (!$StopIteration) {
      throw new $SyntaxError('this environment lacks StopIteration')
    }
    SLOT.set(origIterator, '[[Done]]', false)
    var siIterator = {
      next: function next() {
        var iterator = SLOT.get(this, '[[Iterator]]')
        var done = SLOT.get(iterator, '[[Done]]')
        try {
          return {
            done,
            value: done ? undefined : iterator.next(),
          }
        } catch (e) {
          SLOT.set(iterator, '[[Done]]', true)
          if (e !== $StopIteration) {
            throw e
          }
          return {
            done: true,
            value: undefined,
          }
        }
      },
    }
    SLOT.set(siIterator, '[[Iterator]]', origIterator)
    return siIterator
  }
})

// node_modules/isarray/index.js
var require_isarray = __commonJS((exports, module) => {
  var toString = {}.toString
  module.exports =
    Array.isArray ||
    function (arr) {
      return toString.call(arr) == '[object Array]'
    }
})

// node_modules/is-string/index.js
var require_is_string = __commonJS((exports, module) => {
  var strValue = String.prototype.valueOf
  var tryStringObject = function tryStringObject(value) {
    try {
      strValue.call(value)
      return true
    } catch (e) {
      return false
    }
  }
  var toStr = Object.prototype.toString
  var strClass = '[object String]'
  var hasToStringTag = require_shams2()()
  module.exports = function isString(value) {
    if (typeof value === 'string') {
      return true
    }
    if (typeof value !== 'object') {
      return false
    }
    return hasToStringTag ? tryStringObject(value) : toStr.call(value) === strClass
  }
})

// node_modules/is-map/index.js
var require_is_map = __commonJS((exports, module) => {
  var $Map = typeof Map === 'function' && Map.prototype ? Map : null
  var $Set = typeof Set === 'function' && Set.prototype ? Set : null
  var exported
  if (!$Map) {
    exported = function isMap(x) {
      return false
    }
  }
  var $mapHas = $Map ? Map.prototype.has : null
  var $setHas = $Set ? Set.prototype.has : null
  if (!exported && !$mapHas) {
    exported = function isMap(x) {
      return false
    }
  }
  module.exports =
    exported ||
    function isMap(x) {
      if (!x || typeof x !== 'object') {
        return false
      }
      try {
        $mapHas.call(x)
        if ($setHas) {
          try {
            $setHas.call(x)
          } catch (e) {
            return true
          }
        }
        return x instanceof $Map
      } catch (e) {}
      return false
    }
})

// node_modules/is-set/index.js
var require_is_set = __commonJS((exports, module) => {
  var $Map = typeof Map === 'function' && Map.prototype ? Map : null
  var $Set = typeof Set === 'function' && Set.prototype ? Set : null
  var exported
  if (!$Set) {
    exported = function isSet(x) {
      return false
    }
  }
  var $mapHas = $Map ? Map.prototype.has : null
  var $setHas = $Set ? Set.prototype.has : null
  if (!exported && !$setHas) {
    exported = function isSet(x) {
      return false
    }
  }
  module.exports =
    exported ||
    function isSet(x) {
      if (!x || typeof x !== 'object') {
        return false
      }
      try {
        $setHas.call(x)
        if ($mapHas) {
          try {
            $mapHas.call(x)
          } catch (e) {
            return true
          }
        }
        return x instanceof $Set
      } catch (e) {}
      return false
    }
})

// node_modules/es-get-iterator/index.js
var require_es_get_iterator = __commonJS((exports, module) => {
  var isArguments = require_is_arguments()
  var getStopIterationIterator = require_stop_iteration_iterator()
  if (require_has_symbols()() || require_shams()()) {
    $iterator = Symbol.iterator
    module.exports = function getIterator(iterable) {
      if (iterable != null && typeof iterable[$iterator] !== 'undefined') {
        return iterable[$iterator]()
      }
      if (isArguments(iterable)) {
        return Array.prototype[$iterator].call(iterable)
      }
    }
  } else {
    isArray = require_isarray()
    isString = require_is_string()
    GetIntrinsic = require_get_intrinsic()
    $Map = GetIntrinsic('%Map%', true)
    $Set = GetIntrinsic('%Set%', true)
    callBound = require_callBound()
    $arrayPush = callBound('Array.prototype.push')
    $charCodeAt = callBound('String.prototype.charCodeAt')
    $stringSlice = callBound('String.prototype.slice')
    advanceStringIndex = function advanceStringIndex(S, index) {
      var length = S.length
      if (index + 1 >= length) {
        return index + 1
      }
      var first = $charCodeAt(S, index)
      if (first < 55296 || first > 56319) {
        return index + 1
      }
      var second = $charCodeAt(S, index + 1)
      if (second < 56320 || second > 57343) {
        return index + 1
      }
      return index + 2
    }
    getArrayIterator = function getArrayIterator(arraylike) {
      var i = 0
      return {
        next: function next() {
          var done = i >= arraylike.length
          var value
          if (!done) {
            value = arraylike[i]
            i += 1
          }
          return {
            done,
            value,
          }
        },
      }
    }
    getNonCollectionIterator = function getNonCollectionIterator(
      iterable,
      noPrimordialCollections,
    ) {
      if (isArray(iterable) || isArguments(iterable)) {
        return getArrayIterator(iterable)
      }
      if (isString(iterable)) {
        var i = 0
        return {
          next: function next() {
            var nextIndex = advanceStringIndex(iterable, i)
            var value = $stringSlice(iterable, i, nextIndex)
            i = nextIndex
            return {
              done: nextIndex > iterable.length,
              value,
            }
          },
        }
      }
      if (noPrimordialCollections && typeof iterable['_es6-shim iterator_'] !== 'undefined') {
        return iterable['_es6-shim iterator_']()
      }
    }
    if (!$Map && !$Set) {
      module.exports = function getIterator(iterable) {
        if (iterable != null) {
          return getNonCollectionIterator(iterable, true)
        }
      }
    } else {
      isMap = require_is_map()
      isSet = require_is_set()
      $mapForEach = callBound('Map.prototype.forEach', true)
      $setForEach = callBound('Set.prototype.forEach', true)
      if (typeof process === 'undefined' || !process.versions || !process.versions.node) {
        $mapIterator = callBound('Map.prototype.iterator', true)
        $setIterator = callBound('Set.prototype.iterator', true)
      }
      $mapAtAtIterator =
        callBound('Map.prototype.@@iterator', true) ||
        callBound('Map.prototype._es6-shim iterator_', true)
      $setAtAtIterator =
        callBound('Set.prototype.@@iterator', true) ||
        callBound('Set.prototype._es6-shim iterator_', true)
      getCollectionIterator = function getCollectionIterator(iterable) {
        if (isMap(iterable)) {
          if ($mapIterator) {
            return getStopIterationIterator($mapIterator(iterable))
          }
          if ($mapAtAtIterator) {
            return $mapAtAtIterator(iterable)
          }
          if ($mapForEach) {
            var entries = []
            $mapForEach(iterable, function (v, k) {
              $arrayPush(entries, [k, v])
            })
            return getArrayIterator(entries)
          }
        }
        if (isSet(iterable)) {
          if ($setIterator) {
            return getStopIterationIterator($setIterator(iterable))
          }
          if ($setAtAtIterator) {
            return $setAtAtIterator(iterable)
          }
          if ($setForEach) {
            var values = []
            $setForEach(iterable, function (v) {
              $arrayPush(values, v)
            })
            return getArrayIterator(values)
          }
        }
      }
      module.exports = function getIterator(iterable) {
        return getCollectionIterator(iterable) || getNonCollectionIterator(iterable)
      }
    }
  }
  var $iterator
  var isArray
  var isString
  var GetIntrinsic
  var $Map
  var $Set
  var callBound
  var $arrayPush
  var $charCodeAt
  var $stringSlice
  var advanceStringIndex
  var getArrayIterator
  var getNonCollectionIterator
  var isMap
  var isSet
  var $mapForEach
  var $setForEach
  var $mapIterator
  var $setIterator
  var $mapAtAtIterator
  var $setAtAtIterator
  var getCollectionIterator
})

// node_modules/object-is/implementation.js
var require_implementation5 = __commonJS((exports, module) => {
  var numberIsNaN = function (value) {
    return value !== value
  }
  module.exports = function is(a, b) {
    if (a === 0 && b === 0) {
      return 1 / a === 1 / b
    }
    if (a === b) {
      return true
    }
    if (numberIsNaN(a) && numberIsNaN(b)) {
      return true
    }
    return false
  }
})

// node_modules/object-is/polyfill.js
var require_polyfill3 = __commonJS((exports, module) => {
  var implementation = require_implementation5()
  module.exports = function getPolyfill() {
    return typeof Object.is === 'function' ? Object.is : implementation
  }
})

// node_modules/object-is/shim.js
var require_shim3 = __commonJS((exports, module) => {
  var getPolyfill = require_polyfill3()
  var define = require_define_properties()
  module.exports = function shimObjectIs() {
    var polyfill = getPolyfill()
    define(
      Object,
      { is: polyfill },
      {
        is: function testObjectIs() {
          return Object.is !== polyfill
        },
      },
    )
    return polyfill
  }
})

// node_modules/object-is/index.js
var require_object_is = __commonJS((exports, module) => {
  var define = require_define_properties()
  var callBind = require_call_bind()
  var implementation = require_implementation5()
  var getPolyfill = require_polyfill3()
  var shim = require_shim3()
  var polyfill = callBind(getPolyfill(), Object)
  define(polyfill, {
    getPolyfill,
    implementation,
    shim,
  })
  module.exports = polyfill
})

// node_modules/is-array-buffer/index.js
var require_is_array_buffer = __commonJS((exports, module) => {
  var callBind = require_call_bind()
  var callBound = require_callBound()
  var GetIntrinsic = require_get_intrinsic()
  var $ArrayBuffer = GetIntrinsic('%ArrayBuffer%', true)
  var $byteLength = callBound('ArrayBuffer.prototype.byteLength', true)
  var $toString = callBound('Object.prototype.toString')
  var abSlice = !!$ArrayBuffer && !$byteLength && new $ArrayBuffer(0).slice
  var $abSlice = !!abSlice && callBind(abSlice)
  module.exports =
    $byteLength || $abSlice
      ? function isArrayBuffer(obj) {
          if (!obj || typeof obj !== 'object') {
            return false
          }
          try {
            if ($byteLength) {
              $byteLength(obj)
            } else {
              $abSlice(obj, 0)
            }
            return true
          } catch (e) {
            return false
          }
        }
      : $ArrayBuffer
        ? function isArrayBuffer(obj) {
            return $toString(obj) === '[object ArrayBuffer]'
          }
        : function isArrayBuffer(obj) {
            return false
          }
})

// node_modules/is-date-object/index.js
var require_is_date_object = __commonJS((exports, module) => {
  var getDay = Date.prototype.getDay
  var tryDateObject = function tryDateGetDayCall(value) {
    try {
      getDay.call(value)
      return true
    } catch (e) {
      return false
    }
  }
  var toStr = Object.prototype.toString
  var dateClass = '[object Date]'
  var hasToStringTag = require_shams2()()
  module.exports = function isDateObject(value) {
    if (typeof value !== 'object' || value === null) {
      return false
    }
    return hasToStringTag ? tryDateObject(value) : toStr.call(value) === dateClass
  }
})

// node_modules/is-regex/index.js
var require_is_regex = __commonJS((exports, module) => {
  var callBound = require_callBound()
  var hasToStringTag = require_shams2()()
  var has
  var $exec
  var isRegexMarker
  var badStringifier
  if (hasToStringTag) {
    has = callBound('Object.prototype.hasOwnProperty')
    $exec = callBound('RegExp.prototype.exec')
    isRegexMarker = {}
    throwRegexMarker = function () {
      throw isRegexMarker
    }
    badStringifier = {
      toString: throwRegexMarker,
      valueOf: throwRegexMarker,
    }
    if (typeof Symbol.toPrimitive === 'symbol') {
      badStringifier[Symbol.toPrimitive] = throwRegexMarker
    }
  }
  var throwRegexMarker
  var $toString = callBound('Object.prototype.toString')
  var gOPD = Object.getOwnPropertyDescriptor
  var regexClass = '[object RegExp]'
  module.exports = hasToStringTag
    ? function isRegex(value) {
        if (!value || typeof value !== 'object') {
          return false
        }
        var descriptor = gOPD(value, 'lastIndex')
        var hasLastIndexDataProperty = descriptor && has(descriptor, 'value')
        if (!hasLastIndexDataProperty) {
          return false
        }
        try {
          $exec(value, badStringifier)
        } catch (e) {
          return e === isRegexMarker
        }
      }
    : function isRegex(value) {
        if (!value || (typeof value !== 'object' && typeof value !== 'function')) {
          return false
        }
        return $toString(value) === regexClass
      }
})

// node_modules/is-shared-array-buffer/index.js
var require_is_shared_array_buffer = __commonJS((exports, module) => {
  var callBound = require_callBound()
  var $byteLength = callBound('SharedArrayBuffer.prototype.byteLength', true)
  module.exports = $byteLength
    ? function isSharedArrayBuffer(obj) {
        if (!obj || typeof obj !== 'object') {
          return false
        }
        try {
          $byteLength(obj)
          return true
        } catch (e) {
          return false
        }
      }
    : function isSharedArrayBuffer(obj) {
        return false
      }
})

// node_modules/is-number-object/index.js
var require_is_number_object = __commonJS((exports, module) => {
  var numToStr = Number.prototype.toString
  var tryNumberObject = function tryNumberObject(value) {
    try {
      numToStr.call(value)
      return true
    } catch (e) {
      return false
    }
  }
  var toStr = Object.prototype.toString
  var numClass = '[object Number]'
  var hasToStringTag = require_shams2()()
  module.exports = function isNumberObject(value) {
    if (typeof value === 'number') {
      return true
    }
    if (typeof value !== 'object') {
      return false
    }
    return hasToStringTag ? tryNumberObject(value) : toStr.call(value) === numClass
  }
})

// node_modules/is-boolean-object/index.js
var require_is_boolean_object = __commonJS((exports, module) => {
  var callBound = require_callBound()
  var $boolToStr = callBound('Boolean.prototype.toString')
  var $toString = callBound('Object.prototype.toString')
  var tryBooleanObject = function booleanBrandCheck(value) {
    try {
      $boolToStr(value)
      return true
    } catch (e) {
      return false
    }
  }
  var boolClass = '[object Boolean]'
  var hasToStringTag = require_shams2()()
  module.exports = function isBoolean(value) {
    if (typeof value === 'boolean') {
      return true
    }
    if (value === null || typeof value !== 'object') {
      return false
    }
    return hasToStringTag && Symbol.toStringTag in value
      ? tryBooleanObject(value)
      : $toString(value) === boolClass
  }
})

// node_modules/is-symbol/index.js
var require_is_symbol = __commonJS((exports, module) => {
  var toStr = Object.prototype.toString
  var hasSymbols = require_has_symbols()()
  if (hasSymbols) {
    symToStr = Symbol.prototype.toString
    symStringRegex = /^Symbol\(.*\)$/
    isSymbolObject = function isRealSymbolObject(value) {
      if (typeof value.valueOf() !== 'symbol') {
        return false
      }
      return symStringRegex.test(symToStr.call(value))
    }
    module.exports = function isSymbol(value) {
      if (typeof value === 'symbol') {
        return true
      }
      if (toStr.call(value) !== '[object Symbol]') {
        return false
      }
      try {
        return isSymbolObject(value)
      } catch (e) {
        return false
      }
    }
  } else {
    module.exports = function isSymbol(value) {
      return false
    }
  }
  var symToStr
  var symStringRegex
  var isSymbolObject
})

// node_modules/has-bigints/index.js
var require_has_bigints = __commonJS((exports, module) => {
  var $BigInt = typeof BigInt !== 'undefined' && BigInt
  module.exports = function hasNativeBigInts() {
    return (
      typeof $BigInt === 'function' &&
      typeof BigInt === 'function' &&
      typeof $BigInt(42) === 'bigint' &&
      typeof BigInt(42) === 'bigint'
    )
  }
})

// node_modules/is-bigint/index.js
var require_is_bigint = __commonJS((exports, module) => {
  var hasBigInts = require_has_bigints()()
  if (hasBigInts) {
    bigIntValueOf = BigInt.prototype.valueOf
    tryBigInt = function tryBigIntObject(value) {
      try {
        bigIntValueOf.call(value)
        return true
      } catch (e) {}
      return false
    }
    module.exports = function isBigInt(value) {
      if (
        value === null ||
        typeof value === 'undefined' ||
        typeof value === 'boolean' ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'symbol' ||
        typeof value === 'function'
      ) {
        return false
      }
      if (typeof value === 'bigint') {
        return true
      }
      return tryBigInt(value)
    }
  } else {
    module.exports = function isBigInt(value) {
      return false
    }
  }
  var bigIntValueOf
  var tryBigInt
})

// node_modules/which-boxed-primitive/index.js
var require_which_boxed_primitive = __commonJS((exports, module) => {
  var isString = require_is_string()
  var isNumber = require_is_number_object()
  var isBoolean = require_is_boolean_object()
  var isSymbol = require_is_symbol()
  var isBigInt = require_is_bigint()
  module.exports = function whichBoxedPrimitive(value) {
    if (value == null || (typeof value !== 'object' && typeof value !== 'function')) {
      return null
    }
    if (isString(value)) {
      return 'String'
    }
    if (isNumber(value)) {
      return 'Number'
    }
    if (isBoolean(value)) {
      return 'Boolean'
    }
    if (isSymbol(value)) {
      return 'Symbol'
    }
    if (isBigInt(value)) {
      return 'BigInt'
    }
  }
})

// node_modules/is-weakmap/index.js
var require_is_weakmap = __commonJS((exports, module) => {
  var $WeakMap = typeof WeakMap === 'function' && WeakMap.prototype ? WeakMap : null
  var $WeakSet = typeof WeakSet === 'function' && WeakSet.prototype ? WeakSet : null
  var exported
  if (!$WeakMap) {
    exported = function isWeakMap(x) {
      return false
    }
  }
  var $mapHas = $WeakMap ? $WeakMap.prototype.has : null
  var $setHas = $WeakSet ? $WeakSet.prototype.has : null
  if (!exported && !$mapHas) {
    exported = function isWeakMap(x) {
      return false
    }
  }
  module.exports =
    exported ||
    function isWeakMap(x) {
      if (!x || typeof x !== 'object') {
        return false
      }
      try {
        $mapHas.call(x, $mapHas)
        if ($setHas) {
          try {
            $setHas.call(x, $setHas)
          } catch (e) {
            return true
          }
        }
        return x instanceof $WeakMap
      } catch (e) {}
      return false
    }
})

// node_modules/is-weakset/index.js
var require_is_weakset = __commonJS((exports, module) => {
  var GetIntrinsic = require_get_intrinsic()
  var callBound = require_callBound()
  var $WeakSet = GetIntrinsic('%WeakSet%', true)
  var $setHas = callBound('WeakSet.prototype.has', true)
  if ($setHas) {
    $mapHas = callBound('WeakMap.prototype.has', true)
    module.exports = function isWeakSet(x) {
      if (!x || typeof x !== 'object') {
        return false
      }
      try {
        $setHas(x, $setHas)
        if ($mapHas) {
          try {
            $mapHas(x, $mapHas)
          } catch (e) {
            return true
          }
        }
        return x instanceof $WeakSet
      } catch (e) {}
      return false
    }
  } else {
    module.exports = function isWeakSet(x) {
      return false
    }
  }
  var $mapHas
})

// node_modules/which-collection/index.js
var require_which_collection = __commonJS((exports, module) => {
  var isMap = require_is_map()
  var isSet = require_is_set()
  var isWeakMap = require_is_weakmap()
  var isWeakSet = require_is_weakset()
  module.exports = function whichCollection(value) {
    if (value && typeof value === 'object') {
      if (isMap(value)) {
        return 'Map'
      }
      if (isSet(value)) {
        return 'Set'
      }
      if (isWeakMap(value)) {
        return 'WeakMap'
      }
      if (isWeakSet(value)) {
        return 'WeakSet'
      }
    }
    return false
  }
})

// node_modules/is-callable/index.js
var require_is_callable = __commonJS((exports, module) => {
  var fnToStr = Function.prototype.toString
  var reflectApply = typeof Reflect === 'object' && Reflect !== null && Reflect.apply
  var badArrayLike
  var isCallableMarker
  if (typeof reflectApply === 'function' && typeof Object.defineProperty === 'function') {
    try {
      badArrayLike = Object.defineProperty({}, 'length', {
        get: function () {
          throw isCallableMarker
        },
      })
      isCallableMarker = {}
      reflectApply(
        function () {
          throw 42
        },
        null,
        badArrayLike,
      )
    } catch (_) {
      if (_ !== isCallableMarker) {
        reflectApply = null
      }
    }
  } else {
    reflectApply = null
  }
  var constructorRegex = /^\s*class\b/
  var isES6ClassFn = function isES6ClassFunction(value) {
    try {
      var fnStr = fnToStr.call(value)
      return constructorRegex.test(fnStr)
    } catch (e) {
      return false
    }
  }
  var tryFunctionObject = function tryFunctionToStr(value) {
    try {
      if (isES6ClassFn(value)) {
        return false
      }
      fnToStr.call(value)
      return true
    } catch (e) {
      return false
    }
  }
  var toStr = Object.prototype.toString
  var objectClass = '[object Object]'
  var fnClass = '[object Function]'
  var genClass = '[object GeneratorFunction]'
  var ddaClass = '[object HTMLAllCollection]'
  var ddaClass2 = '[object HTML document.all class]'
  var ddaClass3 = '[object HTMLCollection]'
  var hasToStringTag = typeof Symbol === 'function' && !!Symbol.toStringTag
  var isIE68 = !(0 in [,])
  var isDDA = function isDocumentDotAll() {
    return false
  }
  if (typeof document === 'object') {
    all = document.all
    if (toStr.call(all) === toStr.call(document.all)) {
      isDDA = function isDocumentDotAll(value) {
        if ((isIE68 || !value) && (typeof value === 'undefined' || typeof value === 'object')) {
          try {
            var str = toStr.call(value)
            return (
              (str === ddaClass || str === ddaClass2 || str === ddaClass3 || str === objectClass) &&
              value('') == null
            )
          } catch (e) {}
        }
        return false
      }
    }
  }
  var all
  module.exports = reflectApply
    ? function isCallable(value) {
        if (isDDA(value)) {
          return true
        }
        if (!value) {
          return false
        }
        if (typeof value !== 'function' && typeof value !== 'object') {
          return false
        }
        try {
          reflectApply(value, null, badArrayLike)
        } catch (e) {
          if (e !== isCallableMarker) {
            return false
          }
        }
        return !isES6ClassFn(value) && tryFunctionObject(value)
      }
    : function isCallable(value) {
        if (isDDA(value)) {
          return true
        }
        if (!value) {
          return false
        }
        if (typeof value !== 'function' && typeof value !== 'object') {
          return false
        }
        if (hasToStringTag) {
          return tryFunctionObject(value)
        }
        if (isES6ClassFn(value)) {
          return false
        }
        var strClass = toStr.call(value)
        if (strClass !== fnClass && strClass !== genClass && !/^\[object HTML/.test(strClass)) {
          return false
        }
        return tryFunctionObject(value)
      }
})

// node_modules/for-each/index.js
var require_for_each = __commonJS((exports, module) => {
  var isCallable = require_is_callable()
  var toStr = Object.prototype.toString
  var hasOwnProperty = Object.prototype.hasOwnProperty
  var forEachArray = function forEachArray(array, iterator, receiver) {
    for (var i = 0, len = array.length; i < len; i++) {
      if (hasOwnProperty.call(array, i)) {
        if (receiver == null) {
          iterator(array[i], i, array)
        } else {
          iterator.call(receiver, array[i], i, array)
        }
      }
    }
  }
  var forEachString = function forEachString(string, iterator, receiver) {
    for (var i = 0, len = string.length; i < len; i++) {
      if (receiver == null) {
        iterator(string.charAt(i), i, string)
      } else {
        iterator.call(receiver, string.charAt(i), i, string)
      }
    }
  }
  var forEachObject = function forEachObject(object, iterator, receiver) {
    for (var k in object) {
      if (hasOwnProperty.call(object, k)) {
        if (receiver == null) {
          iterator(object[k], k, object)
        } else {
          iterator.call(receiver, object[k], k, object)
        }
      }
    }
  }
  var forEach = function forEach(list, iterator, thisArg) {
    if (!isCallable(iterator)) {
      throw new TypeError('iterator must be a function')
    }
    var receiver
    if (arguments.length >= 3) {
      receiver = thisArg
    }
    if (toStr.call(list) === '[object Array]') {
      forEachArray(list, iterator, receiver)
    } else if (typeof list === 'string') {
      forEachString(list, iterator, receiver)
    } else {
      forEachObject(list, iterator, receiver)
    }
  }
  module.exports = forEach
})

// node_modules/possible-typed-array-names/index.js
var require_possible_typed_array_names = __commonJS((exports, module) => {
  module.exports = [
    'Float32Array',
    'Float64Array',
    'Int8Array',
    'Int16Array',
    'Int32Array',
    'Uint8Array',
    'Uint8ClampedArray',
    'Uint16Array',
    'Uint32Array',
    'BigInt64Array',
    'BigUint64Array',
  ]
})

// node_modules/available-typed-arrays/index.js
var require_available_typed_arrays = __commonJS((exports, module) => {
  var possibleNames = require_possible_typed_array_names()
  var g = typeof globalThis === 'undefined' ? global : globalThis
  module.exports = function availableTypedArrays() {
    var out = []
    for (var i = 0; i < possibleNames.length; i++) {
      if (typeof g[possibleNames[i]] === 'function') {
        out[out.length] = possibleNames[i]
      }
    }
    return out
  }
})

// node_modules/which-typed-array/index.js
var require_which_typed_array = __commonJS((exports, module) => {
  var forEach = require_for_each()
  var availableTypedArrays = require_available_typed_arrays()
  var callBind = require_call_bind()
  var callBound = require_callBound()
  var gOPD = require_gopd()
  var $toString = callBound('Object.prototype.toString')
  var hasToStringTag = require_shams2()()
  var g = typeof globalThis === 'undefined' ? global : globalThis
  var typedArrays = availableTypedArrays()
  var $slice = callBound('String.prototype.slice')
  var getPrototypeOf = Object.getPrototypeOf
  var $indexOf =
    callBound('Array.prototype.indexOf', true) ||
    function indexOf(array, value) {
      for (var i = 0; i < array.length; i += 1) {
        if (array[i] === value) {
          return i
        }
      }
      return -1
    }
  var cache = { __proto__: null }
  if (hasToStringTag && gOPD && getPrototypeOf) {
    forEach(typedArrays, function (typedArray) {
      var arr = new g[typedArray]()
      if (Symbol.toStringTag in arr) {
        var proto = getPrototypeOf(arr)
        var descriptor = gOPD(proto, Symbol.toStringTag)
        if (!descriptor) {
          var superProto = getPrototypeOf(proto)
          descriptor = gOPD(superProto, Symbol.toStringTag)
        }
        cache['$' + typedArray] = callBind(descriptor.get)
      }
    })
  } else {
    forEach(typedArrays, function (typedArray) {
      var arr = new g[typedArray]()
      var fn = arr.slice || arr.set
      if (fn) {
        cache['$' + typedArray] = callBind(fn)
      }
    })
  }
  var tryTypedArrays = function tryAllTypedArrays(value) {
    var found = false
    forEach(cache, function (getter, typedArray) {
      if (!found) {
        try {
          if ('$' + getter(value) === typedArray) {
            found = $slice(typedArray, 1)
          }
        } catch (e) {}
      }
    })
    return found
  }
  var trySlices = function tryAllSlices(value) {
    var found = false
    forEach(cache, function (getter, name) {
      if (!found) {
        try {
          getter(value)
          found = $slice(name, 1)
        } catch (e) {}
      }
    })
    return found
  }
  module.exports = function whichTypedArray(value) {
    if (!value || typeof value !== 'object') {
      return false
    }
    if (!hasToStringTag) {
      var tag = $slice($toString(value), 8, -1)
      if ($indexOf(typedArrays, tag) > -1) {
        return tag
      }
      if (tag !== 'Object') {
        return false
      }
      return trySlices(value)
    }
    if (!gOPD) {
      return null
    }
    return tryTypedArrays(value)
  }
})

// node_modules/array-buffer-byte-length/index.js
var require_array_buffer_byte_length = __commonJS((exports, module) => {
  var callBound = require_callBound()
  var $byteLength = callBound('ArrayBuffer.prototype.byteLength', true)
  var isArrayBuffer = require_is_array_buffer()
  module.exports = function byteLength(ab) {
    if (!isArrayBuffer(ab)) {
      return NaN
    }
    return $byteLength ? $byteLength(ab) : ab.byteLength
  }
})

// node_modules/deep-equal/index.js
var require_deep_equal = __commonJS((exports, module) => {
  var setHasEqualElement = function (set, val1, opts, channel) {
    var i = getIterator(set)
    var result
    while ((result = i.next()) && !result.done) {
      if (internalDeepEqual(val1, result.value, opts, channel)) {
        $setDelete(set, result.value)
        return true
      }
    }
    return false
  }
  var findLooseMatchingPrimitives = function (prim) {
    if (typeof prim === 'undefined') {
      return null
    }
    if (typeof prim === 'object') {
      return
    }
    if (typeof prim === 'symbol') {
      return false
    }
    if (typeof prim === 'string' || typeof prim === 'number') {
      return +prim === +prim
    }
    return true
  }
  var mapMightHaveLoosePrim = function (a, b, prim, item, opts, channel) {
    var altValue = findLooseMatchingPrimitives(prim)
    if (altValue != null) {
      return altValue
    }
    var curB = $mapGet(b, altValue)
    var looseOpts = assign({}, opts, { strict: false })
    if (
      (typeof curB === 'undefined' && !$mapHas(b, altValue)) ||
      !internalDeepEqual(item, curB, looseOpts, channel)
    ) {
      return false
    }
    return !$mapHas(a, altValue) && internalDeepEqual(item, curB, looseOpts, channel)
  }
  var setMightHaveLoosePrim = function (a, b, prim) {
    var altValue = findLooseMatchingPrimitives(prim)
    if (altValue != null) {
      return altValue
    }
    return $setHas(b, altValue) && !$setHas(a, altValue)
  }
  var mapHasEqualEntry = function (set, map, key1, item1, opts, channel) {
    var i = getIterator(set)
    var result
    var key2
    while ((result = i.next()) && !result.done) {
      key2 = result.value
      if (
        internalDeepEqual(key1, key2, opts, channel) &&
        internalDeepEqual(item1, $mapGet(map, key2), opts, channel)
      ) {
        $setDelete(set, key2)
        return true
      }
    }
    return false
  }
  var internalDeepEqual = function (actual, expected, options, channel) {
    var opts = options || {}
    if (opts.strict ? is(actual, expected) : actual === expected) {
      return true
    }
    var actualBoxed = whichBoxedPrimitive(actual)
    var expectedBoxed = whichBoxedPrimitive(expected)
    if (actualBoxed !== expectedBoxed) {
      return false
    }
    if (!actual || !expected || (typeof actual !== 'object' && typeof expected !== 'object')) {
      return opts.strict ? is(actual, expected) : actual == expected
    }
    var hasActual = channel.has(actual)
    var hasExpected = channel.has(expected)
    var sentinel
    if (hasActual && hasExpected) {
      if (channel.get(actual) === channel.get(expected)) {
        return true
      }
    } else {
      sentinel = {}
    }
    if (!hasActual) {
      channel.set(actual, sentinel)
    }
    if (!hasExpected) {
      channel.set(expected, sentinel)
    }
    return objEquiv(actual, expected, opts, channel)
  }
  var isBuffer = function (x) {
    if (!x || typeof x !== 'object' || typeof x.length !== 'number') {
      return false
    }
    if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
      return false
    }
    if (x.length > 0 && typeof x[0] !== 'number') {
      return false
    }
    return !!(x.constructor && x.constructor.isBuffer && x.constructor.isBuffer(x))
  }
  var setEquiv = function (a, b, opts, channel) {
    if ($setSize(a) !== $setSize(b)) {
      return false
    }
    var iA = getIterator(a)
    var iB = getIterator(b)
    var resultA
    var resultB
    var set
    while ((resultA = iA.next()) && !resultA.done) {
      if (resultA.value && typeof resultA.value === 'object') {
        if (!set) {
          set = new $Set()
        }
        $setAdd(set, resultA.value)
      } else if (!$setHas(b, resultA.value)) {
        if (opts.strict) {
          return false
        }
        if (!setMightHaveLoosePrim(a, b, resultA.value)) {
          return false
        }
        if (!set) {
          set = new $Set()
        }
        $setAdd(set, resultA.value)
      }
    }
    if (set) {
      while ((resultB = iB.next()) && !resultB.done) {
        if (resultB.value && typeof resultB.value === 'object') {
          if (!setHasEqualElement(set, resultB.value, opts.strict, channel)) {
            return false
          }
        } else if (
          !opts.strict &&
          !$setHas(a, resultB.value) &&
          !setHasEqualElement(set, resultB.value, opts.strict, channel)
        ) {
          return false
        }
      }
      return $setSize(set) === 0
    }
    return true
  }
  var mapEquiv = function (a, b, opts, channel) {
    if ($mapSize(a) !== $mapSize(b)) {
      return false
    }
    var iA = getIterator(a)
    var iB = getIterator(b)
    var resultA
    var resultB
    var set
    var key
    var item1
    var item2
    while ((resultA = iA.next()) && !resultA.done) {
      key = resultA.value[0]
      item1 = resultA.value[1]
      if (key && typeof key === 'object') {
        if (!set) {
          set = new $Set()
        }
        $setAdd(set, key)
      } else {
        item2 = $mapGet(b, key)
        if (
          (typeof item2 === 'undefined' && !$mapHas(b, key)) ||
          !internalDeepEqual(item1, item2, opts, channel)
        ) {
          if (opts.strict) {
            return false
          }
          if (!mapMightHaveLoosePrim(a, b, key, item1, opts, channel)) {
            return false
          }
          if (!set) {
            set = new $Set()
          }
          $setAdd(set, key)
        }
      }
    }
    if (set) {
      while ((resultB = iB.next()) && !resultB.done) {
        key = resultB.value[0]
        item2 = resultB.value[1]
        if (key && typeof key === 'object') {
          if (!mapHasEqualEntry(set, a, key, item2, opts, channel)) {
            return false
          }
        } else if (
          !opts.strict &&
          (!a.has(key) || !internalDeepEqual($mapGet(a, key), item2, opts, channel)) &&
          !mapHasEqualEntry(set, a, key, item2, assign({}, opts, { strict: false }), channel)
        ) {
          return false
        }
      }
      return $setSize(set) === 0
    }
    return true
  }
  var objEquiv = function (a, b, opts, channel) {
    var i, key
    if (typeof a !== typeof b) {
      return false
    }
    if (a == null || b == null) {
      return false
    }
    if ($objToString(a) !== $objToString(b)) {
      return false
    }
    if (isArguments(a) !== isArguments(b)) {
      return false
    }
    var aIsArray = isArray(a)
    var bIsArray = isArray(b)
    if (aIsArray !== bIsArray) {
      return false
    }
    var aIsError = a instanceof Error
    var bIsError = b instanceof Error
    if (aIsError !== bIsError) {
      return false
    }
    if (aIsError || bIsError) {
      if (a.name !== b.name || a.message !== b.message) {
        return false
      }
    }
    var aIsRegex = isRegex(a)
    var bIsRegex = isRegex(b)
    if (aIsRegex !== bIsRegex) {
      return false
    }
    if ((aIsRegex || bIsRegex) && (a.source !== b.source || flags(a) !== flags(b))) {
      return false
    }
    var aIsDate = isDate(a)
    var bIsDate = isDate(b)
    if (aIsDate !== bIsDate) {
      return false
    }
    if (aIsDate || bIsDate) {
      if ($getTime(a) !== $getTime(b)) {
        return false
      }
    }
    if (opts.strict && gPO && gPO(a) !== gPO(b)) {
      return false
    }
    var aWhich = whichTypedArray(a)
    var bWhich = whichTypedArray(b)
    if (aWhich !== bWhich) {
      return false
    }
    if (aWhich || bWhich) {
      if (a.length !== b.length) {
        return false
      }
      for (i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
          return false
        }
      }
      return true
    }
    var aIsBuffer = isBuffer(a)
    var bIsBuffer = isBuffer(b)
    if (aIsBuffer !== bIsBuffer) {
      return false
    }
    if (aIsBuffer || bIsBuffer) {
      if (a.length !== b.length) {
        return false
      }
      for (i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
          return false
        }
      }
      return true
    }
    var aIsArrayBuffer = isArrayBuffer(a)
    var bIsArrayBuffer = isArrayBuffer(b)
    if (aIsArrayBuffer !== bIsArrayBuffer) {
      return false
    }
    if (aIsArrayBuffer || bIsArrayBuffer) {
      if (byteLength(a) !== byteLength(b)) {
        return false
      }
      return (
        typeof Uint8Array === 'function' &&
        internalDeepEqual(new Uint8Array(a), new Uint8Array(b), opts, channel)
      )
    }
    var aIsSAB = isSharedArrayBuffer(a)
    var bIsSAB = isSharedArrayBuffer(b)
    if (aIsSAB !== bIsSAB) {
      return false
    }
    if (aIsSAB || bIsSAB) {
      if (sabByteLength(a) !== sabByteLength(b)) {
        return false
      }
      return (
        typeof Uint8Array === 'function' &&
        internalDeepEqual(new Uint8Array(a), new Uint8Array(b), opts, channel)
      )
    }
    if (typeof a !== typeof b) {
      return false
    }
    var ka = objectKeys(a)
    var kb = objectKeys(b)
    if (ka.length !== kb.length) {
      return false
    }
    ka.sort()
    kb.sort()
    for (i = ka.length - 1; i >= 0; i--) {
      if (ka[i] != kb[i]) {
        return false
      }
    }
    for (i = ka.length - 1; i >= 0; i--) {
      key = ka[i]
      if (!internalDeepEqual(a[key], b[key], opts, channel)) {
        return false
      }
    }
    var aCollection = whichCollection(a)
    var bCollection = whichCollection(b)
    if (aCollection !== bCollection) {
      return false
    }
    if (aCollection === 'Set' || bCollection === 'Set') {
      return setEquiv(a, b, opts, channel)
    }
    if (aCollection === 'Map') {
      return mapEquiv(a, b, opts, channel)
    }
    return true
  }
  var assign = require_object()
  var callBound = require_callBound()
  var flags = require_regexp_prototype()
  var GetIntrinsic = require_get_intrinsic()
  var getIterator = require_es_get_iterator()
  var getSideChannel = require_side_channel()
  var is = require_object_is()
  var isArguments = require_is_arguments()
  var isArray = require_isarray()
  var isArrayBuffer = require_is_array_buffer()
  var isDate = require_is_date_object()
  var isRegex = require_is_regex()
  var isSharedArrayBuffer = require_is_shared_array_buffer()
  var objectKeys = require_object_keys()
  var whichBoxedPrimitive = require_which_boxed_primitive()
  var whichCollection = require_which_collection()
  var whichTypedArray = require_which_typed_array()
  var byteLength = require_array_buffer_byte_length()
  var sabByteLength = callBound('SharedArrayBuffer.prototype.byteLength', true)
  var $getTime = callBound('Date.prototype.getTime')
  var gPO = Object.getPrototypeOf
  var $objToString = callBound('Object.prototype.toString')
  var $Set = GetIntrinsic('%Set%', true)
  var $mapHas = callBound('Map.prototype.has', true)
  var $mapGet = callBound('Map.prototype.get', true)
  var $mapSize = callBound('Map.prototype.size', true)
  var $setAdd = callBound('Set.prototype.add', true)
  var $setDelete = callBound('Set.prototype.delete', true)
  var $setHas = callBound('Set.prototype.has', true)
  var $setSize = callBound('Set.prototype.size', true)
  module.exports = function deepEqual(a, b, opts) {
    return internalDeepEqual(a, b, opts, getSideChannel())
  }
})

// node_modules/@turf/helpers/dist/esm/index.js
var import_deep_equal = __toESM(require_deep_equal(), 1)
var sameLength = function (g1, g2) {
  return g1.coordinates ? g1.coordinates.length === g2.coordinates.length : g1.length === g2.length
}
var explode = function (g) {
  return g.coordinates.map((part) => ({
    type: g.type.replace('Multi', ''),
    coordinates: part,
  }))
}
var feature = function (geom, properties, options = {}) {
  const feat = { type: 'Feature' }
  if (options.id === 0 || options.id) {
    feat.id = options.id
  }
  if (options.bbox) {
    feat.bbox = options.bbox
  }
  feat.properties = properties || {}
  feat.geometry = geom
  return feat
}
var geometry = function (type, coordinates, _options = {}) {
  switch (type) {
    case 'Point':
      return point(coordinates).geometry
    case 'LineString':
      return lineString(coordinates).geometry
    case 'Polygon':
      return polygon(coordinates).geometry
    case 'MultiPoint':
      return multiPoint(coordinates).geometry
    case 'MultiLineString':
      return multiLineString(coordinates).geometry
    case 'MultiPolygon':
      return multiPolygon(coordinates).geometry
    default:
      throw new Error(type + ' is invalid')
  }
}
var point = function (coordinates, properties, options = {}) {
  if (!coordinates) {
    throw new Error('coordinates is required')
  }
  if (!Array.isArray(coordinates)) {
    throw new Error('coordinates must be an Array')
  }
  if (coordinates.length < 2) {
    throw new Error('coordinates must be at least 2 numbers long')
  }
  if (!isNumber(coordinates[0]) || !isNumber(coordinates[1])) {
    throw new Error('coordinates must contain numbers')
  }
  const geom = {
    type: 'Point',
    coordinates,
  }
  return feature(geom, properties, options)
}
var points = function (coordinates, properties, options = {}) {
  return featureCollection(
    coordinates.map((coords) => {
      return point(coords, properties)
    }),
    options,
  )
}
var polygon = function (coordinates, properties, options = {}) {
  for (const ring of coordinates) {
    if (ring.length < 4) {
      throw new Error('Each LinearRing of a Polygon must have 4 or more Positions.')
    }
    if (ring[ring.length - 1].length !== ring[0].length) {
      throw new Error('First and last Position are not equivalent.')
    }
    for (let j = 0; j < ring[ring.length - 1].length; j++) {
      if (ring[ring.length - 1][j] !== ring[0][j]) {
        throw new Error('First and last Position are not equivalent.')
      }
    }
  }
  const geom = {
    type: 'Polygon',
    coordinates,
  }
  return feature(geom, properties, options)
}
var polygons = function (coordinates, properties, options = {}) {
  return featureCollection(
    coordinates.map((coords) => {
      return polygon(coords, properties)
    }),
    options,
  )
}
var lineString = function (coordinates, properties, options = {}) {
  if (coordinates.length < 2) {
    throw new Error('coordinates must be an array of two or more positions')
  }
  const geom = {
    type: 'LineString',
    coordinates,
  }
  return feature(geom, properties, options)
}
var lineStrings = function (coordinates, properties, options = {}) {
  return featureCollection(
    coordinates.map((coords) => {
      return lineString(coords, properties)
    }),
    options,
  )
}
var featureCollection = function (features, options = {}) {
  const fc = { type: 'FeatureCollection' }
  if (options.id) {
    fc.id = options.id
  }
  if (options.bbox) {
    fc.bbox = options.bbox
  }
  fc.features = features
  return fc
}
var multiLineString = function (coordinates, properties, options = {}) {
  const geom = {
    type: 'MultiLineString',
    coordinates,
  }
  return feature(geom, properties, options)
}
var multiPoint = function (coordinates, properties, options = {}) {
  const geom = {
    type: 'MultiPoint',
    coordinates,
  }
  return feature(geom, properties, options)
}
var multiPolygon = function (coordinates, properties, options = {}) {
  const geom = {
    type: 'MultiPolygon',
    coordinates,
  }
  return feature(geom, properties, options)
}
var geometryCollection = function (geometries, properties, options = {}) {
  const geom = {
    type: 'GeometryCollection',
    geometries,
  }
  return feature(geom, properties, options)
}
var round = function (num, precision = 0) {
  if (precision && !(precision >= 0)) {
    throw new Error('precision must be a positive number')
  }
  const multiplier = Math.pow(10, precision || 0)
  return Math.round(num * multiplier) / multiplier
}
var radiansToLength = function (radians, units = 'kilometers') {
  const factor = factors[units]
  if (!factor) {
    throw new Error(units + ' units is invalid')
  }
  return radians * factor
}
var lengthToRadians = function (distance, units = 'kilometers') {
  const factor = factors[units]
  if (!factor) {
    throw new Error(units + ' units is invalid')
  }
  return distance / factor
}
var lengthToDegrees = function (distance, units) {
  return radiansToDegrees(lengthToRadians(distance, units))
}
var bearingToAzimuth = function (bearing) {
  let angle = bearing % 360
  if (angle < 0) {
    angle += 360
  }
  return angle
}
var radiansToDegrees = function (radians) {
  const degrees = radians % (2 * Math.PI)
  return (degrees * 180) / Math.PI
}
var degreesToRadians = function (degrees) {
  const radians = degrees % 360
  return (radians * Math.PI) / 180
}
var convertLength = function (length, originalUnit = 'kilometers', finalUnit = 'kilometers') {
  if (!(length >= 0)) {
    throw new Error('length must be a positive number')
  }
  return radiansToLength(lengthToRadians(length, originalUnit), finalUnit)
}
var convertArea = function (area, originalUnit = 'meters', finalUnit = 'kilometers') {
  if (!(area >= 0)) {
    throw new Error('area must be a positive number')
  }
  const startFactor = areaFactors[originalUnit]
  if (!startFactor) {
    throw new Error('invalid original units')
  }
  const finalFactor = areaFactors[finalUnit]
  if (!finalFactor) {
    throw new Error('invalid final units')
  }
  return (area / startFactor) * finalFactor
}
var isNumber = function (num) {
  return !isNaN(num) && num !== null && !Array.isArray(num)
}
var isObject = function (input) {
  return input !== null && typeof input === 'object' && !Array.isArray(input)
}
var validateBBox = function (bbox) {
  if (!bbox) {
    throw new Error('bbox is required')
  }
  if (!Array.isArray(bbox)) {
    throw new Error('bbox must be an Array')
  }
  if (bbox.length !== 4 && bbox.length !== 6) {
    throw new Error('bbox must be an Array of 4 or 6 numbers')
  }
  bbox.forEach((num) => {
    if (!isNumber(num)) {
      throw new Error('bbox must only contain numbers')
    }
  })
}
var validateId = function (id) {
  if (!id) {
    throw new Error('id is required')
  }
  if (['string', 'number'].indexOf(typeof id) === -1) {
    throw new Error('id must be a number or a string')
  }
}
var __defProp2 = Object.defineProperty
var __name = (target, value) => __defProp2(target, 'name', { value, configurable: true })
var _GeojsonEquality = class _GeojsonEquality2 {
  constructor(opts) {
    this.direction = false
    this.compareProperties = true
    var _a, _b, _c
    this.precision = 10 ** -((_a = opts == null ? undefined : opts.precision) != null ? _a : 17)
    this.direction = (_b = opts == null ? undefined : opts.direction) != null ? _b : false
    this.compareProperties =
      (_c = opts == null ? undefined : opts.compareProperties) != null ? _c : true
  }
  compare(g1, g2) {
    if (g1.type !== g2.type) {
      return false
    }
    if (!sameLength(g1, g2)) {
      return false
    }
    switch (g1.type) {
      case 'Point':
        return this.compareCoord(g1.coordinates, g2.coordinates)
      case 'LineString':
        return this.compareLine(g1.coordinates, g2.coordinates)
      case 'Polygon':
        return this.comparePolygon(g1, g2)
      case 'GeometryCollection':
        return this.compareGeometryCollection(g1, g2)
      case 'Feature':
        return this.compareFeature(g1, g2)
      case 'FeatureCollection':
        return this.compareFeatureCollection(g1, g2)
      default:
        if (g1.type.startsWith('Multi')) {
          const g1s = explode(g1)
          const g2s = explode(g2)
          return g1s.every((g1part) => g2s.some((g2part) => this.compare(g1part, g2part)))
        }
    }
    return false
  }
  compareCoord(c1, c2) {
    return c1.length === c2.length && c1.every((c, i) => Math.abs(c - c2[i]) < this.precision)
  }
  compareLine(path1, path2, ind = 0, isPoly = false) {
    if (!sameLength(path1, path2)) {
      return false
    }
    const p1 = path1
    let p2 = path2
    if (isPoly && !this.compareCoord(p1[0], p2[0])) {
      const startIndex = this.fixStartIndex(p2, p1)
      if (!startIndex) {
        return false
      } else {
        p2 = startIndex
      }
    }
    const sameDirection = this.compareCoord(p1[ind], p2[ind])
    if (this.direction || sameDirection) {
      return this.comparePath(p1, p2)
    } else {
      if (this.compareCoord(p1[ind], p2[p2.length - (1 + ind)])) {
        return this.comparePath(p1.slice().reverse(), p2)
      }
      return false
    }
  }
  fixStartIndex(sourcePath, targetPath) {
    let correctPath,
      ind = -1
    for (let i = 0; i < sourcePath.length; i++) {
      if (this.compareCoord(sourcePath[i], targetPath[0])) {
        ind = i
        break
      }
    }
    if (ind >= 0) {
      correctPath = [].concat(
        sourcePath.slice(ind, sourcePath.length),
        sourcePath.slice(1, ind + 1),
      )
    }
    return correctPath
  }
  comparePath(p1, p2) {
    return p1.every((c, i) => this.compareCoord(c, p2[i]))
  }
  comparePolygon(g1, g2) {
    if (this.compareLine(g1.coordinates[0], g2.coordinates[0], 1, true)) {
      const holes1 = g1.coordinates.slice(1, g1.coordinates.length)
      const holes2 = g2.coordinates.slice(1, g2.coordinates.length)
      return holes1.every((h1) => holes2.some((h2) => this.compareLine(h1, h2, 1, true)))
    }
    return false
  }
  compareGeometryCollection(g1, g2) {
    return (
      sameLength(g1.geometries, g2.geometries) &&
      this.compareBBox(g1, g2) &&
      g1.geometries.every((g, i) => this.compare(g, g2.geometries[i]))
    )
  }
  compareFeature(g1, g2) {
    return (
      g1.id === g2.id &&
      (this.compareProperties ? import_deep_equal.default(g1.properties, g2.properties) : true) &&
      this.compareBBox(g1, g2) &&
      this.compare(g1.geometry, g2.geometry)
    )
  }
  compareFeatureCollection(g1, g2) {
    return (
      sameLength(g1.features, g2.features) &&
      this.compareBBox(g1, g2) &&
      g1.features.every((f, i) => this.compare(f, g2.features[i]))
    )
  }
  compareBBox(g1, g2) {
    return (
      Boolean(!g1.bbox && !g2.bbox) ||
      (g1.bbox && g2.bbox ? this.compareCoord(g1.bbox, g2.bbox) : false)
    )
  }
}
__name(_GeojsonEquality, 'GeojsonEquality')
__name(sameLength, 'sameLength')
__name(explode, 'explode')
var earthRadius = 6371008.8
var factors = {
  centimeters: earthRadius * 100,
  centimetres: earthRadius * 100,
  degrees: 360 / (2 * Math.PI),
  feet: earthRadius * 3.28084,
  inches: earthRadius * 39.37,
  kilometers: earthRadius / 1000,
  kilometres: earthRadius / 1000,
  meters: earthRadius,
  metres: earthRadius,
  miles: earthRadius / 1609.344,
  millimeters: earthRadius * 1000,
  millimetres: earthRadius * 1000,
  nauticalmiles: earthRadius / 1852,
  radians: 1,
  yards: earthRadius * 1.0936,
}
var areaFactors = {
  acres: 0.000247105,
  centimeters: 1e4,
  centimetres: 1e4,
  feet: 10.763910417,
  hectares: 0.0001,
  inches: 1550.003100006,
  kilometers: 0.000001,
  kilometres: 0.000001,
  meters: 1,
  metres: 1,
  miles: 0.000000386,
  nauticalmiles: 0.00000029155334959812285,
  millimeters: 1e6,
  millimetres: 1e6,
  yards: 1.195990046,
}
__name(feature, 'feature')
__name(geometry, 'geometry')
__name(point, 'point')
__name(points, 'points')
__name(polygon, 'polygon')
__name(polygons, 'polygons')
__name(lineString, 'lineString')
__name(lineStrings, 'lineStrings')
__name(featureCollection, 'featureCollection')
__name(multiLineString, 'multiLineString')
__name(multiPoint, 'multiPoint')
__name(multiPolygon, 'multiPolygon')
__name(geometryCollection, 'geometryCollection')
__name(round, 'round')
__name(radiansToLength, 'radiansToLength')
__name(lengthToRadians, 'lengthToRadians')
__name(lengthToDegrees, 'lengthToDegrees')
__name(bearingToAzimuth, 'bearingToAzimuth')
__name(radiansToDegrees, 'radiansToDegrees')
__name(degreesToRadians, 'degreesToRadians')
__name(convertLength, 'convertLength')
__name(convertArea, 'convertArea')
__name(isNumber, 'isNumber')
__name(isObject, 'isObject')
__name(validateBBox, 'validateBBox')
__name(validateId, 'validateId')

// node_modules/@turf/meta/dist/esm/index.js
var coordEach = function (geojson, callback, excludeWrapCoord) {
  if (geojson === null) return
  var j,
    k,
    l,
    geometry2,
    stopG,
    coords,
    geometryMaybeCollection,
    wrapShrink = 0,
    coordIndex = 0,
    isGeometryCollection,
    type = geojson.type,
    isFeatureCollection = type === 'FeatureCollection',
    isFeature = type === 'Feature',
    stop = isFeatureCollection ? geojson.features.length : 1
  for (var featureIndex = 0; featureIndex < stop; featureIndex++) {
    geometryMaybeCollection = isFeatureCollection
      ? geojson.features[featureIndex].geometry
      : isFeature
        ? geojson.geometry
        : geojson
    isGeometryCollection = geometryMaybeCollection
      ? geometryMaybeCollection.type === 'GeometryCollection'
      : false
    stopG = isGeometryCollection ? geometryMaybeCollection.geometries.length : 1
    for (var geomIndex = 0; geomIndex < stopG; geomIndex++) {
      var multiFeatureIndex = 0
      var geometryIndex = 0
      geometry2 = isGeometryCollection
        ? geometryMaybeCollection.geometries[geomIndex]
        : geometryMaybeCollection
      if (geometry2 === null) continue
      coords = geometry2.coordinates
      var geomType = geometry2.type
      wrapShrink =
        excludeWrapCoord && (geomType === 'Polygon' || geomType === 'MultiPolygon') ? 1 : 0
      switch (geomType) {
        case null:
          break
        case 'Point':
          if (
            callback(coords, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) === false
          )
            return false
          coordIndex++
          multiFeatureIndex++
          break
        case 'LineString':
        case 'MultiPoint':
          for (j = 0; j < coords.length; j++) {
            if (
              callback(coords[j], coordIndex, featureIndex, multiFeatureIndex, geometryIndex) ===
              false
            )
              return false
            coordIndex++
            if (geomType === 'MultiPoint') multiFeatureIndex++
          }
          if (geomType === 'LineString') multiFeatureIndex++
          break
        case 'Polygon':
        case 'MultiLineString':
          for (j = 0; j < coords.length; j++) {
            for (k = 0; k < coords[j].length - wrapShrink; k++) {
              if (
                callback(
                  coords[j][k],
                  coordIndex,
                  featureIndex,
                  multiFeatureIndex,
                  geometryIndex,
                ) === false
              )
                return false
              coordIndex++
            }
            if (geomType === 'MultiLineString') multiFeatureIndex++
            if (geomType === 'Polygon') geometryIndex++
          }
          if (geomType === 'Polygon') multiFeatureIndex++
          break
        case 'MultiPolygon':
          for (j = 0; j < coords.length; j++) {
            geometryIndex = 0
            for (k = 0; k < coords[j].length; k++) {
              for (l = 0; l < coords[j][k].length - wrapShrink; l++) {
                if (
                  callback(
                    coords[j][k][l],
                    coordIndex,
                    featureIndex,
                    multiFeatureIndex,
                    geometryIndex,
                  ) === false
                )
                  return false
                coordIndex++
              }
              geometryIndex++
            }
            multiFeatureIndex++
          }
          break
        case 'GeometryCollection':
          for (j = 0; j < geometry2.geometries.length; j++)
            if (coordEach(geometry2.geometries[j], callback, excludeWrapCoord) === false)
              return false
          break
        default:
          throw new Error('Unknown Geometry Type')
      }
    }
  }
}
var coordReduce = function (geojson, callback, initialValue, excludeWrapCoord) {
  var previousValue = initialValue
  coordEach(
    geojson,
    function (currentCoord, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) {
      if (coordIndex === 0 && initialValue === undefined) previousValue = currentCoord
      else
        previousValue = callback(
          previousValue,
          currentCoord,
          coordIndex,
          featureIndex,
          multiFeatureIndex,
          geometryIndex,
        )
    },
    excludeWrapCoord,
  )
  return previousValue
}
var propEach = function (geojson, callback) {
  var i
  switch (geojson.type) {
    case 'FeatureCollection':
      for (i = 0; i < geojson.features.length; i++) {
        if (callback(geojson.features[i].properties, i) === false) break
      }
      break
    case 'Feature':
      callback(geojson.properties, 0)
      break
  }
}
var propReduce = function (geojson, callback, initialValue) {
  var previousValue = initialValue
  propEach(geojson, function (currentProperties, featureIndex) {
    if (featureIndex === 0 && initialValue === undefined) previousValue = currentProperties
    else previousValue = callback(previousValue, currentProperties, featureIndex)
  })
  return previousValue
}
var featureEach = function (geojson, callback) {
  if (geojson.type === 'Feature') {
    callback(geojson, 0)
  } else if (geojson.type === 'FeatureCollection') {
    for (var i = 0; i < geojson.features.length; i++) {
      if (callback(geojson.features[i], i) === false) break
    }
  }
}
var featureReduce = function (geojson, callback, initialValue) {
  var previousValue = initialValue
  featureEach(geojson, function (currentFeature, featureIndex) {
    if (featureIndex === 0 && initialValue === undefined) previousValue = currentFeature
    else previousValue = callback(previousValue, currentFeature, featureIndex)
  })
  return previousValue
}
var coordAll = function (geojson) {
  var coords = []
  coordEach(geojson, function (coord) {
    coords.push(coord)
  })
  return coords
}
var geomEach = function (geojson, callback) {
  var i,
    j,
    g,
    geometry2,
    stopG,
    geometryMaybeCollection,
    isGeometryCollection,
    featureProperties,
    featureBBox,
    featureId,
    featureIndex = 0,
    isFeatureCollection = geojson.type === 'FeatureCollection',
    isFeature = geojson.type === 'Feature',
    stop = isFeatureCollection ? geojson.features.length : 1
  for (i = 0; i < stop; i++) {
    geometryMaybeCollection = isFeatureCollection
      ? geojson.features[i].geometry
      : isFeature
        ? geojson.geometry
        : geojson
    featureProperties = isFeatureCollection
      ? geojson.features[i].properties
      : isFeature
        ? geojson.properties
        : {}
    featureBBox = isFeatureCollection
      ? geojson.features[i].bbox
      : isFeature
        ? geojson.bbox
        : undefined
    featureId = isFeatureCollection ? geojson.features[i].id : isFeature ? geojson.id : undefined
    isGeometryCollection = geometryMaybeCollection
      ? geometryMaybeCollection.type === 'GeometryCollection'
      : false
    stopG = isGeometryCollection ? geometryMaybeCollection.geometries.length : 1
    for (g = 0; g < stopG; g++) {
      geometry2 = isGeometryCollection
        ? geometryMaybeCollection.geometries[g]
        : geometryMaybeCollection
      if (geometry2 === null) {
        if (callback(null, featureIndex, featureProperties, featureBBox, featureId) === false)
          return false
        continue
      }
      switch (geometry2.type) {
        case 'Point':
        case 'LineString':
        case 'MultiPoint':
        case 'Polygon':
        case 'MultiLineString':
        case 'MultiPolygon': {
          if (
            callback(geometry2, featureIndex, featureProperties, featureBBox, featureId) === false
          )
            return false
          break
        }
        case 'GeometryCollection': {
          for (j = 0; j < geometry2.geometries.length; j++) {
            if (
              callback(
                geometry2.geometries[j],
                featureIndex,
                featureProperties,
                featureBBox,
                featureId,
              ) === false
            )
              return false
          }
          break
        }
        default:
          throw new Error('Unknown Geometry Type')
      }
    }
    featureIndex++
  }
}
var geomReduce = function (geojson, callback, initialValue) {
  var previousValue = initialValue
  geomEach(
    geojson,
    function (currentGeometry, featureIndex, featureProperties, featureBBox, featureId) {
      if (featureIndex === 0 && initialValue === undefined) previousValue = currentGeometry
      else
        previousValue = callback(
          previousValue,
          currentGeometry,
          featureIndex,
          featureProperties,
          featureBBox,
          featureId,
        )
    },
  )
  return previousValue
}
var flattenEach = function (geojson, callback) {
  geomEach(geojson, function (geometry2, featureIndex, properties, bbox, id) {
    var type = geometry2 === null ? null : geometry2.type
    switch (type) {
      case null:
      case 'Point':
      case 'LineString':
      case 'Polygon':
        if (callback(feature(geometry2, properties, { bbox, id }), featureIndex, 0) === false)
          return false
        return
    }
    var geomType
    switch (type) {
      case 'MultiPoint':
        geomType = 'Point'
        break
      case 'MultiLineString':
        geomType = 'LineString'
        break
      case 'MultiPolygon':
        geomType = 'Polygon'
        break
    }
    for (
      var multiFeatureIndex = 0;
      multiFeatureIndex < geometry2.coordinates.length;
      multiFeatureIndex++
    ) {
      var coordinate = geometry2.coordinates[multiFeatureIndex]
      var geom = {
        type: geomType,
        coordinates: coordinate,
      }
      if (callback(feature(geom, properties), featureIndex, multiFeatureIndex) === false)
        return false
    }
  })
}
var flattenReduce = function (geojson, callback, initialValue) {
  var previousValue = initialValue
  flattenEach(geojson, function (currentFeature, featureIndex, multiFeatureIndex) {
    if (featureIndex === 0 && multiFeatureIndex === 0 && initialValue === undefined)
      previousValue = currentFeature
    else previousValue = callback(previousValue, currentFeature, featureIndex, multiFeatureIndex)
  })
  return previousValue
}
var segmentEach = function (geojson, callback) {
  flattenEach(geojson, function (feature2, featureIndex, multiFeatureIndex) {
    var segmentIndex = 0
    if (!feature2.geometry) return
    var type = feature2.geometry.type
    if (type === 'Point' || type === 'MultiPoint') return
    var previousCoords
    var previousFeatureIndex = 0
    var previousMultiIndex = 0
    var prevGeomIndex = 0
    if (
      coordEach(
        feature2,
        function (currentCoord, coordIndex, featureIndexCoord, multiPartIndexCoord, geometryIndex) {
          if (
            previousCoords === undefined ||
            featureIndex > previousFeatureIndex ||
            multiPartIndexCoord > previousMultiIndex ||
            geometryIndex > prevGeomIndex
          ) {
            previousCoords = currentCoord
            previousFeatureIndex = featureIndex
            previousMultiIndex = multiPartIndexCoord
            prevGeomIndex = geometryIndex
            segmentIndex = 0
            return
          }
          var currentSegment = lineString([previousCoords, currentCoord], feature2.properties)
          if (
            callback(
              currentSegment,
              featureIndex,
              multiFeatureIndex,
              geometryIndex,
              segmentIndex,
            ) === false
          )
            return false
          segmentIndex++
          previousCoords = currentCoord
        },
      ) === false
    )
      return false
  })
}
var segmentReduce = function (geojson, callback, initialValue) {
  var previousValue = initialValue
  var started = false
  segmentEach(
    geojson,
    function (currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex) {
      if (started === false && initialValue === undefined) previousValue = currentSegment
      else
        previousValue = callback(
          previousValue,
          currentSegment,
          featureIndex,
          multiFeatureIndex,
          geometryIndex,
          segmentIndex,
        )
      started = true
    },
  )
  return previousValue
}
var lineEach = function (geojson, callback) {
  if (!geojson) throw new Error('geojson is required')
  flattenEach(geojson, function (feature2, featureIndex, multiFeatureIndex) {
    if (feature2.geometry === null) return
    var type = feature2.geometry.type
    var coords = feature2.geometry.coordinates
    switch (type) {
      case 'LineString':
        if (callback(feature2, featureIndex, multiFeatureIndex, 0, 0) === false) return false
        break
      case 'Polygon':
        for (var geometryIndex = 0; geometryIndex < coords.length; geometryIndex++) {
          if (
            callback(
              lineString(coords[geometryIndex], feature2.properties),
              featureIndex,
              multiFeatureIndex,
              geometryIndex,
            ) === false
          )
            return false
        }
        break
    }
  })
}
var lineReduce = function (geojson, callback, initialValue) {
  var previousValue = initialValue
  lineEach(geojson, function (currentLine, featureIndex, multiFeatureIndex, geometryIndex) {
    if (featureIndex === 0 && initialValue === undefined) previousValue = currentLine
    else
      previousValue = callback(
        previousValue,
        currentLine,
        featureIndex,
        multiFeatureIndex,
        geometryIndex,
      )
  })
  return previousValue
}
var findSegment = function (geojson, options) {
  options = options || {}
  if (!isObject(options)) throw new Error('options is invalid')
  var featureIndex = options.featureIndex || 0
  var multiFeatureIndex = options.multiFeatureIndex || 0
  var geometryIndex = options.geometryIndex || 0
  var segmentIndex = options.segmentIndex || 0
  var properties = options.properties
  var geometry2
  switch (geojson.type) {
    case 'FeatureCollection':
      if (featureIndex < 0) featureIndex = geojson.features.length + featureIndex
      properties = properties || geojson.features[featureIndex].properties
      geometry2 = geojson.features[featureIndex].geometry
      break
    case 'Feature':
      properties = properties || geojson.properties
      geometry2 = geojson.geometry
      break
    case 'Point':
    case 'MultiPoint':
      return null
    case 'LineString':
    case 'Polygon':
    case 'MultiLineString':
    case 'MultiPolygon':
      geometry2 = geojson
      break
    default:
      throw new Error('geojson is invalid')
  }
  if (geometry2 === null) return null
  var coords = geometry2.coordinates
  switch (geometry2.type) {
    case 'Point':
    case 'MultiPoint':
      return null
    case 'LineString':
      if (segmentIndex < 0) segmentIndex = coords.length + segmentIndex - 1
      return lineString([coords[segmentIndex], coords[segmentIndex + 1]], properties, options)
    case 'Polygon':
      if (geometryIndex < 0) geometryIndex = coords.length + geometryIndex
      if (segmentIndex < 0) segmentIndex = coords[geometryIndex].length + segmentIndex - 1
      return lineString(
        [coords[geometryIndex][segmentIndex], coords[geometryIndex][segmentIndex + 1]],
        properties,
        options,
      )
    case 'MultiLineString':
      if (multiFeatureIndex < 0) multiFeatureIndex = coords.length + multiFeatureIndex
      if (segmentIndex < 0) segmentIndex = coords[multiFeatureIndex].length + segmentIndex - 1
      return lineString(
        [coords[multiFeatureIndex][segmentIndex], coords[multiFeatureIndex][segmentIndex + 1]],
        properties,
        options,
      )
    case 'MultiPolygon':
      if (multiFeatureIndex < 0) multiFeatureIndex = coords.length + multiFeatureIndex
      if (geometryIndex < 0) geometryIndex = coords[multiFeatureIndex].length + geometryIndex
      if (segmentIndex < 0)
        segmentIndex = coords[multiFeatureIndex][geometryIndex].length - segmentIndex - 1
      return lineString(
        [
          coords[multiFeatureIndex][geometryIndex][segmentIndex],
          coords[multiFeatureIndex][geometryIndex][segmentIndex + 1],
        ],
        properties,
        options,
      )
  }
  throw new Error('geojson is invalid')
}
var findPoint = function (geojson, options) {
  options = options || {}
  if (!isObject(options)) throw new Error('options is invalid')
  var featureIndex = options.featureIndex || 0
  var multiFeatureIndex = options.multiFeatureIndex || 0
  var geometryIndex = options.geometryIndex || 0
  var coordIndex = options.coordIndex || 0
  var properties = options.properties
  var geometry2
  switch (geojson.type) {
    case 'FeatureCollection':
      if (featureIndex < 0) featureIndex = geojson.features.length + featureIndex
      properties = properties || geojson.features[featureIndex].properties
      geometry2 = geojson.features[featureIndex].geometry
      break
    case 'Feature':
      properties = properties || geojson.properties
      geometry2 = geojson.geometry
      break
    case 'Point':
    case 'MultiPoint':
      return null
    case 'LineString':
    case 'Polygon':
    case 'MultiLineString':
    case 'MultiPolygon':
      geometry2 = geojson
      break
    default:
      throw new Error('geojson is invalid')
  }
  if (geometry2 === null) return null
  var coords = geometry2.coordinates
  switch (geometry2.type) {
    case 'Point':
      return point(coords, properties, options)
    case 'MultiPoint':
      if (multiFeatureIndex < 0) multiFeatureIndex = coords.length + multiFeatureIndex
      return point(coords[multiFeatureIndex], properties, options)
    case 'LineString':
      if (coordIndex < 0) coordIndex = coords.length + coordIndex
      return point(coords[coordIndex], properties, options)
    case 'Polygon':
      if (geometryIndex < 0) geometryIndex = coords.length + geometryIndex
      if (coordIndex < 0) coordIndex = coords[geometryIndex].length + coordIndex
      return point(coords[geometryIndex][coordIndex], properties, options)
    case 'MultiLineString':
      if (multiFeatureIndex < 0) multiFeatureIndex = coords.length + multiFeatureIndex
      if (coordIndex < 0) coordIndex = coords[multiFeatureIndex].length + coordIndex
      return point(coords[multiFeatureIndex][coordIndex], properties, options)
    case 'MultiPolygon':
      if (multiFeatureIndex < 0) multiFeatureIndex = coords.length + multiFeatureIndex
      if (geometryIndex < 0) geometryIndex = coords[multiFeatureIndex].length + geometryIndex
      if (coordIndex < 0) coordIndex = coords[multiFeatureIndex][geometryIndex].length - coordIndex
      return point(coords[multiFeatureIndex][geometryIndex][coordIndex], properties, options)
  }
  throw new Error('geojson is invalid')
}
var __defProp3 = Object.defineProperty
var __name2 = (target, value) => __defProp3(target, 'name', { value, configurable: true })
__name2(coordEach, 'coordEach')
__name2(coordReduce, 'coordReduce')
__name2(propEach, 'propEach')
__name2(propReduce, 'propReduce')
__name2(featureEach, 'featureEach')
__name2(featureReduce, 'featureReduce')
__name2(coordAll, 'coordAll')
__name2(geomEach, 'geomEach')
__name2(geomReduce, 'geomReduce')
__name2(flattenEach, 'flattenEach')
__name2(flattenReduce, 'flattenReduce')
__name2(segmentEach, 'segmentEach')
__name2(segmentReduce, 'segmentReduce')
__name2(lineEach, 'lineEach')
__name2(lineReduce, 'lineReduce')
__name2(findSegment, 'findSegment')
__name2(findPoint, 'findPoint')

// node_modules/@turf/bbox/dist/esm/index.js
var bbox = function (geojson, options = {}) {
  if (geojson.bbox != null && options.recompute !== true) {
    return geojson.bbox
  }
  const result = [Infinity, Infinity, -Infinity, -Infinity]
  coordEach(geojson, (coord) => {
    if (result[0] > coord[0]) {
      result[0] = coord[0]
    }
    if (result[1] > coord[1]) {
      result[1] = coord[1]
    }
    if (result[2] < coord[0]) {
      result[2] = coord[0]
    }
    if (result[3] < coord[1]) {
      result[3] = coord[1]
    }
  })
  return result
}
var __defProp4 = Object.defineProperty
var __name3 = (target, value) => __defProp4(target, 'name', { value, configurable: true })
__name3(bbox, 'bbox')
var turf_bbox_default = bbox

// node_modules/@turf/bbox-polygon/dist/esm/index.js
var bboxPolygon = function (bbox2, options = {}) {
  const west = Number(bbox2[0])
  const south = Number(bbox2[1])
  const east = Number(bbox2[2])
  const north = Number(bbox2[3])
  if (bbox2.length === 6) {
    throw new Error('@turf/bbox-polygon does not support BBox with 6 positions')
  }
  const lowLeft = [west, south]
  const topLeft = [west, north]
  const topRight = [east, north]
  const lowRight = [east, south]
  return polygon([[lowLeft, lowRight, topRight, topLeft, lowLeft]], options.properties, {
    bbox: bbox2,
    id: options.id,
  })
}
var __defProp5 = Object.defineProperty
var __name4 = (target, value) => __defProp5(target, 'name', { value, configurable: true })
__name4(bboxPolygon, 'bboxPolygon')
var turf_bbox_polygon_default = bboxPolygon

// node_modules/id-area-keys/dist/areaKeys.mjs
var isArea = function (tags) {
  if (typeof tags !== 'object') return false
  if (tags.area === 'yes') return true
  if (tags.area === 'no') return false
  for (let key in tags) {
    if (key in areaKeys && !(tags[key] in areaKeys[key])) return true
  }
  return false
}
var areaKeys_default = {
  areaKeys: {
    'addr:*': {},
    advertising: {
      totem: true,
      poster_box: true,
      billboard: true,
    },
    aerialway: {
      zip_line: true,
      't-bar': true,
      rope_tow: true,
      platter: true,
      mixed_lift: true,
      magic_carpet: true,
      'j-bar': true,
      goods: true,
      gondola: true,
      drag_lift: true,
      chair_lift: true,
      cable_car: true,
    },
    aeroway: {
      taxiway: true,
      runway: true,
      parking_position: true,
      jet_bridge: true,
    },
    allotments: {},
    amenity: {
      weighbridge: true,
      bench: true,
    },
    'area:highway': {},
    attraction: {
      water_slide: true,
      train: true,
      summer_toboggan: true,
      river_rafting: true,
      log_flume: true,
      dark_ride: true,
    },
    boundary: {
      administrative: true,
    },
    'bridge:support': {},
    building: {},
    'building:part': {},
    cemetery: {},
    club: {},
    craft: {},
    'demolished:building': {},
    'disused:amenity': {},
    'disused:railway': {},
    'disused:shop': {},
    emergency: {
      yes: true,
      private: true,
      official: true,
      no: true,
      destination: true,
      designated: true,
    },
    golf: {
      path: true,
      hole: true,
      cartpath: true,
    },
    healthcare: {},
    historic: {},
    indoor: {
      wall: true,
      corridor: true,
    },
    industrial: {},
    internet_access: {},
    junction: {},
    landuse: {},
    leisure: {
      track: true,
      slipway: true,
    },
    man_made: {
      video_wall: true,
      torii: true,
      quay: true,
      pipeline: true,
      pier: true,
      groyne: true,
      goods_conveyor: true,
      gantry: true,
      embankment: true,
      dyke: true,
      cutline: true,
      crane: true,
      carpet_hanger: true,
      breakwater: true,
      yes: true,
    },
    military: {
      trench: true,
    },
    natural: {
      valley: true,
      tree_row: true,
      strait: true,
      ridge: true,
      coastline: true,
      cliff: true,
      bay: true,
    },
    office: {},
    pipeline: {},
    'piste:type': {
      sleigh: true,
      sled: true,
      skitour: true,
      nordic: true,
      ice_skate: true,
      hike: true,
      downhill: true,
    },
    place: {},
    playground: {
      zipwire: true,
      water: true,
      tunnel_tube: true,
      swing: true,
      structure: true,
      slide: true,
      seesaw: true,
      horizontal_bar: true,
      hopscotch: true,
      climbingwall: true,
      bridge: true,
      basketswing: true,
      balancebeam: true,
      activitypanel: true,
    },
    police: {},
    polling_station: {},
    power: {
      portal: true,
      minor_line: true,
      line: true,
      cable: true,
    },
    public_transport: {
      platform: true,
    },
    residential: {},
    'seamark:harbour:category': {},
    'seamark:type': {},
    shop: {},
    telecom: {},
    tourism: {
      attraction: true,
      artwork: true,
    },
    traffic_calming: {
      rumble_strip: true,
      mini_bumps: true,
      island: true,
      hump: true,
      dip: true,
      cushion: true,
      choker: true,
      chicane: true,
      bump: true,
      yes: true,
    },
    waterway: {
      weir: true,
      tidal_channel: true,
      stream: true,
      river: true,
      lock_gate: true,
      fish_pass: true,
      drain: true,
      ditch: true,
      dam: true,
      canal: true,
    },
  },
}
var { areaKeys } = areaKeys_default

// node_modules/ramda/es/internal/_isPlaceholder.js
function _isPlaceholder(a) {
  return a != null && typeof a === 'object' && a['@@functional/placeholder'] === true
}

// node_modules/ramda/es/internal/_curry1.js
function _curry1(fn) {
  return function f1(a) {
    if (arguments.length === 0 || _isPlaceholder(a)) {
      return f1
    } else {
      return fn.apply(this, arguments)
    }
  }
}

// node_modules/ramda/es/internal/_curry2.js
function _curry2(fn) {
  return function f2(a, b) {
    switch (arguments.length) {
      case 0:
        return f2
      case 1:
        return _isPlaceholder(a)
          ? f2
          : _curry1(function (_b) {
              return fn(a, _b)
            })
      default:
        return _isPlaceholder(a) && _isPlaceholder(b)
          ? f2
          : _isPlaceholder(a)
            ? _curry1(function (_a) {
                return fn(_a, b)
              })
            : _isPlaceholder(b)
              ? _curry1(function (_b) {
                  return fn(a, _b)
                })
              : fn(a, b)
    }
  }
}

// node_modules/ramda/es/internal/_concat.js
function _concat(set1, set2) {
  set1 = set1 || []
  set2 = set2 || []
  var idx
  var len1 = set1.length
  var len2 = set2.length
  var result = []
  idx = 0
  while (idx < len1) {
    result[result.length] = set1[idx]
    idx += 1
  }
  idx = 0
  while (idx < len2) {
    result[result.length] = set2[idx]
    idx += 1
  }
  return result
}

// node_modules/ramda/es/internal/_arity.js
function _arity(n, fn) {
  switch (n) {
    case 0:
      return function () {
        return fn.apply(this, arguments)
      }
    case 1:
      return function (a0) {
        return fn.apply(this, arguments)
      }
    case 2:
      return function (a0, a1) {
        return fn.apply(this, arguments)
      }
    case 3:
      return function (a0, a1, a2) {
        return fn.apply(this, arguments)
      }
    case 4:
      return function (a0, a1, a2, a3) {
        return fn.apply(this, arguments)
      }
    case 5:
      return function (a0, a1, a2, a3, a4) {
        return fn.apply(this, arguments)
      }
    case 6:
      return function (a0, a1, a2, a3, a4, a5) {
        return fn.apply(this, arguments)
      }
    case 7:
      return function (a0, a1, a2, a3, a4, a5, a6) {
        return fn.apply(this, arguments)
      }
    case 8:
      return function (a0, a1, a2, a3, a4, a5, a6, a7) {
        return fn.apply(this, arguments)
      }
    case 9:
      return function (a0, a1, a2, a3, a4, a5, a6, a7, a8) {
        return fn.apply(this, arguments)
      }
    case 10:
      return function (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
        return fn.apply(this, arguments)
      }
    default:
      throw new Error('First argument to _arity must be a non-negative integer no greater than ten')
  }
}

// node_modules/ramda/es/internal/_curryN.js
function _curryN(length, received, fn) {
  return function () {
    var combined = []
    var argsIdx = 0
    var left = length
    var combinedIdx = 0
    var hasPlaceholder = false
    while (combinedIdx < received.length || argsIdx < arguments.length) {
      var result
      if (
        combinedIdx < received.length &&
        (!_isPlaceholder(received[combinedIdx]) || argsIdx >= arguments.length)
      ) {
        result = received[combinedIdx]
      } else {
        result = arguments[argsIdx]
        argsIdx += 1
      }
      combined[combinedIdx] = result
      if (!_isPlaceholder(result)) {
        left -= 1
      } else {
        hasPlaceholder = true
      }
      combinedIdx += 1
    }
    return !hasPlaceholder && left <= 0
      ? fn.apply(this, combined)
      : _arity(Math.max(0, left), _curryN(length, combined, fn))
  }
}

// node_modules/ramda/es/curryN.js
var curryN = _curry2(function curryN2(length, fn) {
  if (length === 1) {
    return _curry1(fn)
  }
  return _arity(length, _curryN(length, [], fn))
})
var curryN_default = curryN

// node_modules/ramda/es/internal/_isArray.js
var _isArray_default =
  Array.isArray ||
  function _isArray(val) {
    return (
      val != null && val.length >= 0 && Object.prototype.toString.call(val) === '[object Array]'
    )
  }

// node_modules/ramda/es/internal/_isTransformer.js
function _isTransformer(obj) {
  return obj != null && typeof obj['@@transducer/step'] === 'function'
}

// node_modules/ramda/es/internal/_dispatchable.js
function _dispatchable(methodNames, transducerCreator, fn) {
  return function () {
    if (arguments.length === 0) {
      return fn()
    }
    var obj = arguments[arguments.length - 1]
    if (!_isArray_default(obj)) {
      var idx = 0
      while (idx < methodNames.length) {
        if (typeof obj[methodNames[idx]] === 'function') {
          return obj[methodNames[idx]].apply(obj, Array.prototype.slice.call(arguments, 0, -1))
        }
        idx += 1
      }
      if (_isTransformer(obj)) {
        var transducer = transducerCreator.apply(null, Array.prototype.slice.call(arguments, 0, -1))
        return transducer(obj)
      }
    }
    return fn.apply(this, arguments)
  }
}

// node_modules/ramda/es/internal/_xfBase.js
var _xfBase_default = {
  init: function () {
    return this.xf['@@transducer/init']()
  },
  result: function (result) {
    return this.xf['@@transducer/result'](result)
  },
}

// node_modules/ramda/es/internal/_has.js
function _has(prop, obj) {
  return Object.prototype.hasOwnProperty.call(obj, prop)
}

// node_modules/ramda/es/internal/_isArguments.js
var toString = Object.prototype.toString
var _isArguments = (function () {
  return toString.call(arguments) === '[object Arguments]'
    ? function _isArguments(x) {
        return toString.call(x) === '[object Arguments]'
      }
    : function _isArguments(x) {
        return _has('callee', x)
      }
})()
var _isArguments_default = _isArguments

// node_modules/ramda/es/keys.js
var hasEnumBug = !{
  toString: null,
}.propertyIsEnumerable('toString')
var nonEnumerableProps = [
  'constructor',
  'valueOf',
  'isPrototypeOf',
  'toString',
  'propertyIsEnumerable',
  'hasOwnProperty',
  'toLocaleString',
]
var hasArgsEnumBug = (function () {
  return arguments.propertyIsEnumerable('length')
})()
var contains = function contains2(list, item) {
  var idx = 0
  while (idx < list.length) {
    if (list[idx] === item) {
      return true
    }
    idx += 1
  }
  return false
}
var keys =
  typeof Object.keys === 'function' && !hasArgsEnumBug
    ? _curry1(function keys2(obj) {
        return Object(obj) !== obj ? [] : Object.keys(obj)
      })
    : _curry1(function keys3(obj) {
        if (Object(obj) !== obj) {
          return []
        }
        var prop, nIdx
        var ks = []
        var checkArgsLength = hasArgsEnumBug && _isArguments_default(obj)
        for (prop in obj) {
          if (_has(prop, obj) && (!checkArgsLength || prop !== 'length')) {
            ks[ks.length] = prop
          }
        }
        if (hasEnumBug) {
          nIdx = nonEnumerableProps.length - 1
          while (nIdx >= 0) {
            prop = nonEnumerableProps[nIdx]
            if (_has(prop, obj) && !contains(ks, prop)) {
              ks[ks.length] = prop
            }
            nIdx -= 1
          }
        }
        return ks
      })
var keys_default = keys

// node_modules/ramda/es/internal/_map.js
function _map(fn, functor) {
  var idx = 0
  var len = functor.length
  var result = Array(len)
  while (idx < len) {
    result[idx] = fn(functor[idx])
    idx += 1
  }
  return result
}

// node_modules/ramda/es/internal/_arrayReduce.js
function _arrayReduce(reducer, acc, list) {
  var index = 0
  var length = list.length
  while (index < length) {
    acc = reducer(acc, list[index])
    index += 1
  }
  return acc
}

// node_modules/ramda/es/internal/_xmap.js
var XMap = (function () {
  function XMap2(f, xf) {
    this.xf = xf
    this.f = f
  }
  XMap2.prototype['@@transducer/init'] = _xfBase_default.init
  XMap2.prototype['@@transducer/result'] = _xfBase_default.result
  XMap2.prototype['@@transducer/step'] = function (result, input) {
    return this.xf['@@transducer/step'](result, this.f(input))
  }
  return XMap2
})()
var _xmap = function _xmap2(f) {
  return function (xf) {
    return new XMap(f, xf)
  }
}
var _xmap_default = _xmap

// node_modules/ramda/es/map.js
var map = _curry2(
  _dispatchable(['fantasy-land/map', 'map'], _xmap_default, function map2(fn, functor) {
    switch (Object.prototype.toString.call(functor)) {
      case '[object Function]':
        return curryN_default(functor.length, function () {
          return fn.call(this, functor.apply(this, arguments))
        })
      case '[object Object]':
        return _arrayReduce(
          function (acc, key) {
            acc[key] = fn(functor[key])
            return acc
          },
          {},
          keys_default(functor),
        )
      default:
        return _map(fn, functor)
    }
  }),
)
var map_default = map

// node_modules/ramda/es/internal/_isString.js
function _isString(x) {
  return Object.prototype.toString.call(x) === '[object String]'
}

// node_modules/ramda/es/internal/_isArrayLike.js
var _isArrayLike = _curry1(function isArrayLike(x) {
  if (_isArray_default(x)) {
    return true
  }
  if (!x) {
    return false
  }
  if (typeof x !== 'object') {
    return false
  }
  if (_isString(x)) {
    return false
  }
  if (x.length === 0) {
    return true
  }
  if (x.length > 0) {
    return x.hasOwnProperty(0) && x.hasOwnProperty(x.length - 1)
  }
  return false
})
var _isArrayLike_default = _isArrayLike

// node_modules/ramda/es/internal/_createReduce.js
var symIterator = typeof Symbol !== 'undefined' ? Symbol.iterator : '@@iterator'
function _createReduce(arrayReduce, methodReduce, iterableReduce) {
  return function _reduce(xf, acc, list) {
    if (_isArrayLike_default(list)) {
      return arrayReduce(xf, acc, list)
    }
    if (list == null) {
      return acc
    }
    if (typeof list['fantasy-land/reduce'] === 'function') {
      return methodReduce(xf, acc, list, 'fantasy-land/reduce')
    }
    if (list[symIterator] != null) {
      return iterableReduce(xf, acc, list[symIterator]())
    }
    if (typeof list.next === 'function') {
      return iterableReduce(xf, acc, list)
    }
    if (typeof list.reduce === 'function') {
      return methodReduce(xf, acc, list, 'reduce')
    }
    throw new TypeError('reduce: list must be array or iterable')
  }
}

// node_modules/ramda/es/internal/_reduce.js
var _iterableReduce = function (reducer, acc, iter) {
  var step = iter.next()
  while (!step.done) {
    acc = reducer(acc, step.value)
    step = iter.next()
  }
  return acc
}
var _methodReduce = function (reducer, acc, obj, methodName) {
  return obj[methodName](reducer, acc)
}
var _reduce = _createReduce(_arrayReduce, _methodReduce, _iterableReduce)
var _reduce_default = _reduce

// node_modules/ramda/es/ap.js
var ap = _curry2(function ap2(applyF, applyX) {
  return typeof applyX['fantasy-land/ap'] === 'function'
    ? applyX['fantasy-land/ap'](applyF)
    : typeof applyF.ap === 'function'
      ? applyF.ap(applyX)
      : typeof applyF === 'function'
        ? function (x) {
            return applyF(x)(applyX(x))
          }
        : _reduce_default(
            function (acc, f) {
              return _concat(acc, map_default(f, applyX))
            },
            [],
            applyF,
          )
})
var ap_default = ap

// node_modules/ramda/es/isNil.js
var isNil = _curry1(function isNil2(x) {
  return x == null
})
var isNil_default = isNil

// node_modules/ramda/es/liftN.js
var liftN = _curry2(function liftN2(arity, fn) {
  var lifted = curryN_default(arity, fn)
  return curryN_default(arity, function () {
    return _arrayReduce(
      ap_default,
      map_default(lifted, arguments[0]),
      Array.prototype.slice.call(arguments, 1),
    )
  })
})
var liftN_default = liftN

// node_modules/ramda/es/lift.js
var lift = _curry1(function lift2(fn) {
  return liftN_default(fn.length, fn)
})
var lift_default = lift

// node_modules/ramda/es/not.js
var not = _curry1(function not2(a) {
  return !a
})
var not_default = not

// node_modules/ramda/es/complement.js
var complement = lift_default(not_default)
var complement_default = complement
// node_modules/ramda/es/omit.js
var omit = _curry2(function omit2(names, obj) {
  var result = {}
  var index = {}
  var idx = 0
  var len = names.length
  while (idx < len) {
    index[names[idx]] = 1
    idx += 1
  }
  for (var prop in obj) {
    if (!index.hasOwnProperty(prop)) {
      result[prop] = obj[prop]
    }
  }
  return result
})
var omit_default = omit
// parsers/realChangesetElementParser.ts
function realChangesetElementParser(json) {
  function createFeature(data) {
    switch (data.type) {
      case 'node':
        return createNode(data)
      case 'way':
        return createWay(data)
      case 'relation':
        return createRelation(data)
    }
  }
  function createNode(data) {
    if (data.lat !== undefined && data.lon !== undefined) {
      const geometry2 = [data.lon, data.lat].map(Number)
      const properties = omit_default(['lon', 'lat'], data)
      return point(geometry2, properties)
    }
  }
  function createWay(data) {
    if (data.nodes.length === 0) {
      return
    }
    const geometry2 = data.nodes
      .filter(function (node) {
        return Object.keys(node).includes('lat') && Object.keys(node).includes('lon')
      })
      .map(function (node) {
        return [node.lon, node.lat].map(Number)
      })
    const properties = omit_default(['nodes'], data)
    if (data.tags && isArea(data.tags) && isClosedWay(data.nodes)) {
      return omit_default(['bbox'], polygon([geometry2], properties))
    } else {
      return omit_default(['bbox'], lineString(geometry2, properties))
    }
  }
  function createRelation(data) {
    if ('members' in data) {
      data.relations = data.members.map(createFeature).filter(complement_default(isNil_default))
      const feature2 = turf_bbox_polygon_default(
        turf_bbox_default(featureCollection(data.relations)),
      )
      feature2.properties = omit_default(['members'], data)
      return omit_default(['bbox'], feature2)
    }
    return null
  }
  if (json.action === 'delete') {
    switch (json.type) {
      case 'node':
        json.lon = json.old.lon
        json.lat = json.old.lat
        break
      case 'way':
        json.nodes = json.old.nodes
        break
      case 'relation':
        json.members = json.old.members
        break
    }
  }
  switch (json.action) {
    case 'create':
      json.changeType = 'added'
      break
    case 'delete':
      json.changeType = 'deletedNew'
      json.old.changeType = 'deletedOld'
      break
    case 'modify':
      json.changeType = 'modifiedNew'
      json.old.changeType = 'modifiedOld'
      break
  }
  return ('old' in json ? [omit_default(['old'], json), json.old] : [json]).map(createFeature)
}
var isClosedWay = function (nodes) {
  if (nodes.length > 3) {
    const firstNode = nodes[0]
    const lastNode = nodes[nodes.length - 1]
    return (
      Object.keys(firstNode).includes('lat') &&
      Object.keys(firstNode).includes('lon') &&
      Object.keys(lastNode).includes('lat') &&
      Object.keys(lastNode).includes('lon') &&
      firstNode.lat === lastNode.lat &&
      firstNode.lon === lastNode.lon
    )
  }
  return false
}
// parsers/realChangesetParser.ts
var realChangesetParser = (input) => {
  const { elements } = input
  const parsedElements = elements.map((element) => realChangesetElementParser(element))
  const flatElements = parsedElements.flat()
  return featureCollection(flatElements)
}
export { realChangesetElementParser, realChangesetParser }
