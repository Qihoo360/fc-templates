import postcss, { type Plugin } from 'postcss';

import plugin from '../../src/ns/index.js';

describe('@coze-arch/postcss-plugin', () => {
  it('should add prefix for all selectors', async () => {
    const pluginInstance = plugin({
      prefixSet: [{ regexp: /.css$/, namespace: 'text' }],
    }) as Plugin;

    const testRules = [
      { selectors: ['code', '.foo'] },
      { selectors: ['*', '.boo'] },
    ];

    await pluginInstance.Once?.(
      {
        // @ts-expect-error mock input
        source: { input: { file: 'foo.css' } },
        walkRules(cb) {
          testRules.forEach(it => cb(it));
          return undefined;
        },
      },
      {},
    );

    // assets
    expect(
      testRules.every(r => r.selectors.every(d => d.startsWith('.text '))),
    ).toBe(true);
  });

  it('should only auto prefix single dot', async () => {
    const pluginInstance = plugin({
      prefixSet: [{ regexp: /.css$/, namespace: '.text' }],
    }) as Plugin;

    const testRules = [
      { selectors: ['code', '.foo'] },
      { selectors: ['*', '.boo'] },
    ];

    await pluginInstance.Once?.(
      {
        // @ts-expect-error mock input
        source: { input: { file: 'foo.css' } },
        walkRules(handle) {
          testRules.forEach(r => handle(r));
          return undefined;
        },
      },
      {},
    );

    // assets
    expect(
      testRules.every(r => r.selectors.every(d => d.startsWith('.text '))),
    ).toBe(true);
  });

  it('should throw errors with invalid params', () => {
    expect(() => plugin({})).not.toThrowError();

    const invalidOptions = [
      { prefixSet: [{ regexp: /.css$/ }] },
      { prefixSet: [{ regexp: /.css$/, namespace: '' }] },
      { prefixSet: [{ regexp: 'not-a-regexp', namespace: '.prismjs' }] },
      { prefixSet: [{ regexp: 'abc', namespace: 'test' }] },
    ];

    invalidOptions.forEach(opts => {
      expect(() => plugin(opts)).toThrow(
        'Should pass valid options looks like',
      );
    });
  });

  it('should prefix selectors with the provided namespace', async () => {
    const input = `
      .foo { color: red; }
      .bar { color: blue; }
    `;

    const output = await postcss([
      plugin({
        prefixSet: [{ regexp: /.css$/, namespace: '.prismjs' }],
      }),
    ]).process(input, { from: 'test.css' });

    expect(output.css).toContain('.prismjs .foo');
    expect(output.css).toContain('.prismjs .bar');
  });

  it('should only prefix selectors for matching files', async () => {
    const input = `
      .foo { color: red; }
      .bar { color: blue; }
    `;

    const output = await postcss([
      plugin({
        prefixSet: [{ regexp: /\.other$/, namespace: '.prismjs' }],
      }),
    ]).process(input, { from: 'test.css' });

    expect(output.css).not.toContain('.prismjs .foo');
    expect(output.css).not.toContain('.prismjs .bar');
  });
});
