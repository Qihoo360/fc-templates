import { SearchResult } from '@refly/openapi-schema';

export interface ContextItem extends SearchResult {
  isSelected?: boolean;
}
