export interface AnimationCopy { zh: string; en: string }
export interface ContextItem { id: string; label: AnimationCopy; emoji: string; category: 'A' | 'B' | 'generic'; colorIndex?: number; shortLabel?: string }
export interface ContextRow {
  label: AnimationCopy;
  ids: string[];
  style?: 'pool' | 'line' | 'team' | 'bundle' | 'gaps' | 'circle';
  highlightIds?: string[];
  roles?: AnimationCopy[];
  gapIndices?: number[];
  bundleGroups?: { id: string; ids: string[]; label: AnimationCopy }[];
}
export interface ContextStep {
  title: AnimationCopy;
  reason: AnimationCopy;
  pitfall: AnimationCopy;
  latex: string;
  rows: ContextRow[];
}
export interface ContextAnimationModel {
  key: string;
  title: AnimationCopy;
  question: AnimationCopy;
  items: ContextItem[];
  steps: ContextStep[];
}
export const animationCopy = (zh: string, en: string): AnimationCopy => ({ zh, en });
export function animationItems(prefix: string, count: number, label: AnimationCopy, emoji: string, category: ContextItem['category']): ContextItem[] {
  return Array.from({ length: count }, (_, i) => ({ id: `${prefix}${i + 1}`, label: animationCopy(`${label.zh} ${i + 1}`, `${label.en} ${i + 1}`), emoji, category }));
}
