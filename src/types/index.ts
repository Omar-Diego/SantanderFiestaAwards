/** Category definition */
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

/** A single transaction (expense) — used in the app */
export interface Transaction {
  id: string;
  date: Date;
  amount: number;
  description: string;
  category: string;
  notes?: string;
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
