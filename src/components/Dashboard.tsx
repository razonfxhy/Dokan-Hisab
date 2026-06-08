import React from 'react';
import { EggInventory, CustomItem, Customer, Transaction } from '../types';
import { 
  TrendingUp, 
  Users, 
  Layers, 
  AlertTriangle, 
  ShoppingCart, 
  ArrowUpRight, 
  DollarSign,
  Egg,
  Calendar
} from 'lucide-react';

interface DashboardProps {
  eggs: EggInventory[];
  customItems: CustomItem[];
  customers: Customer[];
  transactions: Transaction[];
  onNavigate: (view: 'sale' | 'products' | 'customers' | 'transactions') => void;
  onViewTransaction: (tx: Transaction) => void;
}

export default function Dashboard({ 
  eggs, 
  customItems, 
  customers, 
  transactions, 
  onNavigate,
  onViewTransaction
}: DashboardProps) {
  
  // Calculate stats
  const totalDue = customers.reduce((sum, c) => sum + c.dueAmount, 0);
  
  // Sales calculation (today split)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter(t => t.date.startsWith(todayStr));
  const todaySalesSum = todayTransactions
    .filter(t => t.type === 'sale')
    .reduce((sum, t) => sum + t.totalAmount, 0);
  
  const todayCashCollected = todayTransactions
    .reduce((sum, t) => sum + t.paidAmount, 0);

  const totalEggsStock = eggs.reduce((sum, e) => sum + e.stock, 0);

  // Check for low stock items (e.g., eggs < 100, custom customItems < 20)
  const lowStockEggs = eggs.filter(e => e.stock < 100);
  const lowStockCustom = customItems.filter(p => p.stock < 15);
  const hasLowStock = lowStockEggs.length > 0 || lowStockCustom.length > 0;

  // Recent 5 transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const formatPrice = (price: number) => {
    return `৳${price.toLocaleString('bn-BD')}`;
  };

  const formatNumberBengali = (num: number) => {
    return num.toLocaleString('bn-BD');
  };  const getEggColor = (type: string) => {
    switch (type) {
      case 'desi': return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'broiler': return 'bg-[#FAF6EC] text-[#2D3319] border-[#E5DBBF]';
      case 'duck': return 'bg-sky-100/90 text-sky-900 border-sky-300';
      case 'broken': return 'bg-red-100 text-red-900 border-red-300';
      default: return 'bg-gray-100 text-gray-900 border-gray-300';
    }
  };

  const getEggProgressBarColor = (type: string) => {
    switch (type) {
      case 'desi': return 'bg-gradient-to-r from-amber-500 to-amber-600';
      case 'broiler': return 'bg-[#CDA681]';
      case 'duck': return 'bg-gradient-to-r from-sky-400 to-sky-500';
      case 'broken': return 'bg-gradient-to-r from-red-500 to-red-600';
      default: return 'bg-[#A69B84]';
    }
  };

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Top Banner section */}
      <div 
        id="top-welcome-banner" 
        className="relative overflow-hidden bg-gradient-to-br from-[#8B5E3C] via-[#6f4b2e] to-[#2D3319] text-white rounded-2xl p-6 md:p-8 shadow-md"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#CDA681] opacity-10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#8B5E3C] opacity-10 rounded-full blur-3xl -ml-16 -mb-16"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="bg-[#CDA681]/30 text-[#FDFBF7] border border-[#CDA681]/40 text-xs px-3 py-1 rounded-full font-medium tracking-wide">
              স্বাগতম • লাইভ ট্র্যাকিং সচল
            </span>
            <h1 className="text-2xl md:text-3.5xl font-extrabold tracking-tight mt-3 text-[#FDFBF7]">
              সাব্বির পুষ্টি দোকান
            </h1>
            <p className="text-[#E9E2D0] mt-2 text-sm md:text-base max-w-xl font-normal leading-relaxed">
              ডিম এবং মৌসুমী পণ্যের দৈনন্দিন স্টক, বিক্রি ও ক্রেতাদের বাকির হিসাব ডিজিটাল খাতা।
            </p>
          </div>
          
          <button 
            id="quick-sale-btn"
            onClick={() => onNavigate('sale')}
            className="flex items-center justify-center gap-2 bg-[#FDFBF7] hover:bg-[#F5F1E9] text-[#2D3319] font-bold px-6 py-3.5 rounded-xl text-md shadow-lg shadow-black/10 active:scale-95 spring-transition cursor-pointer"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>নতুন বিক্রি রশিদ</span>
          </button>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div id="stats-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-natural-header p-5 rounded-2xl shadow-sm border border-natural-border flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-natural-text/70 text-sm font-medium">আজকের মোট বিক্রি</p>
            <h3 className="text-2.5xl font-bold font-mono tracking-tight text-natural-dark">
              {formatPrice(todaySalesSum)}
            </h3>
            <p className="text-xs text-natural-text/60 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-natural-accent"></span>
              {formatNumberBengali(todayTransactions.filter(t => t.type === 'sale').length)} টি রশিদ কাটা হয়েছে
            </p>
          </div>
          <div className="bg-natural-light p-3.5 rounded-xl text-[#8B5E3C]">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-natural-header p-5 rounded-2xl shadow-sm border border-natural-border flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-natural-text/70 text-sm font-medium">আজকের নগদ আদায়</p>
            <h3 className="text-2.5xl font-bold font-mono tracking-tight text-[#8B5E3C]">
              {formatPrice(todayCashCollected)}
            </h3>
            <p className="text-xs text-natural-text/60">ক্রয়মূল্য ও পূর্বের বাকি আদায়</p>
          </div>
          <div className="bg-natural-light p-3.5 rounded-xl text-[#CDA681]">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-natural-header p-5 rounded-2xl shadow-sm border border-natural-border flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-natural-text/70 text-sm font-medium">মোট বকেয়া বা বাকি</p>
            <h3 className="text-2.5xl font-bold font-mono tracking-tight text-red-600">
              {formatPrice(totalDue)}
            </h3>
            <p className="text-xs text-natural-text/60 font-medium">খদ্দেরদের কাছে প্রাপ্য টাকা</p>
          </div>
          <div className="bg-red-50 text-red-700 p-3.5 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-natural-header p-5 rounded-2xl shadow-sm border border-natural-border flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-natural-text/70 text-sm font-medium">মোট ডিমের মজুদ</p>
            <h3 className="text-2.5xl font-bold font-mono tracking-tight text-[#8B5E3C]">
              {formatNumberBengali(totalEggsStock)} <span className="text-xs font-sans text-natural-text/60">পিস</span>
            </h3>
            <p className="text-xs text-natural-text/60">৪ ক্যাটাগরির বর্তমান সংগ্রহ</p>
          </div>
          <div className="bg-natural-light p-3.5 rounded-xl text-natural-accent">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Stock warning alerts if any */}
      {hasLowStock && (
        <div id="low-stock-alert" className="bg-[#FAF0E6] border border-[#E9E2D0] rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-900 text-sm">স্টক ফুরিয়ে যাচ্ছে!</h4>
            <p className="text-amber-800 text-xs mt-1">
              নিচের পণ্যগুলোর মজুদ ১০০ পিসের বা ১৫ কেজির নিচে নেমে গেছে। শীঘ্রই আড়ত থেকে পণ্য সংগ্রহ করুন:
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {lowStockEggs.map(e => (
                <span key={e.type} className="bg-amber-100 text-amber-900 text-xs px-2.5 py-1 rounded-md font-medium border border-amber-200">
                  {e.name}: {formatNumberBengali(e.stock)} পিস
                </span>
              ))}
              {lowStockCustom.map(p => (
                <span key={p.id} className="bg-[#FAF6EC] text-[#2D3319] text-xs px-2.5 py-1 rounded-md font-medium border border-[#E9E2D0]">
                  {p.name}: {formatNumberBengali(p.stock)} {p.unit}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Eggs & Custom Items Bento Row */}
      <div id="dashboard-items-row" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Egg Stock Card */}
        <div className="bg-natural-header rounded-2xl p-6 shadow-sm border border-natural-border lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between border-b border-natural-border/60 pb-4">
            <div className="flex items-center gap-2">
              <Egg className="w-5 h-5 text-natural-accent" />
              <h3 className="font-bold text-natural-dark text-md">৪ ক্যাটাগরির ডিমের স্টক</h3>
            </div>
            <button 
              onClick={() => onNavigate('products')}
              className="text-xs text-natural-accent hover:text-natural-accent-hover hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              মজুদ আপডেট করুন <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {eggs.map(egg => {
              // Calculate percentage based on target max for progress display (e.g., 2000 per egg)
              const maxTarget = 1500;
              const percent = Math.min((egg.stock / maxTarget) * 100, 100);
              
              return (
                <div key={egg.type} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getEggColor(egg.type)}`}>
                        {egg.name}
                      </span>
                      <span className="text-natural-text/60 text-xs font-medium">
                        প্রতি পিস: ৳{egg.unitPrice}
                      </span>
                    </div>
                    <span className="font-bold font-mono text-natural-dark">
                      {formatNumberBengali(egg.stock)} পিস
                    </span>
                  </div>
                  {/* Progress Bar Container */}
                  <div className="w-full bg-[#EFE9DB] h-2.5 rounded-full overflow-hidden animate-pulse-once">
                    <div 
                      className={`h-full ${getEggProgressBarColor(egg.type)} rounded-full`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Other Items Stock */}
        <div className="bg-natural-header rounded-2xl p-6 shadow-sm border border-natural-border lg:col-span-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-natural-border/60 pb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#8B5E3C]" />
                <h3 className="font-bold text-natural-dark text-md">অন্যান্য ও মৌসুমী পণ্য</h3>
              </div>
              <button 
                onClick={() => onNavigate('products')}
                className="text-xs text-[#8B5E3C] hover:text-[#754f30] hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
              >
                নতুন পণ্য যোগ <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {customItems.length === 0 ? (
                <div className="text-center py-6 text-natural-text/50 text-xs">
                  কোন কাস্টম পণ্য যুক্ত নেই।
                </div>
              ) : (
                customItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#F4EFE3] border border-natural-border/30 spring-transition">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-natural-dark text-sm">{item.name}</p>
                      <p className="text-xs text-natural-text/60">প্রতি {item.unit}: ৳{item.unitPrice}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${item.stock <= 15 ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-natural-light text-natural-text border border-natural-border/40'}`}>
                        মজুদ: {formatNumberBengali(item.stock)} {item.unit}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-natural-border/60 mt-4">
            <div className="bg-[#FAF0E6] rounded-xl p-3 flex items-center gap-2.5 text-xs text-natural-accent border border-natural-border/40">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#CDA681] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8B5E3C]"></span>
              </span>
              <span>নতুন কাস্টম আইটেম যোগ এবং মজুদ যেকোনো সময় ডিলিট বা এডিট করতে পারবেন।</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Activities & Actions */}
      <div id="dashboard-recent-activities" className="bg-natural-header rounded-2xl p-6 shadow-sm border border-natural-border">
        <div className="flex items-center justify-between border-b border-natural-border/60 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-natural-accent" />
            <h3 className="font-bold text-natural-dark text-md">সাম্প্রতিক লেনদেন সমূহ</h3>
          </div>
          <button 
            onClick={() => onNavigate('transactions')}
            className="text-xs text-natural-accent hover:text-natural-accent-hover hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
          >
            লেকচার খাতা দেখুন <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-natural-border/60 text-natural-text/60 text-xs uppercase font-semibold">
                <th className="py-2.5 font-semibold leading-none">তারিখ ও সময়</th>
                <th className="py-2.5 font-semibold leading-none">রশিদ টাইপ</th>
                <th className="py-2.5 font-semibold leading-none">ক্রেতার নাম</th>
                <th className="py-2.5 font-semibold leading-none text-right">মোট টাকা</th>
                <th className="py-2.5 font-semibold leading-none text-right">নগদ প্রদান</th>
                <th className="py-2.5 font-semibold leading-none text-right text-red-600 font-bold">বাকি পরিমাণ</th>
                <th className="py-2.5 font-semibold leading-none text-center">রশিদ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-natural-border/50">
              {recentTransactions.map(tx => {
                const dateObj = new Date(tx.date);
                const timeString = dateObj.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', hour12: true });
                const dateString = dateObj.toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' });
                
                return (
                  <tr key={tx.id} className="hover:bg-natural-light/50 group spring-transition">
                    <td className="py-3 text-xs text-natural-text/60 whitespace-nowrap">
                       {dateString}, {timeString}
                    </td>
                    <td className="py-3 whitespace-nowrap">
                      {tx.type === 'sale' && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-[#FAF6EC] text-[#8B5E3C] border border-[#E5DBBF]">
                          বিক্রি
                        </span>
                      )}
                      {tx.type === 'payment' && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100/50 text-emerald-850 border border-emerald-250">
                          বাকি পরিশোধ
                        </span>
                      )}
                      {tx.type === 'stock_add' && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100/50 text-amber-850 border border-amber-250">
                          মজুদ বৃদ্ধি
                        </span>
                      )}
                    </td>
                    <td className="py-3 font-semibold text-natural-dark whitespace-nowrap">
                      {tx.customerName || tx.notes || 'সাধারণ স্টক'}
                    </td>
                    <td className="py-3 text-right font-mono text-natural-text whitespace-nowrap">
                      {tx.totalAmount > 0 ? formatPrice(tx.totalAmount) : '-'}
                    </td>
                    <td className="py-3 text-right font-mono text-emerald-750 font-semibold whitespace-nowrap">
                      {tx.paidAmount > 0 ? formatPrice(tx.paidAmount) : '-'}
                    </td>
                    <td className="py-3 text-right font-mono whitespace-nowrap">
                      {tx.type === 'payment' ? (
                        <span className="text-emerald-750 font-semibold">{formatPrice(tx.dueAmount)}</span>
                      ) : tx.dueAmount > 0 ? (
                        <span className="text-red-600 font-semibold">{formatPrice(tx.dueAmount)}</span>
                      ) : (
                        <span className="text-natural-text/40">-</span>
                      )}
                    </td>
                    <td className="py-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => onViewTransaction(tx)}
                        className="text-natural-accent hover:text-natural-accent-hover hover:bg-natural-light text-xs py-1 px-2.5 rounded-md font-medium inline-flex items-center gap-1 cursor-pointer"
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
      </div>
    </div>
  );
}
