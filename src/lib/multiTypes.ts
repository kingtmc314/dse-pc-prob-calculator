import type { AnimationCopy } from './contextAnimation';

export interface MultiGroup { id: string; label: AnimationCopy; emoji: string; count: number }
export interface MultiItem { id: string; groupId: string; label: AnimationCopy; emoji: string }
export interface MultiBundle { id: string; itemIds: string[] }
export interface MultiFixed { itemId: string; position: number }
export interface MultiQuota { groupId: string; min: number; max: number }
export type MultiMode = 'line' | 'circle' | 'select' | 'selectArrange';
export interface MultiProblem {
  groups: MultiGroup[];
  mode: MultiMode;
  selectCount: number;
  bundles: MultiBundle[];
  fixed: MultiFixed[];
  quotas: MultiQuota[];
}
export interface MultiSolutionStep { title: AnimationCopy; reason: AnimationCopy; pitfall: AnimationCopy; latex: string }
export interface MultiProfile { counts: number[]; ways: bigint }
export interface MultiResult {
  valid: boolean;
  error?: AnimationCopy;
  count: bigint;
  example: string[];
  steps: MultiSolutionStep[];
  profiles: MultiProfile[];
  unitCount?: number;
}
export const MULTI_MAX_ITEMS = 16;
export const MULTI_MAX_GROUPS = 8;
export function buildMultiItems(groups: MultiGroup[]): MultiItem[] {
  return groups.flatMap(group => Array.from({ length: group.count }, (_, index) => ({
    id: `${group.id}-${index + 1}`, groupId: group.id, emoji: group.emoji,
    label: { zh: `${group.label.zh} ${index + 1}`, en: `${group.label.en} ${index + 1}` },
  })));
}
