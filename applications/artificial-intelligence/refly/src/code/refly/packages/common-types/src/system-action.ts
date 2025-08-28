export enum SystemAction {
  SupportUs = 'supportUs',
  InviteBoost = 'inviteBoost',
  RecommendQuestion = 'recommendQuestion',
}

export type RecommendQuestionItem = {
  type: SystemAction;
  title: string;
  question: string;
};
