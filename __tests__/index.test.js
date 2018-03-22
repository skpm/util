const util = require('../')
const sketch = require('sketch')

test('should format a string', () => {
  expect(util.format('%s:%s', 'foo')).toBe('foo:%s')
  expect(util.format('%s:%s', 'foo', 'bar', 'baz')).toBe('foo:bar baz')
  expect(util.format(1, 2, 3)).toBe('1 2 3')
  expect(util.format('%% %s')).toBe('\'%% %s\'')
})

test('should inspect', (context, document) => {
  expect(util.inspect(1)).toBe('1')
  expect(util.inspect(undefined)).toBe('undefined')
  expect(util.inspect(null)).toBe('null')
  expect(util.inspect('hello')).toBe("'hello'")
  expect(util.inspect(['hello'])).toBe("[ 'hello' ]")
  expect(util.inspect({a: 'hello'})).toBe("{ a: 'hello' }")
  expect(util.inspect(context)).toBe(`__NSDictionaryM {\n  plugin: ${String(context.plugin)},\n  selection: __NSArray0 [],\n  document: ${String(context.document)},\n  api: [Function],\n  scriptURL: {},\n  command: ${String(context.command)},\n  scriptPath: '${String(context.scriptPath)}' }`)
  expect(util.inspect(document.pages[0])).toBe(`{ type: 'Page',\n  id: '${document.pages[0].id}',\n  frame: { x: 0, y: 0, width: 300, height: 300 },\n  name: 'Page 1',\n  selected: true,\n  layers: [] }`)
  expect(util.inspect({ type: 'Shape', id: '61658700-4746-43A0-BE9C-5191CA209481', style: { type: 'Style', id: 'ED475674-38E5-4673-A7D0-2F0903A0E2D3',opacity: 1,borderOptions:{ startArrowhead: 'None',lineEnd: 'Butt',lineJoin: 'Miter', endArrowhead: 'None', }}})).toBe(`{ type: \'Shape\',\n  id: \'61658700-4746-43A0-BE9C-5191CA209481\',\n  style: \n   { type: \'Style\',\n     id: \'ED475674-38E5-4673-A7D0-2F0903A0E2D3\',\n     opacity: 1,\n     borderOptions: \n      { startArrowhead: \'None\',\n        lineEnd: \'Butt\',\n        lineJoin: \'Miter\',\n        endArrowhead: \'None\' } } }`)
})
