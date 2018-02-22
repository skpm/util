const util = require('../')

test('should format a string', () => {
  expect(util.format('%s:%s', 'foo')).toBe('foo:%s')
  expect(util.format('%s:%s', 'foo', 'bar', 'baz')).toBe('foo:bar baz')
  expect(util.format(1, 2, 3)).toBe('1 2 3')
  expect(util.format('%% %s')).toBe('%% %s')
})

test('should inspect', (context) => {
  expect(util.inspect(1)).toBe('1')
  expect(util.inspect('hello')).toBe("'hello'")
  expect(util.inspect(['hello'])).toBe("[ 'hello' ]")
  expect(util.inspect({a: 'hello'})).toBe("{ a: 'hello' }")
  expect(util.inspect(context)).toBe("__NSDictionaryM {\n  plugin: <MSPluginBundle>,\n  selection: __NSArray0 [],\n  document: <MSDocument>,\n  api: [Function],\n  scriptURL: {},\n  command: <MSPluginCommand>,\n  scriptPath: '" + String(context.scriptPath) + "' }")
})
