export interface MetaRecord {
  // 分类key，例如 startup_product_research
  key: string;
  // 分类名称，例如: 这个标签涉及创业公司的产品开发、市场定位、用户体验设计和产品管理等方面。这些内容可以帮助创业者了解如何将AI技术转化为实际可用的产品，并在市场上取得成功。
  name: string;
  // 分类分数
  score: number;
  // 分类原因
  reason: string;
}

interface TopicMeta {
  id: string;
  key: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  count: number; // 属于此类 topic 的 digest 数量
}

export interface Topic {
  id: string;
  score: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  topicKey: string;
  topic: TopicMeta;
}

export interface ContentMeta {
  topics: MetaRecord[];
  contentType?: MetaRecord[];
  formats?: MetaRecord[];
  needIndex?: boolean;
  topicKeys?: string[];
}

export interface Digest {
  cid: string;
  contentId: string; // 代表此 digest 或 feed 所属于的 AIGCContent
  title: string;
  abstract: string;
  content: string;
  meta: ContentMeta;
  sources: string; // JSON string 的形式，Source[]
  weblinks: { url: string; pageMeta: string; contentMeta: string }[];
  inputs: {
    cid: string;
    title: string;
    abstract: string;
    content: string;
    meta: string;
    sourceType: string;
    sources: string; // Source[] JSON string 标识
    createdAt: string;
    updatedAt: string;
    weblinkId: string;
    inputIds: string[];
    outputIds: string[];
  }[];
  createdAt: string;
  updatedAt: string;

  topic: TopicMeta;
}

export type DateType = 'daily' | 'weekly' | 'month' | 'yearly';

export interface DigestFilter {
  date?: {
    year?: number;
    month?: number;
    day?: number;
    dateType: DateType;
  };

  topic?: string;
}
