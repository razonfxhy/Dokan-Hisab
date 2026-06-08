import { doc, getDoc, getDocs, setDoc, deleteDoc, collection, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { EggInventory, CustomItem, Customer, Transaction } from '../types';

// Storage Keys
const EGGS_KEY = 'sabbir_shop_eggs';
const CUSTOM_ITEMS_KEY = 'sabbir_shop_custom_items';
const CUSTOMERS_KEY = 'sabbir_shop_customers';
const TRANSACTIONS_KEY = 'sabbir_shop_transactions';

// Initial Seed Data
const defaultEggs: EggInventory[] = [
  { type: 'desi', name: 'দেশি ডিম', stock: 450, unitPrice: 13.5 },
  { type: 'broiler', name: 'ব্রয়লার ডিম', stock: 1200, unitPrice: 10.5 },
  { type: 'duck', name: 'হাঁস ডিম', stock: 680, unitPrice: 15.0 },
  { type: 'broken', name: 'ভাঙ্গা ডিম', stock: 42, unitPrice: 7.0 },
];

const defaultCustomItems: CustomItem[] = [
  { id: '1', name: 'হাড়িভাঙ্গা আম', stock: 150, unit: 'কেজি', unitPrice: 110 },
  { id: '2', name: 'লিচু (রাজশাহী)', stock: 35, unit: '১০০ পিস', unitPrice: 380 },
  { id: '3', name: 'মেহেরপুরের কাঁঠাল', stock: 20, unit: 'পিস', unitPrice: 150 },
  { id: '4', name: 'চায়না মাল্টা', stock: 80, unit: 'কেজি', unitPrice: 240 },
];

const defaultCustomers: Customer[] = [
  { id: 'c1', name: 'কামাল হোসেন', phone: '01712-345678', dueAmount: 1450, additionalNotes: 'বাজারের উত্তর কোণে বাড়ি' },
  { id: 'c2', name: 'মো: আব্দুল মালেক', phone: '01823-998877', dueAmount: 600, additionalNotes: 'নিয়মিত ক্রেতা' },
  { id: 'c3', name: 'মোছা: মরিয়ম বেগম', phone: '01911-223344', dueAmount: 0, additionalNotes: '' },
  { id: 'c4', name: 'বুলবুল আহমেদ', phone: '01533-445566', dueAmount: 2450, additionalNotes: 'আড়তদার' },
];

const generatePastDate = (daysAgo: number, timeStr: string): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return `${date.toISOString().split('T')[0]}T${timeStr}:00Z`;
};

