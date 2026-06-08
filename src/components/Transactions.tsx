import React, { useState } from 'react';
import { Transaction, TransactionItem, Customer } from '../types';
import { 
  Calendar, 
  Search, 
  Filter, 
  ShoppingCart, 
  DollarSign, 
  Layers, 
  Printer, 
  X, 
  Check, 
  ArrowUpRight,
  Edit2,
  Trash2,
  Save,
  AlertTriangle
} from 'lucide-react';

interface TransactionsProps {
  transactions: Transaction[];
  onViewTransaction: (tx: Transaction | null) => void;
  selectedTransaction: Transaction | null;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (oldTx: Transaction, updatedTx: Transaction) => void;
  customers: Customer[];
}

export default function Transactions({
  transactions,
  onViewTransaction,
  selectedTransaction,
  onDeleteTransaction,
  onEditTransaction,
  customers
}: TransactionsProps) {
  // Filters
  const [filterType, setFilterType] = useState<'all' | 'sale' | 'payment' | 'stock_add'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit & Delete confirmation states
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editTotal, setEditTotal] = useState(0);
  const [editPaid, setEditPaid] = useState(0);
  const [editCustomerId, setEditCustomerId] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const startEditing = () => {
    if (!selectedTransaction) return;
    setIsEditing(true);
    const dt = new Date(selectedTransaction.date);
    const tzOffset = dt.getTimezoneOffset() * 60000;
    const localISOTime = new Date(dt.getTime() - tzOffset).toISOString().slice(0, 16);
    setEditDate(localISOTime);
    setEditTotal(selectedTransaction.totalAmount);
    setEditPaid(selectedTransaction.paidAmount);
    setEditCustomerId(selectedTransaction.customerId || '');
    setEditNotes(selectedTransaction.notes || '');
    setShowDeleteConfirm(false);
  };

  const handleSaveEdit = () => {
    if (!selectedTransaction) return;

    const total = parseFloat(String(editTotal)) || 0;
    const paid = parseFloat(String(editPaid)) || 0;

    if (paid > total && selectedTransaction.type === 'sale') {
      alert('আদায়কৃত টাকা মোট হিসেবের চেয়ে বেশি হতে পারে না!');
      return;
    }

    const linkedCust = customers.find(c => c.id === editCustomerId);
    const updatedTx: Transaction = {
      ...selectedTransaction,
      date: new Date(editDate).toISOString(),
      totalAmount: total,
      paidAmount: paid,
      dueAmount: selectedTransaction.type === 'payment' ? -paid : Math.max(0, total - paid),
      customerId: editCustomerId || undefined,
      customerName: editCustomerId ? (linkedCust?.name || 'খুচরা খদ্দের') : 'নগদ খদ্দের',
      notes: editNotes
    };

    onEditTransaction(selectedTransaction, updatedTx);
    setIsEditing(false);
  };

  const handleViewTxWithReset = (tx: Transaction | null) => {
    setIsEditing(false);
    setShowDeleteConfirm(false);
    onViewTransaction(tx);
  };

  // Format Helper
  const formatPrice = (price: number) => `৳${price.toLocaleString('bn-BD')}`;
  const formatNumberBengali = (num: number) => num.toLocaleString('bn-BD');

  // Filter Transactions
  const filteredTransactions = transactions
    .filter(tx => {
      // Type filter
      if (filterType !== 'all' && tx.type !== filterType) return false;
      
      // Search text (customer name or notes)
      const matchesSearch = 
        (tx.customerName && tx.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (tx.notes && tx.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (tx.items && tx.items.some(i => i.itemName.toLowerCase().includes(searchQuery.toLowerCase())));

      return matchesSearch;
    })
    // Sort descending by date
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Print function (simulated)
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="transactions-registry-workspace">
      
      {/* Transaction Summary List table */}
      <div className={`${selectedTransaction ? 'lg:col-span-7' : 'lg:col-span-12'} bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4`}>
        
        {/* Title and stats bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-50 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="text-indigo-600 w-5 h-5" />
            <h3 className="font-bold text-slate-800 text-base">হিসাব খাতা ও ক্যাশ বা ডেবিট ট্র্যাকিং</h3>
          </div>
          
          <span className="text-xs text-slate-400 font-semibold select-none">
            মোট রেকর্ড: {formatNumberBengali(filteredTransactions.length)} বার
          </span>
        </div>

        {/* Filters Controls block */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Searching input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ক্রেতার নাম, পণ্য বা নোট বিবরণী দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Quick tab filters */}
          <div className="flex bg-slate-100 hover:bg-slate-150 rounded-lg p-0.5 text-xs select-none">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-md font-bold transition cursor-pointer ${filterType === 'all' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}
            >
              সব
            </button>
            <button
              onClick={() => setFilterType('sale')}
              className={`px-3 py-1.5 rounded-md font-bold transition cursor-pointer ${filterType === 'sale' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}
            >
              বিক্রি এন্ট্রি
            </button>
            <button
              onClick={() => setFilterType('payment')}
              className={`px-3 py-1.5 rounded-md font-bold transition cursor-pointer ${filterType === 'payment' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}
            >
              পরিশোধ এন্ট্রি
            </button>
            <button
              onClick={() => setFilterType('stock_add')}
              className={`px-3 py-1.5 rounded-md font-bold transition cursor-pointer ${filterType === 'stock_add' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}
            >
              মজুদ বৃদ্ধি
            </button>
          </div>
        </div>

        {/* Master Transactions table grid */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            খাতায় কোনো লেনদেন বা প্রাপ্তি ম্যাচ করেনি!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase font-semibold bg-slate-50/50">
                  <th className="py-2.5 px-3">তারিখ ও সময়</th>
                  <th className="py-2.5 px-3">লেনদেন প্রকার</th>
                  <th className="py-2.5 px-3">বিবরণ / ক্রেতা</th>
                  <th className="py-2.5 px-3 text-right">মোট ভ্যালু</th>
                  <th className="py-2.5 px-3 text-right">নগদ প্রদান</th>
                  <th className="py-2.5 px-3 text-right text-red-500">বাকি পরিমাণ</th>
                  <th className="py-2.5 px-3 text-center">একশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map(tx => {
                  const dateObj = new Date(tx.date);
                  const dateStr = dateObj.toLocaleDateString('bn-BD', { month: 'short', day: 'numeric', year: 'numeric' });
                  const timeStr = dateObj.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', hour12: true });
                  
                  const isSelected = selectedTransaction?.id === tx.id;

                  return (
                    <tr 
                      key={tx.id} 
                      onClick={() => handleViewTxWithReset(tx)}
                      className={`hover:bg-slate-50 cursor-pointer spring-transition group ${isSelected ? 'bg-indigo-50/30 font-semibold' : ''}`}
                    >
                      <td className="py-3 px-3 text-xs text-slate-500">
                        {dateStr} <span className="block text-[10px] text-slate-400">{timeStr}</span>
                      </td>
                      <td className="py-3 px-3">
                        {tx.type === 'sale' && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                            বিক্রি
                          </span>
                        )}
                        {tx.type === 'payment' && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                            পরিশোধ
                          </span>
                        )}
                        {tx.type === 'stock_add' && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-50 text-amber-700 border border-amber-100">
                            স্টক-ইন
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {tx.customerName || tx.notes || 'সাধারণ স্টক রেকর্ড'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {tx.totalAmount > 0 ? formatPrice(tx.totalAmount) : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-600">
                        {tx.paidAmount > 0 ? formatPrice(tx.paidAmount) : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        {tx.type === 'payment' ? (
                          <span className="text-emerald-600 font-semibold">{formatPrice(tx.dueAmount)}</span>
                        ) : tx.dueAmount > 0 ? (
                          <span className="text-red-500 font-semibold">{formatPrice(tx.dueAmount)}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewTxWithReset(tx);
                          }}
                          className={`text-indigo-600 hover:text-indigo-800 bg-slate-100 hover:bg-slate-200 text-xs py-1 px-2.5 rounded-md font-medium inline-flex items-center gap-1 cursor-pointer`}
                        >
                          রশিদ
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Right Column: Physical Receipt Style Viewer */}
      {selectedTransaction && (
        <div className="lg:col-span-5 relative spring-transition">
          <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 text-left relative overflow-hidden space-y-5" style={{ backgroundImage: 'radial-gradient(circle, #fbfbfb 10%, transparent 11%)', backgroundSize: '12px 12px' }}>
            
            <button
              onClick={() => handleViewTxWithReset(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full cursor-pointer transition leading-none text-md"
            >
              ×
            </button>

            {/* Receipt Ribbon effect */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-600"></div>

            {isEditing ? (
              <div className="space-y-4 pt-4 animate-fadeIn" id="ledger-edit-workspace-form">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 text-indigo-700">
                    <Edit2 className="w-4 h-4" />
                    <span>লেনদেন বিবরণী সংশোধন</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">রশিদ আইডি: #{selectedTransaction.id.split('-').pop() || selectedTransaction.id}</p>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">তারিখ ও সময়:</label>
                    <input 
                      type="datetime-local" 
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">সংশ্লিষ্ট ক্রেতা:</label>
                    <select 
                      value={editCustomerId}
                      onChange={(e) => setEditCustomerId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">নগদ খদ্দের (ক্যাশ কাস্টমার)</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                      ))}
                    </select>
                  </div>

                  {selectedTransaction.type === 'sale' && (
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">মোট বিল ও পণ্যের মূল্য (৳):</label>
                      <input 
                        type="number" 
                        value={editTotal}
                        onChange={(e) => setEditTotal(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">
                      {selectedTransaction.type === 'payment' ? 'আদায়কৃত নগদ জমার পরিমাণ (৳):' : 'নগদ আদায়কৃত ক্যাশ (৳):'}
                    </label>
                    <input 
                      type="number" 
                      value={editPaid}
                      onChange={(e) => setEditPaid(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="bg-amber-50/50 p-2.5 rounded-lg space-y-1 text-[11px] border border-amber-100">
                    <div className="flex justify-between font-semibold text-slate-600">
                      <span>হিসাব শ্রেণী:</span>
                      <span className="font-bold">
                        {selectedTransaction.type === 'sale' ? 'নতুন বিক্রি বিক্রয়খাতা' : selectedTransaction.type === 'payment' ? 'বকেয়া উসুল/পরিশোধ' : 'মজুদ বৃদ্ধির ক্রয়াবরণ'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>সংশোধিত বকেয়া (Due):</span>
                      {selectedTransaction.type === 'payment' ? (
                        <span className="text-emerald-600 font-extrabold">৳{editPaid.toLocaleString('bn-BD')} বকেয়া কমবে</span>
                      ) : (editTotal - editPaid > 0) ? (
                        <span className="text-red-500 font-extrabold">৳{(editTotal - editPaid).toLocaleString('bn-BD')} বকেয়া বৃদ্ধি পাবে</span>
                      ) : (
                        <span className="text-emerald-700 font-extrabold">কোনো বকেয়া থাকবে না</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">মন্তব্য ও নোটখাতা:</label>
                    <textarea 
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="কোনো বিশেষ বিবরণ বা মন্তব্য..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[55px]"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs flex justify-center items-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <span>বাতিল</span>
                  </button>

                  <button
                    onClick={handleSaveEdit}
                    className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs flex justify-center items-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>সংরক্ষণ করুন</span>
                  </button>
                </div>
              </div>
            ) : showDeleteConfirm ? (
              <div className="text-center py-6 space-y-4 animate-fadeIn" id="ledger-delete-workspace-card">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500 border border-red-100">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                
                <div className="space-y-1.5 text-center">
                  <h3 className="font-extrabold text-slate-800 text-sm">লেনদেন ডিলিট নিশ্চিতকরণ</h3>
                  <p className="text-slate-500 text-xs px-2 leading-relaxed">
                    আপনি কি নিশ্চিতভাবে এই রশিদ ও লেনদেনটি চিরতরে মুছে ফেলতে চান? এটি মুছে ফেললে কাস্টমারের বকেয়া খাতা এবং ডিমের মজুদ পরিমাণ স্বয়ংক্রিয়ভাবে সমন্বয় বা আগের অবস্থায় ফিরে যাবে।
                  </p>
                </div>

                <div className="flex gap-2 max-w-xs mx-auto pt-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs cursor-pointer text-center"
                  >
                    না, ফেরত যান
                  </button>
                  <button
                    onClick={() => {
                      onDeleteTransaction(selectedTransaction.id);
                      setShowDeleteConfirm(false);
                    }}
                    className="w-1/2 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer text-center active:scale-95 transition"
                  >
                    হ্যাঁ, ডিলিট করুন
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Receipt Header */}
                <div className="text-center space-y-1.5 pt-2 border-b border-dashed border-slate-300 pb-4">
                  <h2 className="text-xl font-bold text-slate-800">সাব্বির পুষ্টি দোকান</h2>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed">দেশি, ব্রয়লার, হাঁস ও ভাঙ্গা ডিমের আড়ত</p>
                  <p className="text-slate-400 text-[10px] font-semibold">মোবাইল: ০১৭১০০০০০০০ • বাজার রোড, সদর</p>
                </div>

                {/* Meta Info */}
                <div className="space-y-1 text-xs text-slate-600 pb-3 border-b border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">রশিদ নং:</span>
                    <span className="font-mono font-bold text-slate-700">#{selectedTransaction.id.split('-').pop() || selectedTransaction.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">তারিখ ও সময়:</span>
                    <span className="font-semibold text-slate-700">
                      {new Date(selectedTransaction.date).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric', year: 'numeric' })},{' '}
                      {new Date(selectedTransaction.date).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">ক্রেতার নাম:</span>
                    <span className="font-bold text-slate-800">{selectedTransaction.customerName || 'খুচরা নগদ খদ্দের'}</span>
                  </div>
                </div>

                {/* Receipt Items Details */}
                {selectedTransaction.items && selectedTransaction.items.length > 0 ? (
                  <div className="space-y-2 border-b border-dashed border-slate-350 pb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">পণ্যের বিবরণী</p>
                    <div className="space-y-1.5">
                      {selectedTransaction.items.map((it: TransactionItem, idx: number) => (
                        <div key={idx} className="flex justify-between text-xs items-center">
                          <div className="text-left">
                            <span className="font-bold text-slate-800">{it.itemName}</span>
                            <span className="text-[10px] text-slate-400 font-semibold block">
                              {formatNumberBengali(it.quantity)} {it.unit} × {formatPrice(it.unitPrice)}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-slate-700">{formatPrice(it.totalPrice)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-indigo-50/50 p-3 rounded-lg text-xs text-slate-600 italic">
                    {selectedTransaction.type === 'payment' ? 'এই রশিদে পূর্বে বাকিকৃত হিসাব হতে সরাসরি টাকা আদায় ক্যাশ জমা করা হয়েছে।' : 'স্টক রিফিলের মেমো তথ্য।' }
                  </div>
                )}

                {/* Cash Paid Calculations */}
                <div className="space-y-2 text-xs text-slate-700">
                  {selectedTransaction.totalAmount > 0 && (
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>সর্বমোট বিল:</span>
                      <span className="font-mono">{formatPrice(selectedTransaction.totalAmount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>আদায়কৃত নগদ ক্যাশ:</span>
                    <span className="font-mono">{formatPrice(selectedTransaction.paidAmount)}</span>
                  </div>

                  {selectedTransaction.type === 'payment' ? (
                    <div className="flex justify-between font-bold text-emerald-600">
                      <span>বাকি পরিশোধ বা সমন্বয়:</span>
                      <span className="font-mono">-{formatPrice(Math.abs(selectedTransaction.dueAmount))}</span>
                    </div>
                  ) : selectedTransaction.dueAmount > 0 ? (
                    <div className="flex justify-between font-bold text-red-500 border-t border-slate-100 pt-2">
                      <span>আদায়হীন বাকি পরিমাণ:</span>
                      <span className="font-mono">+{formatPrice(selectedTransaction.dueAmount)}</span>
                    </div>
                  ) : selectedTransaction.totalAmount > 0 ? (
                    <div className="flex justify-between text-slate-400">
                      <span>বাকি পরিমাণ:</span>
                      <span>পরিশোধিত</span>
                    </div>
                  ) : null}
                </div>

                {/* Invoice Memo notes */}
                {selectedTransaction.notes && (
                  <p className="text-[11px] text-indigo-600 bg-indigo-50/10 p-2 rounded border border-indigo-100 text-center italic leading-relaxed">
                    রশিদ বিবরণী: "{selectedTransaction.notes}"
                  </p>
                )}

                {/* Slogan */}
                <div className="text-center space-y-1.5 border-t border-dashed border-slate-300 pt-4 text-[10px] text-slate-400 font-semibold">
                  <p>আমাদের এখানে সকল প্রকার দেশি, হাস, ব্রয়লার ও ভাঙ্গা ডিম যত্নসহকারে পাইকারি ও খুচরা বিক্রয় করা হয়।</p>
                  <p className="font-bold text-indigo-700 mt-2">ধন্যবাদ, আবার আসবেন!</p>
                </div>

                {/* Modifiers action bar */}
                <div className="flex gap-2 pt-2 border-t border-slate-150 pt-2 border-dashed">
                  <button
                    onClick={startEditing}
                    className="w-1/2 bg-amber-50 hover:bg-amber-100 hover:text-amber-900 border border-amber-250 text-amber-700 font-bold py-2 rounded-xl text-xs flex justify-center items-center gap-1 px-1 shadow-xs cursor-pointer active:scale-95 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>সংশোধন করুন</span>
                  </button>

                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-1/2 bg-red-50 hover:bg-red-100 hover:text-red-900 border border-red-250 text-red-700 font-bold py-2 rounded-xl text-xs flex justify-center items-center gap-1 px-1 shadow-xs cursor-pointer active:scale-95 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-650" />
                    <span>মুছে ফেলুন</span>
                  </button>
                </div>

                {/* Print and share option triggers */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewTxWithReset(null)}
                    className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs flex justify-center items-center gap-1.5 shadow cursor-pointer"
                  >
                    <span>বন্ধ করুন</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs flex justify-center items-center gap-1.5 shadow cursor-pointer active:scale-95 transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>রশিদ প্রিন্ট করুন</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
