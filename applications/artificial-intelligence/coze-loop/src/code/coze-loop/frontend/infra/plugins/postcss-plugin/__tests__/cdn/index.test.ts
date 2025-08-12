import postcss from 'postcss';

import plugin from '../../src/cdn/index.js';

const run = async (input: string, output: string, cdnPrefix = 'uri/of/cdn') => {
  const result = await postcss([plugin({ cdnPrefix })]).process(input, {
    from: undefined,
  });
  expect(result.css).toEqual(output);
};

describe('postcss-cdn-plugin', () => {
  it('should work with double quote', async () => {
    await run(
      '.foo { background: cdn_resolve("foo.png") }',
      '.foo { background: url("uri/of/cdn/foo.png") }',
    );
  });

  it('should work with single quote', async () => {
    await run(
      ".foo { background: cdn_resolve('foo.png') }",
      '.foo { background: url("uri/of/cdn/foo.png") }',
    );
  });

  it('should work with no quote', async () => {
    await run(
      '.foo { background: cdn_resolve(foo.png) }',
      '.foo { background: url("uri/of/cdn/foo.png") }',
    );
  });

  it('should work with background config', async () => {
    await run(
      '.foo { background: #ffcc00 cdn_resolve(foo.png) no-repeat top right/50% 50%, #ffcc00; }',
      '.foo { background: #ffcc00 url("uri/of/cdn/foo.png") no-repeat top right/50% 50%, #ffcc00; }',
    );
  });
});
