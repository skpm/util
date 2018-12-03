const util = require('../casting')
const sketch = require('sketch')

test('isNumber', () => {
  const point = CGPointMake(1, 2)

  expect(util.isNumber(point.x)).toBe(true)
})

test('should coerce ns to js', (context, document) => {
  // NSString
  let str = NSString.alloc().initWithString("a string")
  expect(typeof util.toJSObject(str)).toBe("string")
  expect(util.toJSObject(str)).toBe("a string")
  // NSNumber (bool)
  let bool = NSNumber.numberWithBool(true)
  expect(typeof util.toJSObject(bool)).toBe("boolean")
  expect(util.toJSObject(bool)).toBe(true)
  // NSNumber (number)
  let num = NSNumber.numberWithInteger(5)
  expect(typeof util.toJSObject(num)).toBe("number")
  expect(util.toJSObject(num)).toBe(5)
  // NSictionary
  let dict = NSMutableDictionary.new()
  dict.setObject_forKey(NSString.alloc().initWithString("a string"), "str")
  dict.setObject_forKey(NSNumber.numberWithInteger(5), "num")
  obj = util.toJSObject(dict)
  // Nested objects are not converted
  expect(Number(obj["str"].isKindOfClass(NSString))).toEqual(1)
  expect(typeof obj["num"]).toBe("object")
  // Struct
  const point = CGPointMake(1, 2)
  expect(util.toJSObject(point, {recurse: true})).toEqual({x: 1, y: 2})
})
