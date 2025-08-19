/**
 * 最极简的模板方案
 * 直接导出 Handlebars，让用户自己决定如何使用
 */

import Handlebars from 'handlebars';

// 就这么简单，直接导出 Handlebars
export { Handlebars };

// 如果需要便捷函数，也很简单
export const compile = Handlebars.compile.bind(Handlebars);
export const registerHelper = Handlebars.registerHelper.bind(Handlebars); 