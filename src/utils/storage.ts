import { doc, getDocs, setDoc, deleteDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { EggInventory, CustomItem, Customer, Transaction } from '../types';

// Storage Keys
const EGGS_KEY = 'sabbir_shop_eggs';
const CUSTOM_ITEMS_KEY = 'sabbir_shop_custom_items';
const CUSTOMERS_KEY = 'sabbir_shop_customers';
const TRANSACTIONS_KEY = 'sabbir_shop_transactions';
const PENDING_SYNC_KEY = 'sabbir_shop_pending_sync';

// Zero-Value Core Initialization Datasets (Requested 0-default)
const defaultEggs: EggInventory[] = [
  { type: 'desi', name: 'দেশি ডিম', stock: 0, unitPrice: 0 },
  { type: 'broiler', name: 'ব্রয়লার ডিম', stock: 0, unitPrice: 0 },
  { type: 'duck', name: 'হাঁস ডিম', stock: 0, unitPrice: 0 },
  { type: 'broken', name: 'ভাঙ্গা ডিম', stock: 0, unitPrice: 0 },
];

const defaultCustomItems: CustomItem[] = [];
const defaultCustomers: Customer[] = [];
const defaultTransactions: Transaction[] = [];

// Interface for Offline Queue Operations
interface PendingSync {
  eggs: boolean;
  customItems: { [id: string]: CustomItem | 'delete' };
  customers: { [id: string]: Customer | 'delete' };
  transactions: { [id: string]: Transaction | 'delete' };
}

// Self-Executing Local Purge Block
// Removes leftover mock/seed database representations to transition to pristine states safely.
(() => {
  try {
    const localEggsData = localStorage.getItem(EGGS_KEY);
    if (localEggsData) {
      const parsed = JSON.parse(localEggsData);
      if (Array.isArray(parsed) && parsed.some(e => e.type === 'desi' && e.stock === 450)) {
        localStorage.removeItem(EGGS_KEY);
      }
    }
    
    const localCustData = localStorage.getItem(CUSTOMERS_KEY);
    if (localCustData) {
      const parsed = JSON.parse(localCustData);
      if (Array.isArray(parsed) && parsed.some(c => c.id === 'c1')) {
        localStorage.removeItem(CUSTOMERS_KEY);
      }
    }

    const localItemsData = localStorage.getItem(CUSTOM_ITEMS_KEY);
    if (localItemsData) {
      const parsed = JSON.parse(localItemsData);
      if (Array.isArray(parsed) && parsed.some(i => i.id === '1')) {
        localStorage.removeItem(CUSTOM_ITEMS_KEY);
      }
    }

    const localTxData = localStorage.getItem(TRANSACTIONS_KEY);
    if (localTxData) {
      const parsed = JSON.parse(localTxData);
      if (Array.isArray(parsed) && parsed.some(t => t.id === 't1')) {
        localStorage.removeItem(TRANSACTIONS_KEY);
      }
    }
  } catch (err) {
    console.warn('LocalStorage cleanup failed:', err);
  }
})();

// Pending Sync Queue getters and savers
const getPendingSync = (): PendingSync => {
  const data = localStorage.getItem(PENDING_SYNC_KEY);
  if (!data) {
    return {
      eggs: false,
      customItems: {},
      customers: {},
      transactions: {}
    };
  }
  return JSON.parse(data);
};

const savePendingSync = (sync: PendingSync): void => {
  localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(sync));
};

// Queue markers
const markEggUnsynced = () => {
  const sync = getPendingSync();
  sync.eggs = true;
  savePendingSync(sync);
};

const markCustomItemUnsynced = (id: string, item: CustomItem | 'delete') => {
  const sync = getPendingSync();
  sync.customItems[id] = item;
  savePendingSync(sync);
};

const markCustomerUnsynced = (id: string, customer: Customer | 'delete') => {
  const sync = getPendingSync();
  sync.customers[id] = customer;
  savePendingSync(sync);
};

const markTransactionUnsynced = (id: string, transaction: Transaction | 'delete') => {
  const sync = getPendingSync();
  sync.transactions[id] = transaction;
  savePendingSync(sync);
};

