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

/** Budget goal for a group: target amount per period + the day of month it resets on */
export interface BudgetConfig {
  amount: number;
  cutoffDay: number;
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
