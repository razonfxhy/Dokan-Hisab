export type EggType = 'desi' | 'broiler' | 'duck' | 'broken';

export interface EggInventory {
  type: EggType;
  name: string; // "দেশি", "ব্রয়লার", "হাঁস", "ভাঙ্গা"
  stock: number; // in pieces
  unitPrice: number; // current selling price per egg
}

export interface CustomItem {
  id: string;
  name: string; // e.g., "আম (কেজি)", "লিচু (১০০ পিস)"
  stock: number; // quantity in stock
  unit: string; // e.g., "পিস", "কেজি", "হালি", "শত"
  unitPrice: number; // rate per unit
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  dueAmount: number; // amount they currently owe
  additionalNotes?: string;
}

export type TransactionType = 'sale' | 'payment' | 'stock_add';

export interface TransactionItem {
  type: 'egg' | 'custom';
  itemId: string; // EggType or CustomItem id
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string; // ISO string
  totalAmount: number; // total cost of sale (0 if payment)
  paidAmount: number; // amount paid in cash
  dueAmount: number; // remaining due added or subtracted
  customerId?: string; // linked customer if any
  customerName?: string; // snapshot of customer name for logs
  items?: TransactionItem[]; // list of items sold (for 'sale' type)
  notes?: string;
}
