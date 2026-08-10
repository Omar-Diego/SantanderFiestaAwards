/** A single transaction (expense) — used in the app */
export interface Transaction {
  id: string;
  date: Date;
  amount: number;
  description: string;
  createdAt: Date;
  deviceId: string;
  updatedAt?: Date;
}

/** Group information */
export interface GroupInfo {
  id: string;
  name: string;
  createdAt: Date;
}

/** A period of time during which a given budget amount was in effect */
export interface BudgetAmountEntry {
  amount: number;
  /** Start of the first budget period this amount applied to */
  since: Date;
}

/** Budget goal for a group: target amount per period + the day of month it resets on */
export interface BudgetConfig {
  amount: number;
  /** Day of month (1-31) on which each budget period resets */
  cutoffDay: number;
  /** When the budget was first created (anchors carry-over of unspent money) */
  createdAt?: Date;
  /**
   * History of budget amounts (newest last). Each past period's leftover is
   * computed with the amount that was in effect then, so changing the
   * credit for a new month never rewrites old leftovers.
   */
  amountHistory?: BudgetAmountEntry[];
  /**
   * One-time manual base for the leftover of completed periods (set from
   * Crédito to correct a miscalculated value). It covers everything up to
   * `manualCarryOverSince`; later periods keep accumulating automatically.
   */
  manualCarryOver?: number;
  /** Period start when the manual carry-over was last set */
  manualCarryOverSince?: Date;
}

/** Kind of activity event shown in the Alertas feed */
export type GroupEventType =
  | 'expense_added'
  | 'expense_updated'
  | 'expense_deleted'
  | 'budget_reached'
  | 'budget_reset';

/** A single activity event (shared between the 2 phones in real time) */
export interface GroupEvent {
  id: string;
  type: GroupEventType;
  /** Transaction description (expense events) */
  description?: string;
  /** Transaction amount (expense events) or spent/budget amount (budget events) */
  amount?: number;
  /** Budget goal (only for budget_reached / budget_reset) */
  budgetAmount?: number;
  createdAt: Date;
  /** Which phone triggered it */
  deviceId: string;
}
