// Types mirror the config schema served by the backend. Nothing here names a
// specific school or component — new schools/components/formulas just add
// new data, not new fields.

export type ComponentType = 'direct' | 'formula';

export interface PercentOfFormula {
  type: 'percentOf';
  of: string;
  percent: number;
}

export interface SumFormula {
  type: 'sum';
  of: string[];
}

export interface LinearCombinationPart {
  of: string;
  weight: number;
}

export interface LinearCombinationFormula {
  type: 'linearCombination';
  parts: LinearCombinationPart[];
}

export interface BestOfNFormula {
  type: 'bestOfN';
  of: string[];
  n: number;
  normalize: boolean;
}

export interface AverageFormula {
  type: 'average';
  of: string[];
}

// Add new formula shapes here as a union member, e.g. `| BestOfFormula`.
export type ComponentFormula = PercentOfFormula | SumFormula | LinearCombinationFormula | BestOfNFormula | AverageFormula;

export interface ComponentConfig {
  key: string;
  label: string;
  max: number;
  type: ComponentType;
  formula?: ComponentFormula;
  // Where this scheme places it, relative to its own other components — used
  // to order merged columns (e.g. two subjects' own Credit Score fields)
  // correctly when they share a label but come from different schemes.
  order: number;
}

export interface SumTotalFormula {
  type: 'sum';
}

export interface WeightedGroup {
  keys: string[];
  weight: number;
}

export interface WeightedGroupsTotalFormula {
  type: 'weightedGroups';
  groups: WeightedGroup[];
}

// A weightedTree node is a group (has `children`, each with its own weight
// — nests arbitrarily deep) or a leaf (has `keys` — same earned/max math as
// a weightedGroups group).
export interface TreeGroupNode {
  label: string;
  weight: number;
  children: TreeNode[];
}

export interface TreeLeafNode {
  label: string;
  weight: number;
  keys: string[];
}

export type TreeNode = TreeGroupNode | TreeLeafNode;

export interface WeightedTreeTotalFormula {
  type: 'weightedTree';
  root: TreeNode;
}

// Add new total shapes here as a union member.
export type TotalFormula = SumTotalFormula | WeightedGroupsTotalFormula | WeightedTreeTotalFormula;

export interface GradeScaleEntry {
  min: number;
  grade: string;
}

// Just enough to populate the selector dropdowns. The actual mark-entry
// columns/formulas are NOT here — different subjects at the same school can
// be wired to different schemes, so that detail only resolves once a
// class+subject is picked (see SchemeConfig below).
export interface SchoolSummary {
  id: number;
  name: string;
  classes: string[];
  subjects: string[];
  // Empty for schools that don't divide into terms.
  terms: string[];
}

// The resolved scheme for one specific school + class + subject.
export interface SchemeConfig {
  // What Marks Entry renders — includes Credit Score's raw input fields.
  components: ComponentConfig[];
  // What the Report Card renders — a subset of `components` that excludes
  // any field marked showInReportCard: false (e.g. Credit Score's inputs).
  reportComponents: ComponentConfig[];
  totalFormula: TotalFormula;
  gradeScale: GradeScaleEntry[];
}

export interface StudentComputed {
  components: Record<string, number>;
  total: number;
  grade: string;
  gradeOverridden: boolean;
}

export interface Student {
  id: number;
  schoolId: number;
  class: string;
  subject: string;
  term: string | null;
  name: string;
  marks: Record<string, number>;
  computed: StudentComputed;
}

export interface StructureAssignment {
  class: string;
  subject: string;
  term: string | null;
}

export interface StructureDetail {
  id: number;
  name: string;
  totalFormula: TotalFormula;
  assignedTo: StructureAssignment[];
}

// --- Half Yearly / Credit Score config ----------------------------------

export interface FieldComponentConfig {
  key: string;
  label: string;
  max: number;
  formula?: ComponentFormula;
}

export interface HalfYearlyConfig {
  component: FieldComponentConfig;
  availableComponents: ComponentConfig[];
}

// A raw input that can feed a subject's Credit Score formula. Both sources
// store an ordinary per-student mark, editable in Marks Entry — `source`
// only decides how that mark is first filled in: 'manual' starts blank (the
// teacher types it), 'bluewings' starts pre-filled with a value simulating
// an auto-fetched external system (still editable/overridable).
export interface RawField {
  key: string;
  label: string;
  max: number;
  scope: 'global' | 'subject';
  subjectName: string | null;
  source: 'manual' | 'bluewings';
}

export interface CreditScoreSubjectConfig {
  subject: string;
  component: FieldComponentConfig;
  availableFields: RawField[];
}

export interface NewRawFieldRequest {
  name: string;
  maxMarks: number;
  scope: 'global' | 'subject';
  subjectName?: string;
  source: 'manual' | 'bluewings';
}
