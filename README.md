# `util` for Sketch

All the [util nodejs](https://nodejs.org/api/util.html) API is available.

Additionally, 5 more methods are available:

- `isNativeObject`: return whether the argument is a native objc object
- `getNativeClass`: return the class name of a native object
- `toArray`: cast assimilated arrays (`NSArray`) to a proper JS array
- `toObject`: cast assimilated objects (`NSDictionary`) to a proper JS object
- `toJSObject`: cast any object or primitive into its proper JS counterpart. Note that `NSDictionary` and `NSArray` elements are not recursively converted unless an `options` object is passed as the second argument and `options.recurse` is set to `true`

_Because of CocoaScript, `isNull` is not going to work._
