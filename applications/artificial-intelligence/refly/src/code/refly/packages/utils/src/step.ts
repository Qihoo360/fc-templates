import { ActionStep } from '@refly/openapi-schema';

const STEP_ORDER = {
  analyzeQuery: 0,
  analyzeContext: 10,
  webSearch: 15,
  librarySearch: 16,
  generateTitle: 20,
  generateDocument: 30,
  generateCodeArtifact: 30,
  answerQuestion: 50,
};

export const sortSteps = (steps: ActionStep[]): ActionStep[] => {
  return steps.sort((a, b) => {
    const aOrder = STEP_ORDER[a.name] ?? 0;
    const bOrder = STEP_ORDER[b.name] ?? 0;

    return aOrder - bOrder;
  });
};
