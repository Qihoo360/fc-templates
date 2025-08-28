import { commandScore } from './command-score';
import { type CommandProps } from './types';
export const defaultFilter: CommandProps['filter'] = (value, search, keywords) =>
  commandScore(value, search, keywords!);
