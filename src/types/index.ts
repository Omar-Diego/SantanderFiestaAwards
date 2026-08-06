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
