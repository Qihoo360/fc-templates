import { BaseSkill } from './base';
import { SkillEngine } from './engine';
import {
  // CommonQnA,
  GenerateDoc,
  EditDoc,
  WebSearch,
  LibrarySearch,
  RecommendQuestions,
  CustomPrompt,
  CodeArtifacts,
} from './skills';
import { Agent } from './skills/agent';
import { GenerateMedia } from './skills/generate-media';

export const createSkillInventory = (engine: SkillEngine): BaseSkill[] => {
  return [
    new CodeArtifacts(engine),
    new GenerateMedia(engine),
    new WebSearch(engine),
    new LibrarySearch(engine),
    new CustomPrompt(engine),
    new GenerateDoc(engine),
    new RecommendQuestions(engine),
    // new CommonQnA(engine),
    // new RewriteDoc(engine),
    new EditDoc(engine),
    new Agent(engine),
  ];
};
