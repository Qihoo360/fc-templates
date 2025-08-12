/** @type {import('postcss').PluginCreator } */
const plugin = (opts = {}) => {
  const { prefixSet } = opts;

  if (
    prefixSet?.some(
      r =>
        r.regexp instanceof RegExp === false ||
        typeof r.namespace !== 'string' ||
        r.namespace.length <= 0,
    )
  ) {
    throw new Error(
      "Should pass valid options looks like [{regexp: /.css$/, namespace:'.prismjs' }]",
    );
  }

  return {
    postcssPlugin: '@coze-arch/postcss-plugin/ns',
    Once(root) {
      prefixSet
        ?.filter(r => r.regexp.test(root.source.input.file))
        ?.forEach(r => {
          const { namespace } = r;
          const ns = `${namespace.startsWith('.') ? '' : '.'}${namespace}`;
          root.walkRules(rule => {
            rule.selectors = rule.selectors.map(
              selector => `${ns} ${selector}`,
            );
          });
        });
    },
  };
};

plugin.postcss = true;

module.exports = plugin;
