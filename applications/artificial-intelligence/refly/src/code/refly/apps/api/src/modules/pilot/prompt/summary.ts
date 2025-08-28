import { SkillInput } from '@refly/openapi-schema';

export function buildSummarySkillInput(params: {
  userQuestion: string;
  currentEpoch: number;
  maxEpoch: number;
  subtaskTitles?: string[];
  locale?: string;
}): SkillInput {
  const { userQuestion, currentEpoch, maxEpoch, subtaskTitles = [], locale = 'en-US' } = params;

  const subtaskListSection = subtaskTitles?.length
    ? `\nCompleted subtasks: ${subtaskTitles.map((t, i) => `${i + 1}. ${t}`).join(', ')}`
    : '';

  const progressRatio = currentEpoch / Math.max(maxEpoch, 1);

  let stageFocus = '';
  if (progressRatio < 0.5) {
    stageFocus = '**EARLY STAGE**: Focus on answer completeness assessment';
  } else if (progressRatio < 0.75) {
    stageFocus = '**MID STAGE**: Synthesize findings and evaluate answer reliability';
  } else {
    stageFocus =
      '**LATE STAGE**: Finalize answer quality and prepare comprehensive progress report';
  }

  const query = `# SUMMARY TASK: Context Organization and Direct Answer Generation

## TASK OVERVIEW
**Target Question**: "${userQuestion}"
**Progress**: Epoch ${currentEpoch}/${maxEpoch} (${Math.round(progressRatio * 100)}% complete)${subtaskListSection}
**Language**: ${locale}
**Current Stage**: ${stageFocus}

## EXECUTION WORKFLOW

### [Localized Phase 1 Title]
**Objective**: Synthesize and organize all available information
**Actions**:
- Collect and categorize information from all sources
- Identify key themes, patterns, and relationships
- Create logical information structure
- Establish comprehensive context foundation

### [Localized Phase 2 Title]
**Objective**: Generate complete and comprehensive answer
**Requirements**:
- Address all aspects of the target question
- Use clear, logical structure with proper sections
- Include relevant examples, data, and evidence
- Consider counterarguments and alternatives
- Use professional, clear language
- Include proper citations: [doc:ID], [res:ID], [artifact:ID]
- Add visual elements (charts, diagrams) where beneficial
- Ensure visual elements enhance rather than overwhelm content

### [Localized Phase 3 Title]
**Objective**: Evaluate answer quality and reliability
**Assessment Criteria**:
- **Completeness**: X% - [Detailed explanation of coverage]
- **Evidence Quality**: [Strong/Mixed/Weak] - [Reasoning for rating]

### [Localized Phase 4 Title]
**Objective**: Fill information gaps and ensure comprehensiveness
**Actions**:
- Identify missing or incomplete information
- Attempt to fill gaps using available sources
- Highlight areas where information is unavailable
- Suggest alternative approaches for missing data
- Ensure maximum comprehensiveness with available resources

## OUTPUT REQUIREMENTS

### [Localized Answer Title]
[Provide structured response to the target question with proper evidence citations]

### [Localized Assessment Title]
- **Completeness**: X% - [Explanation of what was covered and what was missed]
- **Evidence Quality**: [Strong/Mixed/Weak] - [Detailed reasoning for the rating]

## CONSTRAINTS & GUIDELINES
- **Focus**: Maintain absolute focus on the target question
- **Synthesis**: Use commonQnA for information synthesis
- **Language**: All output must be in ${locale} language
- **Localization**: Replace all placeholder titles with properly localized versions in ${locale}
- **Structure**: Follow the exact workflow phases and output format specified above

**Note**: Ensure all titles, including workflow phase titles and output format titles, are properly localized according to the ${locale} language specification.`;

  return { query };
}
