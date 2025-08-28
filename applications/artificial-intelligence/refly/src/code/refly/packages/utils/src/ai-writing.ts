const localeList = {};

export const writingSkills = [
  // 编辑或 review - editOrReviewSelection
  {
    prompt: '以更适于写作的目的优化目标文本',
    key: 'improveWriting',
    title: '改进写作',
    group: 'editOrReviewSelection',
  },
  {
    prompt: '修复拼写和语法错误',
    key: 'fixSpllingAndGrammar',
    title: '修复拼写和语法错误',
    group: 'editOrReviewSelection',
  },
  {
    prompt: '缩短并精炼内容',
    key: 'makeShorter',
    title: '缩短内容',
    group: 'editOrReviewSelection',
  },
  {
    prompt: '扩写内容',
    key: 'makeLonger',
    title: '扩写内容',
    group: 'editOrReviewSelection',
  },
  {
    prompt: '将选中内容修改为 {tone} 语气',
    key: 'changeTone',
    title: '修改语气',
    itemList: ['专业的', '随意的', '直接的', '自信的', '友好的'],
    variable: 'tone',
    group: 'editOrReviewSelection',
  },
  {
    prompt: '以一年级小学生能够听懂的形式保持语义不变的前提下简化这段内容',
    key: 'simplifyLanguage',
    title: '简化语言',
    group: 'editOrReviewSelection',
  },
  // 生成：generateFromSelection
  {
    prompt: '总结选中内容',
    key: 'summary',
    title: '总结',
    group: 'generateFromSelection',
  },
  {
    prompt: '将选中内容翻译为 {language} 语言',
    key: 'translate',
    title: '翻译',
    variable: 'language',
    itemList: Object.keys(localeList || {}) || [],
    group: 'generateFromSelection',
  },
  {
    prompt: '解释选中内容',
    key: 'explainThis',
    title: '解释',
    itemList: [],
    group: 'generateFromSelection',
  },
  {
    prompt: '提取待办事项',
    key: 'findActionItem',
    title: '提取代办事项',
    itemList: [],
    group: 'generateFromSelection',
  },
  // write with AI
  {
    prompt: '基于当前上下文续写并将内容补充完整',
    key: 'continueWriying',
    title: '续写',
    itemList: [],
    group: 'writeWithAI',
  },
  // Draft with AI
  {
    prompt: '脑暴想法',
    key: 'brainstormIdeas',
    title: '脑暴想法',
    itemList: [],
    group: 'draftWithAI',
  },
  {
    prompt: '撰写博客文章',
    key: 'blogPost',
    title: '撰写博客文章',
    itemList: [],
    group: 'draftWithAI',
  },
  {
    prompt: '撰写文章大纲',
    key: 'outline',
    title: '撰写文章大纲',
    itemList: [],
    group: 'draftWithAI',
  },
  {
    prompt: '撰写社交媒体文章',
    key: 'socialMediaPost',
    title: '撰写社交媒体文章',
    itemList: [],
    group: 'draftWithAI',
  },
];
