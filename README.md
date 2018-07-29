# `util` for Sketch

All the [util nodejs fs](https://nodejs.org/api/util.html) API is available.

Additionally, 5 more methods are available:

- `isNativeObject`: return whether the argument is a native objc object
- `getNativeClass`: return the class name of a native object
- `toArray`: cast assimilated arrays (`NSArray`) to a proper JS array
- `toObject`: cast assimilated objects (`NSDictionary`) to a proper JS object
- `toJSObject`: cast any object or primitive into its proper JS counterpart
