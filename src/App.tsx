import React, { useState, useEffect } from 'react';
import { 
  getEggInventory, 
  saveEggInventory, 
  getCustomItems, 
  saveCustomItems, 
  getCustomers, 
  saveCustomers, 
  getTransactions, 
  saveTransactions,
  syncAllDataWithCloud,
  deleteCustomerFromCloud,
  deleteCustomItemFromCloud,
  deleteTransactionFromCloud,
  purgeAllDbToZero,
  getShopSettings,
  saveShopSettings
} from './utils/storage';
import { EggInventory, CustomItem, Customer, Transaction } from './types';
import Dashboard from './components/Dashboard';
import NewSale from './components/NewSale';
import Products from './components/Products';
import Customers from './components/Customers';
import Transactions from './components/Transactions';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Layers, 
  Users, 
  FileText, 
  Calendar as CalendarIcon,
  Layers2,
  Store,
  MapPin,
  TrendingDown,
  Cloud,
  CloudLightning,
  CloudOff,
  Settings,
  X
} from 'lucide-react';

export default function App() {
  // Navigation View Router
  const [activeView, setActiveView] = useState<'dashboard' | 'sale' | 'products' | 'customers' | 'transactions'>('dashboard');

  // Load state from localStorage on startup
  const [eggs, setEggs] = useState<EggInventory[]>([]);
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cloudStatus, setCloudStatus] = useState<'syncing' | 'synced' | 'failed'>('synced');

  // Shop Settings and global Date Filter
  const [shopSettings, setShopSettings] = useState(() => getShopSettings());
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');

  const [showShopSettingsModal, setShowShopSettingsModal] = useState(false);
  const [tempShopName, setTempShopName] = useState(shopSettings.name);
  const [tempShopAddress, setTempShopAddress] = useState(shopSettings.address);

  useEffect(() => {
    setTempShopName(shopSettings.name);
    setTempShopAddress(shopSettings.address);
  }, [shopSettings]);

  const formatDateBangla = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const engDigits = '0123456789';
        const benDigits = '০১২৩৪৫৬৭৮৯';
        const formatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
        return formatted.split('').map(char => {
          const idx = engDigits.indexOf(char);
          return idx !== -1 ? benDigits[idx] : char;
        }).join('');
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Selected receipt state (global or linked)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Initialize Lists and Background Cloud Sync
  useEffect(() => {
    // 1. Instantly pull and render from localStorage cache
    setEggs(getEggInventory());
    setCustomItems(getCustomItems());
    setCustomers(getCustomers());
    setTransactions(getTransactions());

    // 2. Perform background Cloud Sync with Firestore
    if (navigator.onLine) {
      setCloudStatus('syncing');
      syncAllDataWithCloud()
        .then(synced => {
          if (synced) {
            setEggs(synced.eggs);
            setCustomItems(synced.customItems);
            setCustomers(synced.customers);
            setTransactions(synced.transactions);
            setCloudStatus('synced');
          } else {
            setCloudStatus('failed');
          }
        })
        .catch(err => {
          console.warn('Background sync failed on initial startup:', err);
          setCloudStatus('failed');
        });
    } else {
      setCloudStatus('failed');
    }

    // 3. Network Events Listeners for Offline/Online Syncing
    const handleWorkingOnline = () => {
      console.log('Online event detected. Pushing offline records to Cloud...');
      setCloudStatus('syncing');
      syncAllDataWithCloud()
        .then(synced => {
          if (synced) {
            setEggs(synced.eggs);
            setCustomItems(synced.customItems);
            setCustomers(synced.customers);
            setTransactions(synced.transactions);
            setCloudStatus('synced');
          } else {
            setCloudStatus('failed');
          }
        })
        .catch(err => {
          console.warn('Background sync on network restoration failed:', err);
          setCloudStatus('failed');
        });
    };

    const handleWorkingOffline = () => {
      console.log('Offline event detected. Continuing in local-first storage mode.');
      setCloudStatus('failed');
    };

    window.addEventListener('online', handleWorkingOnline);
    window.addEventListener('offline', handleWorkingOffline);

    return () => {
      window.removeEventListener('online', handleWorkingOnline);
      window.removeEventListener('offline', handleWorkingOffline);
    };
  }, []);

  // Sync state helpers
  const updateEggsState = (newEggs: EggInventory[]) => {
    setEggs(newEggs);
    saveEggInventory(newEggs);
  };

  const updateCustomItemsState = (newItems: CustomItem[]) => {
    setCustomItems(newItems);
    saveCustomItems(newItems);
  };

  const updateCustomersState = (newCustomers: Customer[]) => {
    setCustomers(newCustomers);
    saveCustomers(newCustomers);
  };

  const updateTransactionsState = (newTxList: Transaction[]) => {
    setTransactions(newTxList);
    saveTransactions(newTxList);
  };

  // State update handlers
  const handleUpdateEggStockOnly = (type: string, reduceQty: number) => {
    const updated = eggs.map(e => e.type === type ? { ...e, stock: Math.max(e.stock - reduceQty, 0) } : e);
    updateEggsState(updated);
  };

  const handleUpdateCustomStockOnly = (id: string, reduceQty: number) => {
    const updated = customItems.map(item => item.id === id ? { ...item, stock: Math.max(item.stock - reduceQty, 0) } : item);
    updateCustomItemsState(updated);
  };

  const handleUpdateCustomerDueOnly = (id: string, dueDelta: number) => {
    const updated = customers.map(c => c.id === id ? { ...c, dueAmount: Math.max(c.dueAmount + dueDelta, 0) } : c);
    updateCustomersState(updated);
  };

  const handleAddNewCustomer = (name: string, phone: string, initialDue: number): Customer => {
    const newCust: Customer = {
      id: 'cust-' + Date.now(),
      name,
      phone,
      dueAmount: initialDue
    };
    const updated = [...customers, newCust];
    updateCustomersState(updated);
    return newCust;
  };

  const handleRemoveCustomer = (id: string) => {
    const updated = customers.filter(c => c.id !== id);
    updateCustomersState(updated);
    deleteCustomerFromCloud(id);
  };

  const handleAddCustomItem = (newItem: CustomItem) => {
    const updated = [...customItems, newItem];
    updateCustomItemsState(updated);
  };

  const handleRemoveCustomItem = (id: string) => {
    const updated = customItems.filter(item => item.id !== id);
    updateCustomItemsState(updated);
    deleteCustomItemFromCloud(id);
  };

  const handleFactoryReset = async () => {
    setCloudStatus('syncing');
    const isSuccess = await purgeAllDbToZero();
    if (isSuccess) {
      setEggs(getEggInventory());
      setCustomItems(getCustomItems());
      setCustomers(getCustomers());
      setTransactions(getTransactions());
      setCloudStatus('synced');
    } else {
      setCloudStatus('failed');
    }
  };

  const handleAddTransaction = (newTx: Transaction) => {
    const updated = [newTx, ...transactions];
    updateTransactionsState(updated);
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    // 1. Delete transaction
    const newTxList = transactions.filter(t => t.id !== id);
    updateTransactionsState(newTxList);
    deleteTransactionFromCloud(id);

    // 2. Adjust customer due balance
    if (tx.customerId) {
      const dueDelta = tx.type === 'sale' ? -tx.dueAmount : tx.paidAmount;
      const updatedCustomers = customers.map(c => 
        c.id === tx.customerId ? { ...c, dueAmount: Math.max(0, c.dueAmount + dueDelta) } : c
      );
      updateCustomersState(updatedCustomers);
    }

    // 3. Adjust inventory stock
    if (tx.items && tx.items.length > 0) {
      const isSale = tx.type === 'sale';
      const isStockAdd = tx.type === 'stock_add';

      if (isSale) {
        // Put stock back
        let updatedEggs = [...eggs];
        let updatedCustom = [...customItems];
        tx.items.forEach(item => {
          if (item.type === 'egg') {
            updatedEggs = updatedEggs.map(e => e.type === item.itemId ? { ...e, stock: e.stock + item.quantity } : e);
          } else {
            updatedCustom = updatedCustom.map(c => c.id === item.itemId ? { ...c, stock: c.stock + item.quantity } : c);
          }
        });
        updateEggsState(updatedEggs);
        updateCustomItemsState(updatedCustom);
      } else if (isStockAdd) {
        // Pull stock out
        let updatedEggs = [...eggs];
        let updatedCustom = [...customItems];
        tx.items.forEach(item => {
          if (item.type === 'egg') {
            updatedEggs = updatedEggs.map(e => e.type === item.itemId ? { ...e, stock: Math.max(0, e.stock - item.quantity) } : e);
          } else {
            updatedCustom = updatedCustom.map(c => c.id === item.itemId ? { ...c, stock: Math.max(0, c.stock - item.quantity) } : c);
          }
        });
        updateEggsState(updatedEggs);
        updateCustomItemsState(updatedCustom);
      }
    }

    if (selectedTransaction?.id === id) {
      setSelectedTransaction(null);
    }
  };

  const handleEditTransaction = (oldTx: Transaction, updatedTx: Transaction) => {
    // 1. Update the transaction itself
    const newTxList = transactions.map(t => t.id === oldTx.id ? { ...t, ...updatedTx } : t);
    updateTransactionsState(newTxList);

    // 2. Adjust customer due balances
    if (oldTx.customerId === updatedTx.customerId) {
      if (oldTx.customerId) {
        const netDueDelta = updatedTx.dueAmount - oldTx.dueAmount;
        const updatedCustomers = customers.map(c => 
          c.id === oldTx.customerId ? { ...c, dueAmount: Math.max(0, c.dueAmount + netDueDelta) } : c
        );
        updateCustomersState(updatedCustomers);
      }
    } else {
      let updatedCustomers = [...customers];
      if (oldTx.customerId) {
        // Remove old transaction's effect from old customer
        updatedCustomers = updatedCustomers.map(c => 
          c.id === oldTx.customerId ? { ...c, dueAmount: Math.max(0, c.dueAmount - oldTx.dueAmount) } : c
        );
      }
      if (updatedTx.customerId) {
        // Add new transaction's effect to new customer
        updatedCustomers = updatedCustomers.map(c => 
          c.id === updatedTx.customerId ? { ...c, dueAmount: Math.max(0, c.dueAmount + updatedTx.dueAmount) } : c
        );
      }
      updateCustomersState(updatedCustomers);
    }

    if (selectedTransaction?.id === oldTx.id) {
      setSelectedTransaction({ ...selectedTransaction, ...updatedTx });
    }
  };

  const handleViewTransactionReceipt = (tx: Transaction | null) => {
    setSelectedTransaction(tx);
    if (tx && activeView !== 'transactions') {
      setActiveView('transactions');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-natural-bg text-natural-text" id="app-root-container">
      
      {/* Dynamic Header Navbar Bar */}
      <header className="sticky top-0 z-40 bg-natural-header border-b border-natural-border shadow-xs px-4 py-3 pb-3 md:py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand Brandings */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-natural-accent text-white flex items-center justify-center font-black shadow-md shadow-natural-accent/20">
              <Store className="w-5.5 h-5.5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg md:text-xl font-extrabold text-natural-dark tracking-tight leading-none">
                  {shopSettings.name}
                </h1>
                
                <button
                  type="button"
                  onClick={() => setShowShopSettingsModal(true)}
                  className="p-1 text-[#A69B84] hover:text-natural-accent hover:bg-natural-light/50 rounded transition active:scale-95 cursor-pointer"
                  title="দোকানের নাম ও ঠিকানা পরিবর্তন"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>

                {/* Cloud Connection Badge */}
                {cloudStatus === 'syncing' && (
                  <span className="inline-flex items-center gap-0.5 bg-[#FFFBEB] text-[#D97706] text-[9px] px-1.5 py-0.5 rounded-md border border-[#FCD34D] animate-pulse font-bold">
                    <CloudLightning className="w-2.5 h-2.5" />
                    <span>সিঙ্ক হচ্ছে</span>
                  </span>
                )}
                {cloudStatus === 'synced' && (
                  <span className="inline-flex items-center gap-0.5 bg-[#ECFDF5] text-[#059669] text-[9px] px-1.5 py-0.5 rounded-md border border-[#A7F3D0] font-bold">
                    <Cloud className="w-2.5 h-2.5" />
                    <span>ক্লাউড সচল</span>
                  </span>
                )}
                {cloudStatus === 'failed' && (
                  <span className="inline-flex items-center gap-0.5 bg-[#FEF2F2] text-[#DC2626] text-[9px] px-1.5 py-0.5 rounded-md border border-[#FCA5A5] font-bold">
                    <CloudOff className="w-2.5 h-2.5" />
                    <span>লোকাল ড্রাইভ</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#A69B84] font-bold mt-1 tracking-wide flex items-center gap-0.5">
                <MapPin className="w-3 h-3 text-natural-accent shrink-0" />
                {shopSettings.address}
              </p>
            </div>
          </div>

          {/* Tab Navigation items links */}
          <nav className="flex items-center gap-1.5 md:gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0" id="nav-tabs-bar">
            
            <button
              onClick={() => setActiveView('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs md:text-sm font-bold spring-transition whitespace-nowrap focus:outline-none cursor-pointer ${
                activeView === 'dashboard' 
                  ? 'bg-natural-accent text-white shadow-md shadow-natural-accent/10' 
                  : 'text-natural-text/80 hover:text-natural-dark hover:bg-natural-light'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>ড্যাশবোর্ড</span>
            </button>

            <button
              onClick={() => setActiveView('sale')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs md:text-sm font-bold spring-transition whitespace-nowrap focus:outline-none cursor-pointer ${
                activeView === 'sale' 
                  ? 'bg-natural-accent text-white shadow-md shadow-natural-accent/10' 
                  : 'text-natural-text/80 hover:text-natural-dark hover:bg-natural-light'
              }`}
            >
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span>নতুন বিক্রি</span>
            </button>

            <button
              onClick={() => setActiveView('products')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs md:text-sm font-bold spring-transition whitespace-nowrap focus:outline-none cursor-pointer ${
                activeView === 'products' 
                  ? 'bg-natural-accent text-white shadow-md shadow-natural-accent/10' 
                  : 'text-natural-text/80 hover:text-natural-dark hover:bg-natural-light'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>পণ্য ও মজুদ</span>
            </button>

            <button
              onClick={() => setActiveView('customers')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs md:text-sm font-bold spring-transition whitespace-nowrap focus:outline-none cursor-pointer ${
                activeView === 'customers' 
                  ? 'bg-natural-accent text-white shadow-md shadow-natural-accent/10' 
                  : 'text-natural-text/80 hover:text-natural-dark hover:bg-natural-light'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>ক্রেতা তালিকা</span>
            </button>

            <button
              onClick={() => setActiveView('transactions')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs md:text-sm font-bold spring-transition whitespace-nowrap focus:outline-none cursor-pointer ${
                activeView === 'transactions' 
                  ? 'bg-natural-accent text-white shadow-md shadow-natural-accent/10' 
                  : 'text-natural-text/80 hover:text-natural-dark hover:bg-natural-light'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>লেনদেন জাবেদা</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Global Date Filter Bar */}
      <div className="bg-[#FAF6EC] border-b border-natural-border px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-natural-accent" />
            <span className="font-semibold text-natural-dark">
              নির্দিষ্ট দিনের হিসাবপত্র ফিল্টার করুন:
            </span>
            {selectedDateFilter ? (
              <span className="bg-natural-accent text-[#FDFBF7] px-2.5 py-0.5 rounded-full font-bold">
                {formatDateBangla(selectedDateFilter)} এর তথ্য প্রদর্শিত হচ্ছে
              </span>
            ) : (
              <span className="bg-[#EAE4D2] text-[#2D3319] px-2.5 py-0.5 rounded-full font-bold">
                আজকের দিনের চলমান হিসাব (কোনো নির্দিষ্ট ফিল্টার নেই)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="bg-white border border-[#CDA681]/40 rounded-lg px-2.5 py-1 text-natural-dark font-medium focus:outline-none focus:ring-1 focus:ring-natural-accent outline-none font-mono"
            />
            {selectedDateFilter && (
              <button
                onClick={() => setSelectedDateFilter('')}
                className="bg-red-50 hover:bg-red-150 text-red-700 font-bold px-2 py-1 rounded-lg border border-red-200 transition cursor-pointer active:scale-95 text-[10px]"
              >
                ফিল্টার মুছুন
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Container Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-6 md:py-8">
        
        {/* Render Active View Routing Component */}
        {activeView === 'dashboard' && (
          <Dashboard
            eggs={eggs}
            customItems={customItems}
            customers={customers}
            transactions={transactions}
            onNavigate={setActiveView}
            onViewTransaction={handleViewTransactionReceipt}
            onFactoryReset={handleFactoryReset}
            selectedDateFilter={selectedDateFilter}
            shopSettings={shopSettings}
          />
        )}

        {activeView === 'sale' && (
          <NewSale
            eggs={eggs}
            customItems={customItems}
            customers={customers}
            onAddTransaction={handleAddTransaction}
            onUpdateEggStock={handleUpdateEggStockOnly}
            onUpdateCustomStock={handleUpdateCustomStockOnly}
            onUpdateCustomerDue={handleUpdateCustomerDueOnly}
            onAddNewCustomer={handleAddNewCustomer}
            onNavigate={setActiveView}
          />
        )}

        {activeView === 'products' && (
          <Products
            eggs={eggs}
            customItems={customItems}
            onUpdateEggAll={updateEggsState}
            onAddCustomItem={handleAddCustomItem}
            onRemoveCustomItem={handleRemoveCustomItem}
            onUpdateCustomAll={updateCustomItemsState}
            onAddTransaction={handleAddTransaction}
          />
        )}

        {activeView === 'customers' && (
          <Customers
            customers={customers}
            transactions={transactions}
            onAddNewCustomer={handleAddNewCustomer}
            onRemoveCustomer={handleRemoveCustomer}
            onUpdateCustomerDue={handleUpdateCustomerDueOnly}
            onAddTransaction={handleAddTransaction}
          />
        )}

        {activeView === 'transactions' && (
          <Transactions
            transactions={transactions}
            onViewTransaction={handleViewTransactionReceipt}
            selectedTransaction={selectedTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onEditTransaction={handleEditTransaction}
            customers={customers}
            selectedDateFilter={selectedDateFilter}
          />
        )}
      </main>

      {/* Humble Aesthetic Footing Credits */}
      <footer className="bg-natural-header border-t border-natural-border py-6 px-4 text-center mt-12 text-xs text-natural-text/60 font-semibold" id="shop-footer">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} {shopSettings.name} — সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="flex gap-4 text-natural-text/50">
            <span>৪ ক্যাটাগরি ডিম ট্র্যাকার</span>
            <span>•</span>
            <span>কাস্টম হর্টিকালচার পণ্য</span>
            <span>•</span>
            <span>নগদ-বকেয়া খাতা</span>
          </div>
        </div>
      </footer>

      {/* Shop Profile Settings Modal */}
      {showShopSettingsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-natural-bg rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-natural-border space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-natural-border/60 pb-3">
              <h3 className="font-bold text-natural-dark text-lg text-[#8B5E3C]">দোকানের তথ্য পরিবর্তন করুন</h3>
              <button 
                onClick={() => setShowShopSettingsModal(false)}
                className="text-natural-text/60 hover:text-natural-dark text-xl font-bold p-1 leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const updatedSettings = { name: tempShopName.trim() || 'সাব্বির পুষ্টি দোকান', address: tempShopAddress.trim() || 'হাজীগঞ্জ বাজার, চাঁদপুর' };
                setShopSettings(updatedSettings);
                saveShopSettings(updatedSettings);
                setShowShopSettingsModal(false);
                alert('দোকানের নাম ও ঠিকানা সফলভাবে পরিবর্তন করা হয়েছে!');
              }} 
              className="space-y-4"
            >
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-natural-dark">দোকানের নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: সাব্বির পুষ্টি দোকান"
                  value={tempShopName}
                  onChange={(e) => setTempShopName(e.target.value)}
                  className="w-full bg-[#FDFBF7] border border-natural-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-natural-accent text-natural-dark font-medium"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-natural-dark">ঠিকানা / মোবাইল / বিবরণ *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: হাজীগঞ্জ বাজার, চাঁদপুর"
                  value={tempShopAddress}
                  onChange={(e) => setTempShopAddress(e.target.value)}
                  className="w-full bg-[#FDFBF7] border border-natural-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-natural-accent text-natural-dark font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowShopSettingsModal(false)}
                  className="w-1/2 bg-natural-light hover:bg-[#EAE4D2] text-[#2D3319] font-bold py-2.5 rounded-xl text-sm cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-natural-accent hover:bg-natural-accent-hover text-white font-bold py-2.5 rounded-xl text-sm cursor-pointer"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
