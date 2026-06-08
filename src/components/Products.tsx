import React, { useState } from 'react';
import { EggInventory, CustomItem, Transaction } from '../types';
import { 
  Egg, 
  Layers, 
  Plus, 
  Trash2, 
  PlusCircle, 
  Save, 
  ShieldAlert, 
  CheckCircle,
  HelpCircle,
  Hash
} from 'lucide-react';

interface ProductsProps {
  eggs: EggInventory[];
  customItems: CustomItem[];
  onUpdateEggAll: (eggs: EggInventory[]) => void;
  onAddCustomItem: (item: CustomItem) => void;
  onRemoveCustomItem: (id: string) => void;
  onUpdateCustomAll: (items: CustomItem[]) => void;
  onAddTransaction: (tx: Transaction) => void;
}

export default function Products({ 
  eggs, 
  customItems, 
  onUpdateEggAll, 
  onAddCustomItem, 
  onRemoveCustomItem, 
  onUpdateCustomAll,
  onAddTransaction
}: ProductsProps) {
  // Egg inventory inputs states
  const [eggStocks, setEggStocks] = useState<{ [key: string]: string }>({});
  const [eggPrices, setEggPrices] = useState<{ [key: string]: string }>({});

  // Custom Item Creation State
  const [newItemName, setNewItemName] = useState('');
  const [newItemStock, setNewItemStock] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('পিস');
  const [newItemPrice, setNewItemPrice] = useState('');

  // Custom Item fast stock modify state
  const [addCustomQty, setAddCustomQty] = useState<{ [key: string]: string }>({});

  const formatPrice = (price: number) => `৳${price.toLocaleString('bn-BD')}`;
  const formatNumberBengali = (num: number) => num.toLocaleString('bn-BD');

  // Handle Egg stock-in and pricing adjustments
  const handleUpdateEggs = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create copy
    const updatedEggs = eggs.map(eggItem => {
      const additionalStock = parseInt(eggStocks[eggItem.type] || '0') || 0;
      const parsedPriceInput = eggPrices[eggItem.type];
      const newPrice = parsedPriceInput !== undefined && parsedPriceInput !== '' 
        ? parseFloat(parsedPriceInput) 
        : eggItem.unitPrice;

      return {
        ...eggItem,
        stock: eggItem.stock + additionalStock,
        unitPrice: newPrice
      };
    });

    // Create a transaction log if stock was added
    const stockAdditions = eggs.map(oldEgg => {
      const addedQty = parseInt(eggStocks[oldEgg.type] || '0') || 0;
      if (addedQty > 0) {
        return {
          type: 'egg' as const,
          itemId: oldEgg.type,
          itemName: oldEgg.name,
          quantity: addedQty,
          unitPrice: oldEgg.unitPrice,
          totalPrice: 0,
          unit: 'পিস'
        };
      }
      return null;
    }).filter(Boolean);

    if (stockAdditions.length > 0) {
      const newTx: Transaction = {
        id: 't-stock-egg-' + Date.now(),
        type: 'stock_add',
        date: new Date().toISOString(),
        totalAmount: 0,
        paidAmount: 0,
        dueAmount: 0,
        notes: `নিয়মিত ডিম মজুদ বৃদ্ধি: ${stockAdditions.map(x => `${x?.itemName} (+${x?.quantity}টি)`).join(', ')}`,
        items: stockAdditions as any
      };
      onAddTransaction(newTx);
    }

    onUpdateEggAll(updatedEggs);
    setEggStocks({});
    // Keep prices synced but clear raw input
    setEggPrices({});
    alert('ডিম মজুদ ও মূল্য সফলভাবে আপডেট ও ডিজিটাল খাতায় সংরক্ষিত হয়েছে!');
  };

  // Add new seasonal/custom product
  const handleCreateCustomProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice) {
      alert('পণ্যর নাম এবং সঠিক মূল্য দিন!');
      return;
    }

    const price = parseFloat(newItemPrice) || 0;
    const initialStock = parseInt(newItemStock || '0') || 0;

    const newProduct: CustomItem = {
      id: 'custom-' + Date.now(),
      name: newItemName.trim(),
      stock: initialStock,
      unit: newItemUnit,
      unitPrice: price
    };

    onAddCustomItem(newProduct);

    // If initial stock was higher than 0, write transaction log
    if (initialStock > 0) {
      const newTx: Transaction = {
        id: 't-stock-custom-init-' + Date.now(),
        type: 'stock_add',
        date: new Date().toISOString(),
        totalAmount: 0,
        paidAmount: 0,
        dueAmount: 0,
        notes: `নতুন পণ্য যুক্তকরণ এবং প্রারম্ভিক মজুদ: ${newProduct.name} (+${initialStock}${newProduct.unit})`,
        items: [
          {
            type: 'custom',
            itemId: newProduct.id,
            itemName: newProduct.name,
            quantity: initialStock,
            unitPrice: price,
            totalPrice: 0,
            unit: newProduct.unit
          }
        ]
      };
      onAddTransaction(newTx);
    }

    // Reset fields
    setNewItemName('');
    setNewItemStock('');
    setNewItemPrice('');
    setNewItemUnit('পিস');
    alert('নতুন মৌসুমী/কাস্টম পণ্য সফলভাবে চালু করা হয়েছে!');
  };

  // Fast update individual custom item stock levels
  const handleAddCustomInventory = (itemId: string) => {
    const qtyInput = addCustomQty[itemId];
    const qtyToAdd = parseInt(qtyInput || '0') || 0;
    if (qtyToAdd <= 0) {
      alert('সঠিক ও যোগবোধক সংখ্যা লিখুন!');
      return;
    }

    const updatedItems = customItems.map(item => {
      if (item.id === itemId) {
        // Record log too details
        const newTx: Transaction = {
          id: 't-stock-custom-topup-' + Date.now() + '-' + itemId,
          type: 'stock_add',
          date: new Date().toISOString(),
          totalAmount: 0,
          paidAmount: 0,
          dueAmount: 0,
          notes: `${item.name} এর মজুদ পুনঃসংগ্রহ করা হল: +${qtyToAdd} ${item.unit}`,
          items: [
            {
              type: 'custom',
              itemId: item.id,
              itemName: item.name,
              quantity: qtyToAdd,
              unitPrice: item.unitPrice,
              totalPrice: 0,
              unit: item.unit
            }
          ]
        };
        onAddTransaction(newTx);

        return { ...item, stock: item.stock + qtyToAdd };
      }
      return item;
    });

    onUpdateCustomAll(updatedItems);
    setAddCustomQty(prev => ({ ...prev, [itemId]: '' }));
    alert('পণ্য মজুদ সফলভাবে রিফিল করা হয়েছে!');
  };

  return (
    <div className="space-y-6" id="products-settings-container">
      {/* Grid of panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Egg Stock Manager */}
        <div className="bg-natural-header rounded-2xl p-5 shadow-sm border border-natural-border lg:col-span-7 space-y-4">
          <div className="border-b border-natural-border/60 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Egg className="text-natural-accent w-5 h-5" />
              <h3 className="font-bold text-natural-dark text-base">১. ডিমের মজুদ এবং বাজারদর সংশোধন</h3>
            </div>
            <span className="text-[10px] bg-natural-light px-2 py-0.5 rounded font-bold text-natural-text/70 border border-natural-border/40">৪ মৌলিক ধরন</span>
          </div>

          <form onSubmit={handleUpdateEggs} className="space-y-4">
            <div className="space-y-3">
              {eggs.map(eggItem => (
                <div key={eggItem.type} className="grid grid-cols-12 gap-3 items-center p-3 rounded-xl border border-natural-border/50 bg-natural-light/20 hover:bg-natural-light/50 spring-transition">
                  <div className="col-span-4 text-left">
                    <p className="font-bold text-natural-dark text-sm">{eggItem.name}</p>
                    <p className="text-xs text-natural-text/60">মজুদ: <span className="font-mono font-bold text-natural-dark">{formatNumberBengali(eggItem.stock)}</span> পিস</p>
                    <p className="text-xs text-natural-accent font-semibold">চলতি দর: {formatPrice(eggItem.unitPrice)}/পিস</p>
                  </div>

                  {/* Stock Top-up count input */}
                  <div className="col-span-4 text-left">
                    <label className="text-[10px] font-semibold text-natural-text/60 block mb-1">নতুন ঢোকাতে চান (পিস)</label>
                    <input
                      type="number"
                      placeholder="যেমন: +১০০"
                      value={eggStocks[eggItem.type] || ''}
                      onChange={(e) => setEggStocks({ ...eggStocks, [eggItem.type]: e.target.value })}
                      min="0"
                      className="w-full bg-[#FDFBF7] border border-natural-border rounded-lg p-2 font-mono text-xs text-natural-dark focus:ring-1 focus:ring-natural-accent focus:outline-none"
                    />
                  </div>

                  {/* Pricing change input */}
                  <div className="col-span-4 text-left">
                    <label className="text-[10px] font-semibold text-natural-text/60 block mb-1">নতুন বিক্রয়মূল্য (৳)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder={eggItem.unitPrice.toString()}
                      value={eggPrices[eggItem.type] || ''}
                      onChange={(e) => setEggPrices({ ...eggPrices, [eggItem.type]: e.target.value })}
                      min="0"
                      className="w-full bg-[#FDFBF7] border border-natural-border rounded-lg p-2 font-mono text-xs text-natural-dark focus:ring-1 focus:ring-natural-accent focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#FAF0E6] p-3 rounded-xl text-xs text-natural-accent text-left flex items-start gap-1.5 leading-relaxed border border-natural-border/40">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>এখানে মজুদ যোগ করলে মূল ডিমের স্টকে যোগ হবে। কাস্টমারদের কাছে যে মূল্যে বিক্রি করা হবে সেটির জন্য নতুন বিক্রয়মূল্যের ঘরে রেট দিন।</span>
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 bg-natural-accent hover:bg-natural-accent-hover text-white font-bold py-3 px-5 rounded-xl text-sm w-full shadow-md active:scale-95 spring-transition cursor-pointer shadow-natural-accent/15"
            >
              <Save className="w-4 h-4" />
              <span>ডিম স্টক ও বাজারদর সংরক্ষণ</span>
            </button>
          </form>
        </div>

        {/* Right Side: Create Custom Service / Products */}
        <div className="bg-natural-header rounded-2xl p-5 shadow-sm border border-natural-border lg:col-span-5 space-y-4">
          <div className="border-b border-natural-border/60 pb-3">
            <div className="flex items-center gap-2">
              <PlusCircle className="text-[#8B5E3C] w-5 h-5" />
              <h3 className="font-bold text-natural-dark text-base">২. নতুন কাস্টম পণ্য তৈরি (ফল ইত্যাদি)</h3>
            </div>
          </div>

          <form onSubmit={handleCreateCustomProduct} className="space-y-3.5">
            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-natural-dark">পণ্যের পুরো নাম *</label>
              <input
                type="text"
                required
                placeholder="যেমন: হাড়িভাঙ্গা আম (স্পেশাল)"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full bg-[#FDFBF7] border border-natural-border rounded-lg p-2.5 text-xs text-natural-dark font-medium focus:ring-1 focus:ring-natural-accent focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-natural-dark">পরিমাপের একক</label>
                <select
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  className="w-full bg-[#FDFBF7] border border-natural-border rounded-lg p-2.5 text-xs text-natural-dark font-medium focus:outline-none focus:ring-1 focus:ring-natural-accent"
                >
                  <option value="পিস">পিস (Pieces)</option>
                  <option value="কেজি">কেজি (Kilogram)</option>
                  <option value="হালি">হালি (4 Pieces)</option>
                  <option value="১০০ পিস">১০০ পিস (Hundred)</option>
                  <option value="ডজন">ডজন (12 Pieces)</option>
                  <option value="বক্স">বক্স (Box)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-natural-dark">বিক্রয় রেট (৳) *</label>
                <input
                  type="number"
                  required
                  placeholder="যেমন: ১২০"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  min="0"
                  className="w-full bg-[#FDFBF7] border border-natural-border rounded-lg p-2.5 font-mono text-xs text-natural-dark focus:ring-1 focus:ring-natural-accent focus:outline-none font-bold"
                />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-natural-dark">প্রারম্ভিক স্টক / মজুদ সংখ্যা</label>
              <input
                type="number"
                placeholder="মজুদ না থাকলে ০ দিন"
                value={newItemStock}
                onChange={(e) => setNewItemStock(e.target.value)}
                min="0"
                className="w-full bg-[#FDFBF7] border border-natural-border rounded-lg p-2.5 font-mono text-xs text-natural-dark focus:ring-1 focus:ring-natural-accent focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 bg-natural-accent hover:bg-natural-accent-hover text-white font-bold py-3 px-5 rounded-xl text-sm w-full shadow-md active:scale-95 spring-transition cursor-pointer shadow-natural-accent/15"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন কাস্টম আইটেম যুক্ত করুন</span>
            </button>
          </form>
        </div>
      </div>

      {/* Seasonal & custom Products stock list and removing table */}
      <div id="custom-products-table-view" className="bg-natural-header rounded-2xl p-5 shadow-sm border border-natural-border">
        <div className="border-b border-natural-border/60 pb-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="text-[#8B5E3C] w-5 h-5" />
            <h3 className="font-bold text-natural-dark text-base">৩. চালু কাস্টম পণ্যের মজুদ রিফিল ও মুছা খাতা</h3>
          </div>
          <span className="text-xs text-natural-text/60 font-semibold select-none">মোট আইটেম: {formatNumberBengali(customItems.length)} টি</span>
        </div>

        {customItems.length === 0 ? (
          <div className="text-center py-12 text-natural-text/50 text-sm">
            কোন কাস্টম বা মৌসুমী পণ্য এখনো যোগ করা হয়নি। উপরের ফরম হতে পণ্য সচল করুন।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm divide-y divide-natural-border/50">
              <thead>
                <tr className="text-natural-text/60 text-xs font-semibold uppercase bg-natural-light/40">
                  <th className="py-3 px-4 text-left">আইডি</th>
                  <th className="py-3 px-4 text-left">পণ্যের নাম</th>
                  <th className="py-3 px-4 text-right">বিক্রয়মূল্য রেট (৳)</th>
                  <th className="py-3 px-4 text-right">চলতি স্টক বা মজুদ</th>
                  <th className="py-3 px-4 text-center">দ্রুত স্টক রিফিল যোগ</th>
                  <th className="py-3 px-4 text-center action-col">একশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-natural-border/40 bg-natural-header">
                {customItems.map(item => (
                  <tr key={item.id} className="hover:bg-natural-light/45 spring-transition group">
                    <td className="py-3 px-4 text-natural-text/55 font-mono text-xs">
                      #{item.id.split('-')[1] || item.id}
                    </td>
                    <td className="py-3 px-4 font-bold text-natural-dark text-left">
                      {item.name}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-natural-accent font-bold">
                      {formatPrice(item.unitPrice)} <span className="text-[10px] text-natural-text/60 font-semibold font-sans">/ {item.unit}</span>
                    </td>
                    <td className="py-3 px-4 text-right border-collapse">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold font-mono border ${item.stock <= 15 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-natural-light text-natural-dark border-natural-border/40'}`}>
                        {formatNumberBengali(item.stock)} {item.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {/* Fast Refill Qty Input Actions */}
                      <div className="flex items-center justify-center gap-1 max-w-[150px] mx-auto">
                        <input
                          type="number"
                          placeholder="+৫..."
                          value={addCustomQty[item.id] || ''}
                          onChange={(e) => setAddCustomQty({ ...addCustomQty, [item.id]: e.target.value })}
                          min="1"
                          className="w-16 bg-[#FDFBF7] border border-natural-border rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-natural-accent text-xs font-mono text-center font-bold text-natural-dark"
                        />
                        <button
                          onClick={() => handleAddCustomInventory(item.id)}
                          className="bg-natural-light hover:bg-[#EAE4D2] text-[#2D3319] p-1.5 rounded text-xs px-2.5 font-bold cursor-pointer transition select-none leading-none border border-natural-border/60"
                        >
                          যোগ
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          if (confirm(`আপনি কি সত্যিই "${item.name}" পণ্যটি ডিলিট করতে চান?`)) {
                            onRemoveCustomItem(item.id);
                          }
                        }}
                        className="p-1.5 text-red-700 hover:bg-red-50 hover:text-red-900 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                        title="পণ্যটি মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-xs font-bold font-sans">মুছুন</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
