import path from 'path';
import fs from 'fs';

import postcss from 'postcss';

import prefixPlugin from '../../src/ns/index.js';

const transform = (input: string, options, postcssOptions = {}) =>
  postcss().use(prefixPlugin(options)).process(input, postcssOptions);

describe('@coze-arch/postcss-plugin with fixtures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add prefix for all selectors', async () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, './fixtures/prism.css'),
      'utf-8',
    );

    const res = await transform(content, {
      prefixSet: [
        {
          regexp: /./,
          namespace: '.prismjs',
        },
      ],
    });

    expect(res.css).matchSnapshot();
  });
});