// Local Retrieve and Load Operations
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
  if (navigator.onLine) {
    eggs.forEach(egg => {
      setDoc(doc(db, 'eggs', egg.type), egg).catch(err => {
        console.warn('Egg cloud save failed - queued for offline:', err);
        markEggUnsynced();
      });
    });
  } else {
    markEggUnsynced();
  }
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
  items.forEach(item => {
    if (navigator.onLine) {
      setDoc(doc(db, 'customItems', item.id), item).catch(err => {
        console.warn('Custom item cloud save failed - queued for offline:', err);
        markCustomItemUnsynced(item.id, item);
      });
    } else {
      markCustomItemUnsynced(item.id, item);
    }
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
  customers.forEach(cust => {
    if (navigator.onLine) {
      setDoc(doc(db, 'customers', cust.id), cust).catch(err => {
        console.warn('Customer cloud save failed - queued for offline:', err);
        markCustomerUnsynced(cust.id, cust);
      });
    } else {
      markCustomerUnsynced(cust.id, cust);
    }
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
  transactions.forEach(tx => {
    if (navigator.onLine) {
      setDoc(doc(db, 'transactions', tx.id), tx).catch(err => {
        console.warn('Transaction cloud save failed - queued for offline:', err);
        markTransactionUnsynced(tx.id, tx);
      });
    } else {
      markTransactionUnsynced(tx.id, tx);
    }
  });
};

// Document deletions helper
export const deleteCustomItemFromCloud = (id: string) => {
  if (navigator.onLine) {
    deleteDoc(doc(db, 'customItems', id)).catch(err => {
      console.warn('Custom item cloud delete failed - queued offline:', err);
      markCustomItemUnsynced(id, 'delete');
    });
  } else {
    markCustomItemUnsynced(id, 'delete');
  }
};

export const deleteCustomerFromCloud = (id: string) => {
  if (navigator.onLine) {
    deleteDoc(doc(db, 'customers', id)).catch(err => {
      console.warn('Customer cloud delete failed - queued offline:', err);
      markCustomerUnsynced(id, 'delete');
    });
  } else {
    markCustomerUnsynced(id, 'delete');
  }
};

export const deleteTransactionFromCloud = (id: string) => {
  if (navigator.onLine) {
    deleteDoc(doc(db, 'transactions', id)).catch(err => {
      console.warn('Transaction cloud delete failed - queued offline:', err);
      markTransactionUnsynced(id, 'delete');
    });
  } else {
    markTransactionUnsynced(id, 'delete');
  }
};

// PUSH Pending offline changes to Cloud whenever connected
export const pushPendingDataToCloud = async (): Promise<boolean> => {
  if (!navigator.onLine) return false;
  
  const sync = getPendingSync();
  let hasTransfers = false;
  
  try {
    // 1. Sync Eggs
    if (sync.eggs) {
      const eggs = getEggInventory();
      for (const egg of eggs) {
        await setDoc(doc(db, 'eggs', egg.type), egg);
      }
      sync.eggs = false;
      hasTransfers = true;
    }
    
    // 2. Sync Custom Items
    for (const [id, value] of Object.entries(sync.customItems)) {
      if (value === 'delete') {
        await deleteDoc(doc(db, 'customItems', id));
      } else {
        await setDoc(doc(db, 'customItems', id), value);
      }
      delete sync.customItems[id];
      hasTransfers = true;
    }
    
    // 3. Sync Customers
    for (const [id, value] of Object.entries(sync.customers)) {
      if (value === 'delete') {
        await deleteDoc(doc(db, 'customers', id));
      } else {
        await setDoc(doc(db, 'customers', id), value);
      }
      delete sync.customers[id];
      hasTransfers = true;
    }
    
    // 4. Sync Transactions
    for (const [id, value] of Object.entries(sync.transactions)) {
      if (value === 'delete') {
        await deleteDoc(doc(db, 'transactions', id));
      } else {
        await setDoc(doc(db, 'transactions', id), value);
      }
      delete sync.transactions[id];
      hasTransfers = true;
    }
    
    savePendingSync(sync);
    return hasTransfers;
  } catch (error) {
    console.warn('Failed process during offline data push:', error);
    return false;
  }
};

// FULL Cloud sync task. Synchronizes with firestore and returns updated data
export const syncAllDataWithCloud = async () => {
  try {
    // Force retry pending offline transactions first to keep database synced
    await pushPendingDataToCloud();

    // 1. Sync eggs
    const eggsSnapshot = await getDocs(collection(db, 'eggs'));
    let syncedEggs: EggInventory[] = [];
    if (eggsSnapshot.empty) {
      // Seed Cloud with zero elements
      for (const e of defaultEggs) {
        await setDoc(doc(db, 'eggs', e.type), e);
      }
      syncedEggs = defaultEggs;
    } else {
      eggsSnapshot.forEach(docSnap => {
        syncedEggs.push(docSnap.data() as EggInventory);
      });
      
      // If syncedEggs contains old default non-zero values, reset them
      const hasOldMockEggStock = syncedEggs.some(e => 
        (e.type === 'desi' && e.stock === 450) || 
        (e.type === 'broiler' && e.stock === 1200) || 
        (e.type === 'duck' && e.stock === 680) || 
        (e.type === 'broken' && e.stock === 42)
      );
      if (hasOldMockEggStock) {
        syncedEggs = defaultEggs;
        for (const e of defaultEggs) {
          await setDoc(doc(db, 'eggs', e.type), e);
        }
      }
    }
    localStorage.setItem(EGGS_KEY, JSON.stringify(syncedEggs));

    // 2. Sync customItems
    const itemsSnapshot = await getDocs(collection(db, 'customItems'));
    let syncedItems: CustomItem[] = [];
    if (!itemsSnapshot.empty) {
      itemsSnapshot.forEach(docSnap => {
        const item = docSnap.data() as CustomItem;
        if (!['1', '2', '3', '4'].includes(item.id)) {
          syncedItems.push(item);
        } else {
          deleteDoc(doc(db, 'customItems', item.id)).catch(() => {});
        }
      });
    }
    localStorage.setItem(CUSTOM_ITEMS_KEY, JSON.stringify(syncedItems));

    // 3. Sync customers
    const custSnapshot = await getDocs(collection(db, 'customers'));
    let syncedCustomers: Customer[] = [];
    if (!custSnapshot.empty) {
      custSnapshot.forEach(docSnap => {
        const cust = docSnap.data() as Customer;
        if (!['c1', 'c2', 'c3', 'c4'].includes(cust.id)) {
          syncedCustomers.push(cust);
        } else {
          deleteDoc(doc(db, 'customers', cust.id)).catch(() => {});
        }
      });
    }
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(syncedCustomers));

    // 4. Sync transactions
    const txSnapshot = await getDocs(collection(db, 'transactions'));
    let syncedTx: Transaction[] = [];
    if (!txSnapshot.empty) {
      txSnapshot.forEach(docSnap => {
        const tx = docSnap.data() as Transaction;
        if (!['t1', 't2', 't3', 't4', 't5', 't6'].includes(tx.id)) {
          syncedTx.push(tx);
        } else {
          deleteDoc(doc(db, 'transactions', tx.id)).catch(() => {});
        }
      });
      syncedTx.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(syncedTx));

    // Heuristic: If there are absolutely zero receipts recorded, any positive egg stock must be residual mockup data.
    // Force reset all egg stock to zero to guarantee zero-defaults on clean runs.
    if (syncedTx.length === 0) {
      syncedEggs = defaultEggs;
      for (const e of defaultEggs) {
        await setDoc(doc(db, 'eggs', e.type), e);
      }
      localStorage.setItem(EGGS_KEY, JSON.stringify(syncedEggs));
    }

    return {
      eggs: syncedEggs,
      customItems: syncedItems,
      customers: syncedCustomers,
      transactions: syncedTx
    };
  } catch (error) {
    console.warn('Real-time cloud database offline, falling back securely to local storage cache:', error);
    return null;
  }
};

// FULL FACTORY RESET CONTROL: Wipes all collections to absolute clean zero
export const purgeAllDbToZero = async (): Promise<boolean> => {
  try {
    // 1. Flush local cache immediately
    localStorage.setItem(EGGS_KEY, JSON.stringify(defaultEggs));
    localStorage.setItem(CUSTOM_ITEMS_KEY, JSON.stringify([]));
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify([]));
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify([]));
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify({
      eggs: false,
      customItems: {},
      customers: {},
      transactions: {}
    }));

    // 2. Wipe Firestore collection documents if network is online
    if (navigator.onLine) {
      for (const egg of defaultEggs) {
        await setDoc(doc(db, 'eggs', egg.type), egg);
      }

      const customItemsSnap = await getDocs(collection(db, 'customItems'));
      for (const d of customItemsSnap.docs) {
        await deleteDoc(doc(db, 'customItems', d.id));
      }

      const customersSnap = await getDocs(collection(db, 'customers'));
      for (const d of customersSnap.docs) {
        await deleteDoc(doc(db, 'customers', d.id));
      }

      const txsSnap = await getDocs(collection(db, 'transactions'));
      for (const d of txsSnap.docs) {
        await deleteDoc(doc(db, 'transactions', d.id));
      }
    }
    return true;
  } catch (error) {
    console.error('Failure during factory reset collection wipe:', error);
    return false;
  }
};

export interface ShopSettings {
  name: string;
  address: string;
}

export const getShopSettings = (): ShopSettings => {
  const data = localStorage.getItem('sabbir_shop_settings');
  if (!data) {
    return { name: 'সাব্বির পুষ্টি দোকান', address: 'হাজীগঞ্জ বাজার, চাঁদপুর' };
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return { name: 'সাব্বির পুষ্টি দোকান', address: 'হাজীগঞ্জ বাজার, চাঁদপুর' };
  }
};

export const saveShopSettings = (settings: ShopSettings): void => {
  localStorage.setItem('sabbir_shop_settings', JSON.stringify(settings));
};


