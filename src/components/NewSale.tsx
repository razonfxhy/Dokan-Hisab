import React, { useState } from 'react';
import { EggInventory, CustomItem, Customer, Transaction, TransactionItem } from '../types';
import { 
  ShoppingCart, 
  Trash2, 
  UserPlus, 
  Search, 
  Check, 
  Plus, 
  Minus, 
  User, 
  AlertCircle,
  Egg,
  Layers
} from 'lucide-react';

interface NewSaleProps {
  eggs: EggInventory[];
  customItems: CustomItem[];
  customers: Customer[];
  onAddTransaction: (tx: Transaction) => void;
  onUpdateEggStock: (type: string, reduceQty: number) => void;
  onUpdateCustomStock: (id: string, reduceQty: number) => void;
  onUpdateCustomerDue: (id: string, addDue: number) => void;
  onAddNewCustomer: (name: string, phone: string, initialDue: number) => Customer;
  onNavigate: (view: 'dashboard' | 'customers') => void;
}

interface CartItem {
  id: string; // egg type or custom item id
  type: 'egg' | 'custom';
  name: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  maxStock: number;
}

export default function NewSale({
  eggs,
  customItems,
  customers,
  onAddTransaction,
  onUpdateEggStock,
  onUpdateCustomStock,
  onUpdateCustomerDue,
  onAddNewCustomer,
  onNavigate
}: NewSaleProps) {
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Selection and payment states
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(''); // empty means "নগদ খদ্দের" (Cash Customer)
  const [paidAmountInput, setPaidAmountInput] = useState<string>(''); // Empty or string
  const [notes, setNotes] = useState<string>('');
  
  // Custom states for sales discounts, searchable customers, and retail customer details
  const [discountInput, setDiscountInput] = useState<string>('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState<boolean>(false);
  const [retailCustomerName, setRetailCustomerName] = useState<string>('');
  const [retailCustomerPhone, setRetailCustomerPhone] = useState<string>('');

  // Custom rapid-customer creation states
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Search inside custom items
  const [searchTerm, setSearchTerm] = useState('');

  // Format Helper
  const formatPrice = (price: number) => `৳${price.toLocaleString('bn-BD')}`;
  const formatNumberBengali = (num: number) => num.toLocaleString('bn-BD');

  // Add Item to cart
  const addToCart = (id: string, type: 'egg' | 'custom', name: string, unitPrice: number, unit: string, maxStock: number) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === id && item.type === type);
      if (existing) {
        if (existing.quantity >= maxStock) {
          alert('দুঃখিত, স্টকের চেয়ে বেশি বিক্রি করা যাবে না!');
          return prevCart;
        }
        return prevCart.map(item => 
          item.id === id && item.type === type
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        if (maxStock <= 0) {
          alert('দয়া করে প্রথমে স্টক যোগ করুন!');
          return prevCart;
        }
        return [...prevCart, { id, type, name, quantity: 1, unitPrice, unit, maxStock }];
      }
    });
  };

  // Modify cart quantity manually
  const updateQuantity = (id: string, type: 'egg' | 'custom', delta: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === id && item.type === type) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.maxStock) {
            alert(`দুঃখিত! এই পণ্যটির সর্বোচ্চ মজুদ আছে মাত্র ${formatNumberBengali(item.maxStock)} ${item.unit}।`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  // Set cart quantity directly (manual typewriter input)
  const setQuantityDirectly = (id: string, type: 'egg' | 'custom', qty: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === id && item.type === type) {
          if (qty <= 0) return { ...item, quantity: 1 };
          if (qty > item.maxStock) {
            alert(`দুঃখিত! এই পণ্যটির সর্বোচ্চ মজুদ আছে মাত্র ${formatNumberBengali(item.maxStock)} ${item.unit}।`);
            return { ...item, quantity: item.maxStock };
          }
          return { ...item, quantity: qty };
        }
        return item;
      });
    });
  };

  // Remove single item from cart
  const removeFromCart = (id: string, type: 'egg' | 'custom') => {
    setCart(prevCart => prevCart.filter(item => !(item.id === id && item.type === type)));
  };

  // Calculations
  const discountAmount = parseFloat(discountInput) || 0;
  const subtotalAmount = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const totalAmount = Math.max(0, subtotalAmount - discountAmount);
  const paidAmount = paidAmountInput === '' ? totalAmount : parseFloat(paidAmountInput) || 0;
  const rawDue = totalAmount - paidAmount;
  const dueAmount = rawDue > 0 ? rawDue : 0;

  // Handle transaction confirmation
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('কার্ট খালি! প্রথমে আইটেম সিলেক্ট করুন।');
      return;
    }

    if (dueAmount > 0 && !selectedCustomerId) {
      alert('বাকি (বকেয়া) রাখতে হলে অবশ্যই একজন কাস্টমার নির্বাচন অথবা তৈরি করুন!');
      return;
    }

    if (paidAmount > totalAmount) {
      alert('গ্রহণকৃত টাকা মোট হিবেসের চেয়ে বেশি হতে পারে না!');
      return;
    }

    // Capture customer details
    let customerName = 'নগদ খদ্দের';
    if (selectedCustomerId) {
      const foundCustomer = customers.find(c => c.id === selectedCustomerId);
      if (foundCustomer) {
        customerName = foundCustomer.name;
      }
    } else if (retailCustomerName.trim()) {
      customerName = `খুচরা: ${retailCustomerName.trim()}`;
    }

    // Build Transaction object
    const transactionItems: TransactionItem[] = cart.map(item => ({
      type: item.type,
      itemId: item.id,
      itemName: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice,
      unit: item.unit
    }));

    const newTransaction: Transaction = {
      id: 't-sale-' + Date.now(),
      type: 'sale',
      date: new Date().toISOString(),
      totalAmount,
      paidAmount,
      dueAmount,
      customerId: selectedCustomerId || undefined,
      customerName,
      items: transactionItems,
      discount: discountAmount > 0 ? discountAmount : undefined,
      retailCustomerName: retailCustomerName.trim() || undefined,
      retailCustomerPhone: retailCustomerPhone.trim() || undefined,
      notes: notes || (discountAmount > 0 ? `ছাড় দেওয়া বিক্রি (ডিসকাউন্ট ৳${discountAmount})` : 'বিক্রি রশিদ')
    };

    // 1. Reduce Stock
    cart.forEach(item => {
      if (item.type === 'egg') {
        onUpdateEggStock(item.id, item.quantity);
      } else {
        onUpdateCustomStock(item.id, item.quantity);
      }
    });

    // 2. Increase Customer Dues if applicable
    if (selectedCustomerId && dueAmount > 0) {
      onUpdateCustomerDue(selectedCustomerId, dueAmount);
    }

    // 3. Save transaction
    onAddTransaction(newTransaction);

    // Reset workflow
    setCart([]);
    setPaidAmountInput('');
    setDiscountInput('');
    setSelectedCustomerId('');
    setCustomerSearchQuery('');
    setRetailCustomerName('');
    setRetailCustomerPhone('');
    setNotes('');
    alert('বিক্রি রশিদ সফলভাবে তৈরি হয়েছে!');
    onNavigate('dashboard');
  };

  // Quick Customer Creation
  const handleQuickCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      alert('কাস্টমারের নাম লিখুন!');
      return;
    }
    const created = onAddNewCustomer(newCustName, newCustPhone, 0);
    setSelectedCustomerId(created.id);
    setNewCustName('');
    setNewCustPhone('');
    setShowQuickCustomerModal(false);
  };

  const filteredCustomItems = customItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="new-sale-container">
      
      {/* Products catalog: eggs & custom items */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Egg categories catalog */}
        <div className="bg-natural-header rounded-2xl p-5 shadow-sm border border-natural-border space-y-4">
          <div className="flex items-center gap-2 border-b border-natural-border/60 pb-3">
            <Egg className="w-5 h-5 text-[#8B5E3C]" />
            <h3 className="font-bold text-natural-dark text-base">১. ডিমের ক্যাটাগরি</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {eggs.map(eggItem => (
              <button
                key={eggItem.type}
                onClick={() => addToCart(eggItem.type, 'egg', eggItem.name, eggItem.unitPrice, 'পিস', eggItem.stock)}
                className="flex flex-col justify-between p-3.5 rounded-xl border border-natural-border/60 hover:border-natural-accent bg-natural-light/40 hover:bg-natural-light/70 text-left spring-transition select-none group focus:outline-none cursor-pointer"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-natural-light text-natural-accent flex items-center justify-center mb-2 group-hover:scale-110 spring-transition">
                    <Egg className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-natural-dark text-sm">{eggItem.name}</h4>
                  <p className="text-xs text-natural-accent font-semibold mt-1">৳{eggItem.unitPrice}/পিস</p>
                </div>
                <div className="mt-4 flex items-center justify-between w-full">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${eggItem.stock <= 50 ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-natural-light text-natural-text border border-natural-border/45'}`}>
                    মজুদ: {formatNumberBengali(eggItem.stock)}
                  </span>
                  <span className="w-6 h-6 rounded-full bg-natural-accent text-white flex items-center justify-center text-xs font-bold leading-none">
                    +
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom products / Seasonal Fruits catalog */}
        <div className="bg-natural-header rounded-2xl p-5 shadow-sm border border-natural-border space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-natural-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#8B5E3C]" />
              <h3 className="font-bold text-natural-dark text-base">২. অন্যান্য কাস্টম পণ্য ও ফল</h3>
            </div>
            {/* Search items bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-natural-text/60 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="পণ্য খুঁজুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-[#FDFBF7] border border-natural-border rounded-lg text-xs focus:ring-1 focus:ring-natural-accent focus:outline-none w-full md:w-44 font-medium"
              />
            </div>
          </div>

          {filteredCustomItems.length === 0 ? (
            <div className="text-center py-10 text-natural-text/50 text-sm">
              কোন কাস্টম পণ্য পাওয়া যায়নি।
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {filteredCustomItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => addToCart(item.id, 'custom', item.name, item.unitPrice, item.unit, item.stock)}
                  className="flex items-center justify-between p-3 rounded-xl border border-natural-border/60 hover:border-natural-accent hover:bg-natural-light/40 cursor-pointer spring-transition"
                >
                  <div className="space-y-0.5 text-left">
                    <h4 className="font-semibold text-natural-dark text-sm">{item.name}</h4>
                    <p className="text-xs text-natural-accent font-semibold">৳{item.unitPrice} / {item.unit}</p>
                    <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded ${item.stock <= 10 ? 'bg-red-50 text-red-705 border border-red-105' : 'bg-natural-light text-natural-text border border-natural-border/45'}`}>
                      অবশিষ্ট স্টক: {formatNumberBengali(item.stock)} {item.unit}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-natural-light hover:bg-[#EAE4D2] text-[#2D3319] flex items-center justify-center spring-transition text-lg font-bold">
                    +
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart & Billing Section */}
      <div className="lg:col-span-5 bg-natural-header rounded-2xl p-5 shadow-sm border border-natural-border flex flex-col justify-between h-fit space-y-5">
        
        {/* Cart Title & Reset button */}
        <div className="flex items-center justify-between border-b border-natural-border/60 pb-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-natural-accent" />
            <span className="font-bold text-natural-dark text-base">বিক্রয় কার্ট ও হিসাবপত্র</span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-xs text-red-700 hover:text-red-900 font-bold hover:underline cursor-pointer"
            >
              সব মুছুন
            </button>
          )}
        </div>

        {/* Selected Items List */}
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-natural-text/50 text-sm flex flex-col items-center justify-center gap-2">
              <ShoppingCart className="w-8 h-8 text-natural-text/30" />
              <span>কার্টে কোন পণ্য যুক্ত করা হয়নি।</span>
              <span>বামদিকের পণ্যগুলোর উপর ক্লিক করে কার্ট তৈরি করুন।</span>
            </div>
          ) : (
            cart.map(item => (
              <div key={`${item.type}-${item.id}`} className="flex items-center justify-between p-2.5 bg-natural-light/40 rounded-xl border border-natural-border/60 text-sm">
                <div className="space-y-0.5 text-left">
                  <p className="font-semibold text-natural-dark text-xs">{item.name}</p>
                  <p className="text-natural-text/60 text-[11px] font-medium">৳{item.unitPrice} × {item.quantity}</p>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Quantity Actions */}
                  <div className="flex items-center bg-[#FDFBF7] border border-natural-border rounded-lg p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.type, -1)}
                      className="p-1 text-natural-text/60 hover:bg-natural-light rounded cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    
                    <input
                      type="number"
                      min="1"
                      max={item.maxStock}
                      value={item.quantity === 0 ? '' : item.quantity}
                      onChange={(e) => {
                        const parsed = parseInt(e.target.value);
                        const val = isNaN(parsed) ? 0 : parsed;
                        setQuantityDirectly(item.id, item.type, val);
                      }}
                      className="w-12 text-center font-mono font-bold text-natural-dark bg-transparent border-none focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:ring-0 focus:border-none p-0 inline-block focus:bg-natural-light/30 rounded"
                    />

                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.type, 1)}
                      className="p-1 text-natural-text/60 hover:bg-natural-light rounded cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Single item line price */}
                  <span className="font-bold font-mono text-natural-dark w-16 text-right">
                    {formatPrice(item.quantity * item.unitPrice)}
                  </span>

                  {/* Delete from cart */}
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id, item.type)}
                    className="p-1 text-red-700 hover:bg-red-50 hover:text-red-900 rounded cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
            {/* Subtotal Display */}
        {cart.length > 0 && (
          <div className="bg-[#FAF6EC] p-3.5 rounded-xl space-y-2 text-sm border border-[#CDA681]/30">
            <div className="flex justify-between font-semibold text-natural-text/75">
              <span>আইটেমের মোট সাবটোটাল:</span>
              <span className="font-mono text-natural-dark font-bold">{formatPrice(subtotalAmount)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between font-semibold text-red-600 text-xs">
                <span>বিশেষ রিয়াত বা ছাড় (ডিসকাউন্ট হিসেবে):</span>
                <span className="font-mono font-bold">- {formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-natural-accent border-t border-natural-border/50 pt-2 text-base">
              <span>সর্বমোট পরিশোধযোগ্য মূল্য:</span>
              <span className="font-mono">{formatPrice(totalAmount)}</span>
            </div>
          </div>
        )}

        {/* Billing Form */}
        <form onSubmit={handleCheckout} className="space-y-4 pt-1">
          
          {/* Custom Searchable Customer Selector Dropdown */}
          <div className="space-y-1.5 text-left relative" id="customer-search-dropdown-container">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-natural-dark flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-natural-accent" />
                <span>ক্রেতা সিলেক্ট করুন (সার্চ করুন)</span>
              </label>
              
              <button
                type="button"
                onClick={() => setShowQuickCustomerModal(true)}
                className="text-xs text-natural-accent hover:text-natural-accent-hover hover:underline inline-flex items-center gap-0.5 font-semibold cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>নতুন কাস্টমার যোগ</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder={
                  selectedCustomerId 
                    ? (customers.find(c => c.id === selectedCustomerId)?.name || 'কাস্টমার')
                    : 'কাস্টমারের নাম সার্চ করুন (না লিখলে নগদ খদ্দের হিসেবে গণ্য হবে)...'
                }
                value={customerSearchQuery}
                onFocus={() => setIsCustomerDropdownOpen(true)}
                onChange={(e) => {
                  setCustomerSearchQuery(e.target.value);
                  setIsCustomerDropdownOpen(true);
                }}
                className="w-full bg-[#FDFBF7] border border-natural-border text-sm rounded-lg p-2.5 text-natural-dark font-bold focus:outline-none focus:ring-1 focus:ring-natural-accent"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {selectedCustomerId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomerId('');
                      setCustomerSearchQuery('');
                    }}
                    className="text-xs text-red-500 hover:text-red-700 font-bold px-1 rounded hover:bg-red-50"
                  >
                    রিসেট
                  </button>
                )}
                <span className="text-[10px] text-natural-text/60">▼</span>
              </div>
            </div>

            {isCustomerDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1 bg-[#FDFBF7] border border-natural-border shadow-xl rounded-xl max-h-56 overflow-y-auto z-50 p-1 divide-y divide-natural-border/30">
                <div 
                  onClick={() => {
                    setSelectedCustomerId('');
                    setCustomerSearchQuery('');
                    setIsCustomerDropdownOpen(false);
                  }}
                  className="p-2 py-2.5 text-xs text-natural-text hover:bg-natural-accent hover:text-white rounded-lg cursor-pointer transition flex justify-between items-center font-semibold"
                >
                  <span>না গেলেই ভালো (সাধারণ নগদ খদ্দের / Random Customer)</span>
                  <span className="text-[9px] bg-natural-light text-natural-text px-1.5 py-0.5 rounded font-bold">ডিফল্ট নগদ</span>
                </div>
                {customers
                  .filter(c => c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) || (c.phone && c.phone.includes(customerSearchQuery)))
                  .map(c => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedCustomerId(c.id);
                        setCustomerSearchQuery(c.name);
                        setIsCustomerDropdownOpen(false);
                      }}
                      className={`p-2 py-2.5 text-xs text-natural-dark hover:bg-natural-accent hover:text-white rounded-lg cursor-pointer transition flex justify-between items-center ${
                        selectedCustomerId === c.id ? 'bg-natural-light border-l-2 border-natural-accent' : ''
                      }`}
                    >
                      <div className="text-left font-sans">
                        <p className="font-bold text-xs">{c.name}</p>
                        <p className="text-[10px] opacity-75">{c.phone || 'মোবাইল উল্লেখ নেই'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1 py-0.5 rounded">বকেয়া: ৳{c.dueAmount}</p>
                      </div>
                    </div>
                  ))}
                {customers.filter(c => c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) || (c.phone && c.phone.includes(customerSearchQuery))).length === 0 && (
                  <div className="p-3 text-xs text-natural-text/60 text-center">কোনো কাস্টমার পাওয়া যায়নি।</div>
                )}
              </div>
            )}
          </div>

          {/* Random customer details fields */}
          {!selectedCustomerId && (
            <div className="p-3 bg-natural-light/40 border border-natural-border/70 rounded-xl space-y-2 text-xs text-left">
              <span className="font-extrabold text-[#8B5E3C] block">অপরিচিত / খুচরা খদ্দেরের তথ্য সংরক্ষণ (ঐচ্ছিক):</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-natural-text font-bold mb-1 block">ক্রেতার নাম</label>
                  <input
                    type="text"
                    placeholder="যেমন: মো: কাশেম মিয়া"
                    value={retailCustomerName}
                    onChange={(e) => setRetailCustomerName(e.target.value)}
                    className="w-full bg-[#FDFBF7] border border-natural-border rounded-lg p-2 focus:ring-1 focus:ring-natural-accent focus:outline-none font-medium text-xs text-natural-dark"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-natural-text font-bold mb-1 block">মোবাইল নাম্বার</label>
                  <input
                    type="text"
                    placeholder="যেমন: ০১৭০০০০০০০০"
                    value={retailCustomerPhone}
                    onChange={(e) => setRetailCustomerPhone(e.target.value)}
                    className="w-full bg-[#FDFBF7] border border-natural-border rounded-lg p-2 focus:ring-1 focus:ring-natural-accent focus:outline-none font-medium text-xs text-natural-dark"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Money collections inputs: Discount, Received cash, remaining balance dues */}
          <div className="grid grid-cols-3 gap-2.5 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-natural-dark">ছাড়/ডিসকাউন্ট(৳)</label>
              <input
                type="number"
                placeholder="0"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                min="0"
                className="w-full bg-[#FDFBF7] border border-natural-border rounded-lg p-2 font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-natural-accent text-sm text-natural-dark"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-natural-dark">নগদ গ্রহণ (৳)</label>
              <input
                type="number"
                placeholder={cart.length > 0 ? totalAmount.toString() : '0'}
                value={paidAmountInput}
                onChange={(e) => setPaidAmountInput(e.target.value)}
                min="0"
                className="w-full bg-[#FDFBF7] border border-natural-border rounded-lg p-2 font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-natural-accent text-sm text-natural-dark"
              />
            </div>
            
            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-bold text-red-600">বাকি বকেয়া (৳)</label>
              <div className="w-full bg-red-50/50 border border-red-200 rounded-lg p-2 font-mono font-bold text-red-700 select-none text-sm leading-6">
                {formatPrice(dueAmount)}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-natural-dark">অতিরিক্ত নোট / বিবরণ</label>
            <input
              type="text"
              placeholder="যেমন: অমুক ভাই বাকি নিলেন"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#FDFBF7] border border-natural-border rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-natural-accent text-xs text-natural-dark"
            />
          </div>

          {/* Dynamic Dues alert warnings */}
          {dueAmount > 0 && !selectedCustomerId && (
            <div className="bg-[#FAF0E6] border border-[#E9E2D0] text-[#2D3319] rounded-lg p-3 text-xs flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>বাকি বা বকেয়া রেকর্ড করতে চাইলে সাধারণ ক্যাশ কাস্টমার বাদ দিয়ে অবশ্যই একজন নির্দিষ্ট কাস্টমার সিলেক্ট করতে হবে!</span>
            </div>
          )}

          {/* Checkout Button */}
          <button
            type="submit"
            disabled={cart.length === 0}
            className={`w-full text-white font-bold py-3.5 px-4 rounded-xl shadow-md leading-none flex items-center justify-center gap-2 cursor-pointer transition ${
              cart.length === 0
                ? 'bg-[#E9E2D0] text-natural-text/40 shadow-none cursor-not-allowed'
                : 'bg-natural-accent hover:bg-natural-accent-hover active:scale-95 shadow-natural-accent/15'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>আইটেম বিক্রি ও রশিদ রিলিজ</span>
          </button>
        </form>
      </div>

      {/* Quick Customer Modal */}
      {showQuickCustomerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-natural-bg rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-natural-border space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-natural-border/60 pb-3">
              <h3 className="font-bold text-natural-dark text-lg">নতুন ক্রেতা যোগ করুন</h3>
              <button 
                onClick={() => setShowQuickCustomerModal(false)}
                className="text-natural-text/60 hover:text-natural-dark text-xl font-bold p-1 leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleQuickCustomerSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-natural-dark">ক্রেতার পুরো নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মো: আল আমিন হোসেন"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-natural-header border border-natural-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-natural-accent text-natural-dark font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-natural-dark">মোবাইল নাম্বার</label>
                <input
                  type="text"
                  placeholder="যেমন: 01700-112233"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full bg-natural-header border border-natural-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-natural-accent text-natural-dark font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickCustomerModal(false)}
                  className="w-1/2 bg-natural-light hover:bg-[#EAE4D2] text-[#2D3319] font-bold py-2.5 rounded-xl text-sm"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-natural-accent hover:bg-natural-accent-hover text-white font-bold py-2.5 rounded-xl text-sm"
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
