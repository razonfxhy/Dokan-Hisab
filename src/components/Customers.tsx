import React, { useState } from 'react';
import { Customer, Transaction } from '../types';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Search, 
  Phone, 
  AlertTriangle, 
  ChevronRight, 
  DollarSign, 
  ArrowDownLeft, 
  UserMinus,
  Maximize2
} from 'lucide-react';

interface CustomersProps {
  customers: Customer[];
  transactions: Transaction[];
  onAddNewCustomer: (name: string, phone: string, initialDue: number) => Customer;
  onRemoveCustomer: (id: string) => void;
  onUpdateCustomerDue: (id: string, dueDelta: number) => void;
  onAddTransaction: (tx: Transaction) => void;
}

export default function Customers({
  customers,
  transactions,
  onAddNewCustomer,
  onRemoveCustomer,
  onUpdateCustomerDue,
  onAddTransaction
}: CustomersProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create customer states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [initialDue, setInitialDue] = useState('');
  const [notes, setNotes] = useState('');

  // Selected Customer ledger detail state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  
  // Payment state for selected customer
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Format Helper
  const formatPrice = (price: number) => `৳${price.toLocaleString('bn-BD')}`;
  const formatNumberBengali = (num: number) => num.toLocaleString('bn-BD');

  // Submit new customer
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('ক্রেতার নাম বা টাইটেল প্রদান করা আবশ্যিক!');
      return;
    }

    const parsedDue = parseFloat(initialDue) || 0;
    const addedCustomer = onAddNewCustomer(name.trim(), phone, parsedDue);
    
    // Create initial transaction log if due is higher than 0
    if (parsedDue > 0) {
      const initialTx: Transaction = {
        id: 't-cust-init-' + Date.now(),
        type: 'sale', // Treating as initial sale for bookkeeping
        date: new Date().toISOString(),
        totalAmount: parsedDue,
        paidAmount: 0,
        dueAmount: parsedDue,
        customerId: addedCustomer.id,
        customerName: addedCustomer.name,
        notes: notes || 'প্রারম্ভিক পূর্ব বকেয়া হিসাব'
      };
      onAddTransaction(initialTx);
    }

    // Reset fields
    setName('');
    setPhone('');
    setInitialDue('');
    setNotes('');
    alert('নতুন ক্রেতা সফলভাবে রেজিস্টার খাতায় যুক্ত করা হয়েছে!');
  };

  // Record a payment to settle dues
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return;

    const amount = parseFloat(payAmount) || 0;
    if (amount <= 0) {
      alert('সঠিক ও যোগবোধক পরিশোধ অ্যামাউন্ট লিখুন!');
      return;
    }

    if (amount > customer.dueAmount) {
      if (!confirm(`পরিশোধ টাকা (${formatPrice(amount)}) কাস্টমারের বর্তমান বকেয়া (${formatPrice(customer.dueAmount)}) থেকে বেশি! আপনি কি অবশিষ্টাংশ অতিরিক্ত জমা হিসেবে রাখতে চান?`)) {
        return;
      }
    }

    // Record the payment in transaction list
    const paymentTx: Transaction = {
      id: 't-pay-' + Date.now(),
      type: 'payment',
      date: new Date().toISOString(),
      totalAmount: 0,
      paidAmount: amount,
      dueAmount: -amount, // subtracts from total dues
      customerId: customer.id,
      customerName: customer.name,
      notes: payNotes || 'বাকি পরিশোধ করা হলো'
    };

    onAddTransaction(paymentTx);
    onUpdateCustomerDue(customer.id, -amount); // subtract from dues
    
    setPayAmount('');
    setPayNotes('');
    alert('বাকি পরিশোধ পেমেন্ট সফলভাবে রিসিভ করে আপডেট করা হয়েছে!');
  };

  // Filtered customer lists
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  const selectedCustomerObj = customers.find(c => c.id === selectedCustomerId);
  
  // Transaction logs related to this specific client
  const customerTransactions = selectedCustomerId 
    ? transactions
        .filter(t => t.customerId === selectedCustomerId)
        // Sort descending by date
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const totalDuesSum = customers.reduce((sum, c) => sum + c.dueAmount, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="customers-workspace">
      
      {/* Top statistics summary across all clients */}
      <div className="col-span-full bg-[#FAF6EC] rounded-2xl p-5 border border-natural-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-3 text-left">
          <div className="bg-natural-light p-3 rounded-xl text-natural-accent border border-natural-border/40">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-[#2D3319] text-base md:text-lg">ক্রেতাদের ডিজিটাল রেজিষ্ট্রেশন খাতা</h2>
            <p className="text-xs text-natural-text/60">ব্যবসায়িক খদ্দেরদের মোট বাকি, পরিশোধ এবং বিক্রয় ট্র্যাকারের তালিকা।</p>
          </div>
        </div>

        <div className="flex flex-row gap-4 w-full md:w-auto">
          <div className="flex-1 bg-natural-header border border-natural-border/60 p-3 px-5 rounded-xl text-center md:text-right min-w-[125px] md:min-w-[150px]">
            <p className="text-natural-text/60 text-xs font-semibold">রেজিস্টার্ড কাস্টমার</p>
            <p className="text-xl font-bold font-mono text-natural-dark mt-1">{formatNumberBengali(customers.length)} জন</p>
          </div>
          <div className="flex-1 bg-red-50 border border-red-200 p-3 px-5 rounded-xl text-center md:text-right min-w-[125px] md:min-w-[150px]">
            <p className="text-red-700 text-xs font-semibold">সর্বমোট বকেয়া খাতা</p>
            <p className="text-xl font-bold font-mono text-red-700 mt-1">{formatPrice(totalDuesSum)}</p>
          </div>
        </div>
      </div>

      {/* Main Left Columns: List and Searches */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-natural-header rounded-2xl p-5 shadow-sm border border-natural-border space-y-4">
          
          {/* Controls row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-natural-border/60 pb-3">
            <div className="relative w-full md:max-w-xs">
              <Search className="w-4 h-4 text-natural-text/60 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="নাম বা মোবাইল দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 w-full bg-[#FDFBF7] border border-natural-border rounded-lg text-xs font-medium focus:ring-1 focus:ring-natural-accent focus:outline-none text-natural-dark"
              />
            </div>
            
            <p className="text-xs text-natural-text/60 font-semibold text-right">
              পাওয়া গেছে: {formatNumberBengali(filteredCustomers.length)} জন
            </p>
          </div>

          {/* List display */}
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-10 text-natural-text/55 text-sm">
              কোন ক্রেতার তথ্য পাওয়া যায়নি। অমুককে নিচে রেজিস্টার করুন।
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
              {filteredCustomers.map(customer => {
                const isActive = customer.id === selectedCustomerId;
                return (
                  <div
                    key={customer.id}
                    onClick={() => setSelectedCustomerId(customer.id)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border spring-transition text-left cursor-pointer group ${
                      isActive 
                        ? 'border-natural-accent bg-natural-light/60' 
                        : 'border-natural-border/50 hover:border-natural-border hover:bg-natural-light/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${isActive ? 'bg-natural-accent text-white' : 'bg-natural-light text-natural-dark border border-natural-border/40 group-hover:bg-[#EAE4D2]'}`}>
                        {customer.name.charAt(0)}
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-bold text-natural-dark text-sm">{customer.name}</p>
                        <p className="text-xs text-natural-text/60 flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-natural-accent" />
                          {customer.phone || 'মোবাইল নেই'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold font-mono border ${customer.dueAmount > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                          বাকি: {formatPrice(customer.dueAmount)}
                        </span>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-natural-text/50 spring-transition ${isActive ? 'translate-x-1 text-natural-accent font-bold' : ''}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Registers form for a brand new Client */}
        <div className="bg-natural-header rounded-2xl p-5 shadow-sm border border-natural-border space-y-4">
          <div className="flex items-center gap-2 border-b border-natural-border/60 pb-3">
            <UserPlus className="text-[#8B5E3C] w-5 h-5" />
            <h3 className="font-bold text-[#2D3319] text-sm">নতুন ক্রেতার হিসাব খাতা চালু করুন</h3>
          </div>

          <form onSubmit={handleCreateCustomer} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-natural-dark">খদ্দেরের নাম বা পরিচিতি *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: জামাল উদ্দিন মেম্বার"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#FDFBF7] border border-natural-border rounded-lg p-2.5 text-xs text-natural-dark font-semibold focus:outline-none focus:ring-1 focus:ring-natural-accent"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-natural-dark">মোবাইল নাম্বার</label>
                <input
                  type="text"
                  placeholder="যেমন: 01711-223344"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#FDFBF7] border border-natural-border rounded-lg p-2.5 text-xs text-natural-dark focus:outline-none focus:ring-1 focus:ring-natural-accent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-natural-dark">পূর্বে জমে থাকা কোনো বাকি বা হালখাতা (৳)</label>
                <input
                  type="number"
                  placeholder="বাকি না থাকলে খালি রাখুন"
                  value={initialDue}
                  onChange={(e) => setInitialDue(e.target.value)}
                  min="0"
                  className="w-full bg-[#FDFBF7] border border-natural-border rounded-lg p-2.5 text-xs font-mono text-natural-dark focus:outline-none focus:ring-1 focus:ring-natural-accent font-bold"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-natural-dark">অতিরিক্ত নোট / বিবরণ</label>
                <input
                  type="text"
                  placeholder="ঠিকানা, বাড়ি বা কাজের ক্ষেত্র"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#FDFBF7] border border-natural-border rounded-lg p-2.5 text-xs text-natural-dark focus:outline-none focus:ring-1 focus:ring-natural-accent"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-natural-accent hover:bg-natural-accent-hover text-white font-bold py-3 px-4 rounded-xl text-sm shadow-md active:scale-95 spring-transition cursor-pointer flex items-center justify-center gap-2 shadow-natural-accent/15"
            >
              <UserPlus className="w-4 h-4" />
              <span>ডিজিটাল খাতায় নতুন ক্রেতা যোগ করুন</span>
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Detail Billing Ledger Profile */}
      <div className="lg:col-span-5">
        {!selectedCustomerObj ? (
          <div className="bg-natural-header rounded-2xl p-6 shadow-sm border border-natural-border flex flex-col items-center justify-center text-center py-24 space-y-3 h-full select-none">
            <Users className="w-12 h-12 text-natural-text/30" />
            <h3 className="font-bold text-natural-dark text-base">কোনো ক্রেতার প্রোফাইল খোলা হয়নি</h3>
            <p className="text-xs text-natural-text/50 max-w-xs leading-relaxed">
              বামদিকের চলমান কাস্টমার তালিকার যেকোনো একটি নামের উপর ক্লিক করুন। তার ব্যক্তিগত খাতা, লেনদেনের ইতিহাস এবং বাকি পরিশোধের ফর্ম এখানে প্রদর্শিত হবে।
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Customer Profile Card Header */}
            <div className="bg-[#2B3513] text-[#FAF6EC] rounded-2xl p-5 shadow-lg relative overflow-hidden border border-[#1C240A]">
              <div className="absolute right-0 top-0 w-24 h-24 bg-[#FAF6EC]/5 rounded-full blur-2xl"></div>
              
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <span className="bg-[#8B5E3C]/30 text-[#E4C59E] border border-[#8B5E3C]/40 text-[10px] px-2.5 py-0.5 rounded font-bold uppercase leading-none">
                    ক্রেতা প্রোফাইল
                  </span>
                  
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-[#FAF6EC]">{selectedCustomerObj.name}</h3>
                    <p className="text-xs text-[#FAF6EC]/80 flex items-center gap-1 font-mono mt-1">
                      <Phone className="w-3.5 h-3.5 text-[#E4C59E]" />
                      {selectedCustomerObj.phone || 'মোবাইল নেই'}
                    </p>
                    {selectedCustomerObj.additionalNotes && (
                      <p className="text-xs text-[#FAF6EC]/70 mt-2 bg-[#1C240A]/60 p-1.5 rounded text-left border border-[#FAF6EC]/5">
                        নোট: {selectedCustomerObj.additionalNotes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[10px] text-red-300 font-semibold mb-1">মোট বাকি</p>
                  <p className="text-xl font-bold font-mono text-red-400">
                    {formatPrice(selectedCustomerObj.dueAmount)}
                  </p>
                </div>
              </div>

              {/* Action buttons on selection header card */}
              <div className="border-t border-[#FAF6EC]/10 mt-4 pt-3 flex items-center justify-between">
                <button
                  onClick={() => setSelectedCustomerId(null)}
                  className="text-[11px] text-[#FAF6EC]/80 hover:text-white font-semibold cursor-pointer"
                >
                  প্রোফাইল বন্ধ করুন
                </button>

                <button
                  onClick={() => {
                    if (selectedCustomerObj.dueAmount > 0) {
                      if (!confirm(`ক্রেতা "${selectedCustomerObj.name}" এর কাছে ৳${selectedCustomerObj.dueAmount} বাকি বকেয়া রয়েছে! ডিলিট করলে বাকি টাকা মউকুফ হয়ে যাবে। আপনি কি সত্যিই উনাকে ডিলিট করতে চান?`)) {
                        return;
                      }
                    } else {
                      if (!confirm(`আপনি কি সত্যিই "${selectedCustomerObj.name}" কে মুছে দিতে চান?`)) {
                        return;
                      }
                    }
                    onRemoveCustomer(selectedCustomerObj.id);
                    setSelectedCustomerId(null);
                    alert('কাস্টমার খাতা থেকে সফলভাবে মুছে ফেলা হয়েছে।');
                  }}
                  className="text-red-300 hover:text-red-200 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                  <span>মুছে ফেলুন</span>
                </button>
              </div>
            </div>

            {/* Pay balance Due input */}
            <div className="bg-natural-header rounded-2xl p-5 shadow-sm border border-natural-border text-left space-y-4">
              <div className="flex items-center gap-2 border-b border-natural-border/60 pb-3">
                <ArrowDownLeft className="text-natural-accent w-5 h-5 bg-natural-light rounded border border-natural-border/30" />
                <h4 className="font-bold text-natural-dark text-sm">বাকি পরিশোধ পেমেন্ট রিসিভ</h4>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-3">
                <div className="space-y-1 bg-[#FAF6EC] p-2.5 rounded-xl flex items-center justify-between border border-natural-border">
                  <span className="text-xs text-natural-text/60 font-semibold">আদায়যোগ্য বকেয়া বাকি:</span>
                  <span className="text-sm font-bold font-mono text-red-650 text-red-700">{formatPrice(selectedCustomerObj.dueAmount)}</span>
                </div>

                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-6 space-y-1">
                    <label className="text-[10px] font-bold text-natural-dark">পরিশোধকৃত টাকা (৳)</label>
                    <input
                      type="number"
                      required
                      placeholder="যেমন: ৫০০"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      min="1"
                      className="w-full bg-[#FDFBF7] border border-natural-border rounded-lg p-2 font-mono font-bold text-natural-dark focus:outline-none focus:ring-1 focus:ring-natural-accent text-xs"
                    />
                  </div>
                  
                  <div className="col-span-6 space-y-1">
                    <label className="text-[10px] font-bold text-natural-dark">লেনদেন বিবরণী / মেমো</label>
                    <input
                      type="text"
                      placeholder="অগ্রিম, পেমেন্ট আদায়"
                      value={payNotes}
                      onChange={(e) => setPayNotes(e.target.value)}
                      className="w-full bg-[#FDFBF7] border border-natural-border rounded-lg p-2 text-natural-dark focus:outline-none focus:ring-1 focus:ring-natural-accent text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={selectedCustomerObj.dueAmount <= 0 && payAmount === ''}
                  className="w-full bg-natural-accent hover:bg-natural-accent-hover text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 spring-transition cursor-pointer disabled:bg-[#E9E2D0] disabled:text-natural-text/40 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>টাকা আদায় জমা রশিদ দিন</span>
                </button>
              </form>
            </div>

            {/* Personal activity ledger logs */}
            <div className="bg-natural-header rounded-2xl p-5 shadow-sm border border-natural-border text-left space-y-4">
              <h4 className="font-bold text-natural-dark text-xs border-b border-natural-border/60 pb-2 flex justify-between items-center">
                <span>লেনদেনের ইতিহাস</span>
                <span className="font-mono text-[10px] bg-natural-light text-natural-accent px-1.5 py-0.5 rounded font-bold border border-natural-border/40">
                  মোট {formatNumberBengali(customerTransactions.length)} বার
                </span>
              </h4>

              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {customerTransactions.length === 0 ? (
                  <p className="text-center text-xs text-natural-text/50 py-6">এই ক্রেতার সাথে পূর্বে কোনো লেনদেন এন্ট্রি করা হয়নি।</p>
                ) : (
                  customerTransactions.map(tx => {
                    const dateObj = new Date(tx.date);
                    const formattedDate = dateObj.toLocaleDateString('bn-BD', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                    
                    return (
                      <div key={tx.id} className="p-2.5 rounded-xl border border-natural-border/50 bg-natural-light/20 flex items-center justify-between text-xs">
                        <div className="space-y-0.5 text-left">
                          <p className="font-bold text-natural-dark leading-none">
                            {tx.type === 'sale' ? 'বিক্রি রশিদ' : 'নগদ জমা পরিশোধ'}
                          </p>
                          <p className="text-[10px] text-natural-text/60 font-semibold">{formattedDate}</p>
                          {tx.notes && <p className="text-[10px] text-natural-accent font-semibold">{tx.notes}</p>}
                        </div>

                        <div className="text-right flex flex-col items-end gap-0.5">
                          {tx.type === 'sale' ? (
                            <>
                              <span className="font-mono font-bold text-natural-dark">মোট: {formatPrice(tx.totalAmount)}</span>
                              <span className="text-[10px] text-red-700 font-bold font-mono">বাকি যোগ: +{formatPrice(tx.dueAmount)}</span>
                            </>
                          ) : (
                            <>
                              <span className="font-mono font-bold text-emerald-800">পরিশোধ: {formatPrice(tx.paidAmount)}</span>
                              <span className="text-[10px] text-emerald-700 font-bold font-mono">বাকি মাইনাস: {formatPrice(tx.dueAmount)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
