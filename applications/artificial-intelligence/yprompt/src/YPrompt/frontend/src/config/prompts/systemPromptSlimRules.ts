// 系统提示词规则 - 精简版的精英提示词工程指南
// 这是基于《Architecting Intelligence》的精简版系统提示词工程规则

export const SYSTEM_PROMPT_SLIM_RULES = `# Architecting Intelligence: Elite Prompt Engineering Guide

## Chapter 1: Philosophy of Prompting
### 1.1 Introduction
Prompt engineering designs inputs to guide LLMs toward precise outputs. It is communication-based: clear, specific prompts transform AI from generalist to specialized collaborator.

### 1.2 AI as Collaborator
AI predicts tokens statistically; prompts set conditions. Users direct (role/motivation), strategize (breakdown/scaffolding), architect (system prompts for personality/constraints).

### 1.3 Benefits
- Precision: Reduces ambiguity/ revisions.
- Efficiency: Faster complex tasks.
- Capabilities: Unlocks reasoning (step-by-step), specialization (personas).
- Specialization: E.g., code reviewer to legal analyst.

### 1.4 Overview
Covers: Anatomy, system/user prompts, strategies (Zero/Few-Shot, CoT/ToT/ReAct), structuring (XML/JSON), workflows (chaining/agents).

## Chapter 2: Anatomy of Prompt
### 2.1 Pillars: Context, Task, Format
Context (who/why), Task (what), Format (how). Weak prompts assume; elite eliminate ambiguity.

### 2.2 Context
- **Role:** Activates patterns. Less: "Analyze statements." More: "You are CFO of B2B SaaS; analyze Q2 for burn risks/growth drivers."
- **Background:** Grounds facts. Less: "Marketing email." More: "Innovate Inc. launches TaskFlow for small teams; key: one-click Kanban; draft launch email."
- **Audience:** Calibrates tone. Less: "Explain quantum." More (kid): "To 5th grader: coin heads/tails analogy." More (tech): "Superposition for undergrad: qubits vs. classical."
- **Goal:** Prioritizes. Less: "Summarize contract." More: "As CEO, identify financial/IP risks/liabilities."

### 2.3 Task
- **Verbs:** "Generate/Analyze/Rewrite"; avoid "Help/Can you."
- **Chunking:** Numbered steps. Less: "Blog on remote work: productivity/balance/titles/CTA." More: "1. 5 SEO titles. 2. 400-word post: productivity/balance examples. 3. CTA for comments."
- **Specificity:** Details. Less: "Improve code." More: "Refactor Python: 1. List comp for loops. 2. Type hints. 3. Docstring."
- **Constraints:** Affirmative. Less: "Japan trip, no expensive." More: "7-day Tokyo/Kyoto, $2000 post-flights; culture/hiking; meals <$25."

### 2.4 Format
- **Naming:** "Bulleted list/JSON/Markdown table."
- **Few-Shot:** Input-output example. Less: "Sentiment." More: "EXAMPLE: 'Clunky dashboard' -> Category: UI/Performance; Sentiment: Negative; Priority: High. NOW: 'Love integration, add Hubspot.'"
- **Elements/Tone:** "Sections: Summary/Problem/Solution; Economist style: formal/concise; <150 words."

### 2.5 Synthesis
Basic: "Email on update." Elite: **[Context]** PM for Phoenix; API delay, workaround. **[Task]** 1. Progress. 2. Delay. 3. Cause (supplier issue). 4. Solution/date. **[Format]** Subject: 'Update & Date'; professional/reassuring; <200 words.

## Chapter 3: System vs. User Prompts
### 3.1 Architecture
Actor analogy: System=character brief; User=director instructions.

### 3.2 System: Constitution
Defines identity/rules (personality/expertise/motivations/boundaries). API: system role; persistent/high-level.

### 3.3 User: Directives
Task-specific/dynamic. API: user role; action-driven/contextual.

### 3.4 Synergy/Pitfalls
Harmony: System persona + User execution. Pitfalls: System obsession (lazy users); Task contamination; No system (drift).

## Chapter 4: Zero-Shot
### 4.1 Without Examples
Direct: "Summarize briefing/Translate to Japanese/JS max function."

### 4.2 Mechanism
Activates training patterns (e.g., article-summary pairs).

### 4.3 Strengths/Uses
Simplicity/efficiency. Summarization: "3 bullets from abstract." Translation: "Formal Spanish: 'Finalize by Friday.'" QA: "Primary Q3 decline cause." Classification: "Positive/Negative/Neutral: 'Intuitive but crashes.'" Style: "Professional: 'Hey, ASAP project.'" Code: "Array max."

### 4.4 Limits
Multi-step (bat/ball: $1.10 total, bat $1 more → ball $0.05, not $0.10); novel formats; nuances (internal categories).

### 4.5 Elite
Apply C/T/F: Weak: "Email on Orion." Elite: **[Context]** PM kickoff for app redesign (15% retention). **[Task]** 1. Goal/metric. 2. Thursday 10AM. 3. Ideas/challenges. **[Format]** Energetic/collaborative; Subject: 'Kicking Off!'; Email only.

### 4.6 Base
First try; failures → Few-Shot (format)/CoT (reasoning)/ReAct (knowledge).

## Chapter 5: Few/One-Shot
### 5.1 Showing
In-context learning: Examples infer rules.

### 5.2 Terms
Zero:0; One:1; Few:2-5 (3-5 optimal).

### 5.3 Mechanism
Examples as immediate pattern for prediction.

### 5.4 Uses
- Formats: JSON extract. EXAMPLE1: "John Doe john.d@email.com JD123" → {"user_name":"John Doe","contact_email":"john.d@email.com","id":"JD123"}. EXAMPLE2: ... NOW: "Jane jane.s@email.com JS_567."
- Classification: Tickets. "Login broken" → Technical; "Charged twice" → Billing; "Dark mode" → Feature; "Declined card" → Billing. NOW: "Add team: tier limit."
- Style: Cynical tweet. EXAMPLE: "Authentic app" → "IPO then 'optimized authenticity'." NOW: "Third camera lens."

### 5.5 Principles
Consistency (labels/###); Quality (3-5 diverse/clear); Relevance (edges); Delimit (XML/###).

### 5.6 Choice
One: Simple/constrained. Few: Complex/nuanced.

## Chapter 6: Persona
### 6.1 Specialist
Activates semantic fields for depth/standards.

### 6.2 Rationale
Priming: Constrains to expert patterns.

### 6.3 First-Person
"I am senior dev..." > "You are..."

### 6.4 Elite
"Principal FAANG designer, Rams' principles: intuitive/minimalist."

### 6.5 Archetype
"Linus Torvalds rigor" for blunt review.

### 6.6 Examples
Analysis: Generic summary vs. CFO: "Skeptical, shareholder focus; risks/inflated metrics; no spin."

## Chapter 7: Chain-of-Thought (CoT)
### 7.1 Explicit Reasoning
"Think step-by-step" for logic.

### 7.2 Mechanism
Intermediate steps improve accuracy.

### 7.3 Variants
Standard; Self-Consistency (multiple, vote); ToT (branches/committee).

### 7.4 Uses
Math/planning. Bat/ball: Steps → $0.05.

### 7.5 Elite
"Mathematician: Step-by-step."

## Chapter 8: ReAct
### 8.1 Reason+Act
Loop: Observe→Think→Act (tool)→Observe.

### 8.2 Mechanism
E.g., QA: Think query → Search → Reason results.

### 8.3 Uses
Retrieval/agents. "Think: Need? Act: Query."

### 8.4 Elite
System tools; JSON actions.

## Chapter 9: Output Formatting
### 9.1 Structure
"JSON/table." Few-Shot examples. XML: <output>{json}</output>.

### 9.2 Uses
Extraction/reports.

## Chapter 10: Constructive Guidance
### 10.1 Refinement
"Improve: Add X, remove Y; urgent tone."

### 10.2 Principles
Positive/specific.

## Chapter 11: Prompt Chaining
### 11.1 Sequences
Output→Input. E.g., Summarize→Analyze→Recommend. Modular/full context.

## Chapter 12: Multi-Agent
### 12.1 Teams
Agents (researcher/writer); Orchestrator/personas.

## Chapter 13: Self-Critique
### 13.1 Review
"Assess strengths/weaknesses; improve."

### 13.2 Uses
Loops.

## Chapter 14: Affirmative Direction
### 14.1 Positive
"Focus benefits" > "Don't risks."

## Chapter 15: State Management
### 15.1 Control
"Forget prior; new task."

## Chapter 16: Trajectory Correction
### 16.1 Edit
API: Edit messages for drifts.

## Chapter 17: Pre-Execution Calibration
### 17.1 Teach-Back
"Repeat task in words."

## Chapter 18: Parameter Tuning
### 18.1 Controls
- Temperature: 0-0.3 precision; 0.7-1 creativity.
- Top-K: K probable tokens.
- Top-P: Cumulative p (adaptive).

### 18.2 Recipes
Factual: 0.0. Creative: 0.9/Top-P 0.95. Balanced: 0.75/Top-K 50.

## Chapter 19: Long Context
### 19.1 Optimization
- Instructions last.
- XML tags: <document source="Q3.txt">...</document>.
- Retrieval: Extract quotes first.
- Preamble: TOC. E.g., 3 docs summary → Full texts → Task.

### 19.2 Elite
Preamble/sources → Instructions: 1. Extract quotes (financial/cyber/rep). 2. Summary impacts.

## Chapter 20: Code Prompting
### 20.1 Generation
Context (Python 3.10/FastAPI); Steps; Non-functional (docstring/errors/types/tests). Elite: parse_log_entry regex → Dict; try/except None; pytest.

### 20.2 Debugging
Full code/error/expected; Steps: Explain→Trace→Fix. Elite: str+int error → f-string.

### 20.3 Translation
Idiomatic (async/await/map); Libs (requests→axios). Elite: Python get_user → Node async axios JSDoc.

## Chapter 21: Automatic Prompt Engineering (APE)
### 21.1 Meta
AI generates/refines from examples.

### 21.2 Workflow
Generate 10 instructions from I/O pairs; Score via tests/gold.

### 21.3 Simplified
"Critique/rewrite as power: Detailed/specific/audience/format."

E.g., Examples: "Metallica S" → "Band:Metallica,Item:T-Shirt,Qty:1,Size:S". Generate candidates.

## Chapter 22: Documentation
### 22.1 Tracking
As code: Name/version/goal/author/date/model/params/system/user/examples/gold/actual/eval/notes.

### 22.2 Workflow
Git/YAML: e.g., summarize_earnings.v1.yaml with placeholders {{REPORT}}.

## Chapter 23: Unified Framework
### 23.1 Pillars
- **Architecture:** Deconstruct; Pattern (Zero/Chaining/Agents); System persona/affirmative.
- **Conversation:** Drafts; Steering (feedback/CoT/ToT/Self-Consistency); Calibration.
- **Discipline:** Document/version; Iterate/eval/regression.

### 23.2 Synthesis: Marketing Strategy
Architecture: Multi-agent (ReAct researcher/ToT strategist/content creators/manager). Conversation: Review/refine/steer. Discipline: Git prompts/gold outputs.

### 23.3 Conclusion
Engineer as conductor: Augment via architecture/dialogue/rigor.`