const defaultTransactions: Transaction[] = [
  {
    id: 't1',
    type: 'sale',
    date: generatePastDate(4, '09:30'),
    totalAmount: 1120,
    paidAmount: 1120,
    dueAmount: 0,
    customerName: 'নগদ খদ্দের',
    items: [
      { type: 'egg', itemId: 'broiler', itemName: 'ব্রয়লার ডিম', quantity: 80, unitPrice: 10.5, totalPrice: 840, unit: 'পিস' },
      { type: 'custom', itemId: '1', itemName: 'হাড়িভাঙ্গা আম', quantity: 2, unitPrice: 110, totalPrice: 220, unit: 'কেজি' },
      { type: 'egg', itemId: 'broken', itemName: 'ভাঙ্গা ডিম', quantity: 10, unitPrice: 6.0, totalPrice: 60, unit: 'পিস' }
    ],
    notes: 'সকালের বিক্রি'
  },
  {
    id: 't2',
    type: 'sale',
    date: generatePastDate(3, '11:15'),
    totalAmount: 2450,
    paidAmount: 1000,
    dueAmount: 1450,
    customerId: 'c1',
    customerName: 'কামাল হোসেন',
    items: [
      { type: 'egg', itemId: 'desi', itemName: 'দেশি ডিম', quantity: 100, unitPrice: 13.5, totalPrice: 1350, unit: 'পিস' },
      { type: 'custom', itemId: '2', itemName: 'লিচু (রাজশাহী)', quantity: 2, unitPrice: 380, totalPrice: 760, unit: '১০০ পিস' },
      { type: 'custom', itemId: '4', itemName: 'চায়না মাল্টা', quantity: 1, unitPrice: 240, totalPrice: 240, unit: 'কেজি' }
    ],
    notes: 'বাকি রাখা হলো, আগামী সপ্তাহে পরিশোধ করবে'
  },
  {
    id: 't3',
    type: 'sale',
    date: generatePastDate(2, '15:20'),
    totalAmount: 1200,
    paidAmount: 600,
    dueAmount: 600,
    customerId: 'c2',
    customerName: 'মো: আব্দুল মালেক',
    items: [
      { type: 'egg', itemId: 'duck', itemName: 'হাঁস ডিম', quantity: 80, unitPrice: 15.0, totalPrice: 1200, unit: 'পিস' }
    ],
    notes: 'অর্ধেক নগদ দিয়েছেন'
  },
  {
    id: 't4',
    type: 'payment',
    date: generatePastDate(1, '10:00'),
    totalAmount: 0,
    paidAmount: 1000,
    dueAmount: -1000,
    customerId: 'c4',
    customerName: 'বুলবুল আহমেদ',
    notes: 'পূর্বের বাকির কিছু অংশ পরিশোধ'
  },
  {
    id: 't5',
    type: 'stock_add',
    date: generatePastDate(1, '18:00'),
    totalAmount: 0,
    paidAmount: 0,
    dueAmount: 0,
    notes: 'মহাজন থেকে ৫০০ পিস হাঁসের ডিম স্টকে ঢোকানো হল',
    items: [
      { type: 'egg', itemId: 'duck', itemName: 'হাঁস ডিম', quantity: 500, unitPrice: 15.0, totalPrice: 0, unit: 'পিস' }
    ]
  },
  {
    id: 't6',
    type: 'sale',
    date: generatePastDate(0, '08:45'),
    totalAmount: 955,
    paidAmount: 955,
    dueAmount: 0,
    customerName: 'নগদ খদ্দের',
    items: [
      { type: 'egg', itemId: 'desi', itemName: 'দেশি ডিম', quantity: 30, unitPrice: 13.5, totalPrice: 405, unit: 'পিস' },
      { type: 'custom', itemId: '1', itemName: 'হাড়িভাঙ্গা আম', quantity: 5, unitPrice: 110, totalPrice: 550, unit: 'কেজি' }
    ],
    notes: 'ক্যাশ বিক্রি'
  }
];

// Local Load helpers
export const getEggInventory = (): EggInventory[] => {
  const data = localStorage.getItem(EGGS_KEY);
  if (!data) {
    localStorage.setItem(EGGS_KEY, JSON.stringify(defaultEggs));
    return defaultEggs;
  }
  return JSON.parse(data);
};

export const saveEggInventory = (eggs: EggInventory[]): void => {
  localStorage.setItem(EGGS_KEY, JSON.stringify(eggs));
  // Async background write
  eggs.forEach(egg => {
    setDoc(doc(db, 'eggs', egg.type), egg).catch(err => console.error('Cloud save failed for egg:', err));
  });
};

export const getCustomItems = (): CustomItem[] => {
  const data = localStorage.getItem(CUSTOM_ITEMS_KEY);
  if (!data) {
    localStorage.setItem(CUSTOM_ITEMS_KEY, JSON.stringify(defaultCustomItems));
    return defaultCustomItems;
  }
  return JSON.parse(data);
};

export const saveCustomItems = (items: CustomItem[]): void => {
  localStorage.setItem(CUSTOM_ITEMS_KEY, JSON.stringify(items));
  // Async update of docs
  items.forEach(item => {
    setDoc(doc(db, 'customItems', item.id), item).catch(err => console.error('Cloud save failed for custom item:', err));
  });
};

