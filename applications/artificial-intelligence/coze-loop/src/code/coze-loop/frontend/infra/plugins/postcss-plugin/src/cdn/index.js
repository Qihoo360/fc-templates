const postcssFunctions = require('postcss-functions');

/**@type {import("postcss").PluginCreator} */
module.exports = (opts = {}) => {
  const { cdnPrefix, validator } = opts;

  if (typeof cdnPrefix !== 'string') {
    throw new Error('无效cdnPrefix参数');
  }

  const unquote = str => str.replace(/^['"]|['"]$/g, '');

  return {
    ...postcssFunctions({
      functions: {
        cdn_resolve(asset) {
          const assetName = unquote(asset);
          validator && validator(assetName);
          return `url("${`${cdnPrefix}/${assetName}`}")`;
        },
      },
    }),
    postcssPlugin: '@coze-arch/postcss-plugin/cdn',
  };
};
