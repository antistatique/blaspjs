export const Severity = {
  Mild: 'mild',
  Moderate: 'moderate',
  High: 'high',
  Extreme: 'extreme',
} as const;

export type Severity = (typeof Severity)[keyof typeof Severity];

const WEIGHTS: Record<Severity, number> = {
  [Severity.Mild]: 5,
  [Severity.Moderate]: 15,
  [Severity.High]: 30,
  [Severity.Extreme]: 50,
};

export function severityWeight(s: Severity): number {
  return WEIGHTS[s];
}

export function severityIsAtLeast(s: Severity, minimum: Severity): boolean {
  return severityWeight(s) >= severityWeight(minimum);
}

export function trySeverity(value: string | undefined): Severity | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase();
  if (v === Severity.Mild || v === Severity.Moderate || v === Severity.High || v === Severity.Extreme) {
    return v;
  }
  return undefined;
}