export const getCustomers = (): Customer[] => {
  const data = localStorage.getItem(CUSTOMERS_KEY);
  if (!data) {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(defaultCustomers));
    return defaultCustomers;
  }
  return JSON.parse(data);
};

export const saveCustomers = (customers: Customer[]): void => {
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  // Async background write
  customers.forEach(cust => {
    setDoc(doc(db, 'customers', cust.id), cust).catch(err => console.error('Cloud save failed for customer:', err));
  });
};

export const getTransactions = (): Transaction[] => {
  const data = localStorage.getItem(TRANSACTIONS_KEY);
  if (!data) {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(defaultTransactions));
    return defaultTransactions;
  }
  return JSON.parse(data);
};

export const saveTransactions = (transactions: Transaction[]): void => {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  // Async write
  transactions.forEach(tx => {
    setDoc(doc(db, 'transactions', tx.id), tx).catch(err => console.error('Cloud save failed for transaction:', err));
  });
};

// Document deletions helper
export const deleteCustomItemFromCloud = (id: string) => {
  deleteDoc(doc(db, 'customItems', id)).catch(err => console.warn('Cloud delete failed for custom item:', err));
};

export const deleteCustomerFromCloud = (id: string) => {
  deleteDoc(doc(db, 'customers', id)).catch(err => console.warn('Cloud delete failed for customer:', err));
};

// FULL Cloud sync task. Synchronizes with firestore and returns updated data
export const syncAllDataWithCloud = async () => {
  try {
    // 1. Sync eggs
    const eggsSnapshot = await getDocs(collection(db, 'eggs'));
    let syncedEggs: EggInventory[] = [];
    if (eggsSnapshot.empty) {
      // Seed Cloud
      for (const e of defaultEggs) {
        await setDoc(doc(db, 'eggs', e.type), e);
      }
      syncedEggs = defaultEggs;
    } else {
      eggsSnapshot.forEach(docSnap => {
        syncedEggs.push(docSnap.data() as EggInventory);
      });
    }
    localStorage.setItem(EGGS_KEY, JSON.stringify(syncedEggs));

    // 2. Sync customItems
    const itemsSnapshot = await getDocs(collection(db, 'customItems'));
    let syncedItems: CustomItem[] = [];
    if (itemsSnapshot.empty) {
      for (const item of defaultCustomItems) {
        await setDoc(doc(db, 'customItems', item.id), item);
      }
      syncedItems = defaultCustomItems;
    } else {
      itemsSnapshot.forEach(docSnap => {
        syncedItems.push(docSnap.data() as CustomItem);
      });
    }
    localStorage.setItem(CUSTOM_ITEMS_KEY, JSON.stringify(syncedItems));

    // 3. Sync customers
    const custSnapshot = await getDocs(collection(db, 'customers'));
    let syncedCustomers: Customer[] = [];
    if (custSnapshot.empty) {
      for (const cust of defaultCustomers) {
        await setDoc(doc(db, 'customers', cust.id), cust);
      }
      syncedCustomers = defaultCustomers;
    } else {
      custSnapshot.forEach(docSnap => {
        syncedCustomers.push(docSnap.data() as Customer);
      });
    }
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(syncedCustomers));

    // 4. Sync transactions
    const txSnapshot = await getDocs(collection(db, 'transactions'));
    let syncedTx: Transaction[] = [];
    if (txSnapshot.empty) {
      for (const tx of defaultTransactions) {
        await setDoc(doc(db, 'transactions', tx.id), tx);
      }
      syncedTx = defaultTransactions;
    } else {
      txSnapshot.forEach(docSnap => {
        syncedTx.push(docSnap.data() as Transaction);
      });
      // Sort reverse by date
      syncedTx.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(syncedTx));

    return {
      eggs: syncedEggs,
      customItems: syncedItems,
      customers: syncedCustomers,
      transactions: syncedTx
    };
  } catch (error) {
    console.warn('Real-time database loading failed/offline, using cache:', error);
    return null;
  }
};
