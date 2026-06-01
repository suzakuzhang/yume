export interface TextRef {
  ref: string;          // e.g. "hexagram:1:guaCi"
  label: string;        // e.g. "乾卦 卦辞"
  layer: "经文" | "传文" | "系统说明";
  content: string;
}

export interface ReadingStrategy {
  policyName: "default_classic" | "compatible";
  changingLineCount: number;
  primaryTexts: TextRef[];
  secondaryTexts: TextRef[];
  contextualTexts?: TextRef[];
  rationale: string;
}

export interface RuleTrace {
  ruleId: string;
  ruleName: string;
  category: "casting" | "reading" | "structure" | "text_selection";
  inputEvidence: Record<string, unknown>;
  result: unknown;
  confidence: "high" | "medium" | "low";
  notes?: string;
  sourceRefs?: string[];
}

export interface InterpretationModeNote {
  mode: "strict_mode" | "compatible_mode" | "todo_verify";
  issue: string;
  chosenApproach: string;
  alternatives?: string[];
  note?: string;
}
