"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [orders, setOrders] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('ທັງໝົດ')
  const [viewAll, setViewAll] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Form States
  const [editingId, setEditingId] = useState<string | null>(null)
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0])
  const [completedDate, setCompletedDate] = useState('')
  const [orderCode, setOrderCode] = useState('')
  const [totalQuantity, setTotalQuantity] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)
  const [initialDeposit, setInitialDeposit] = useState(0)
  const [factoryCost, setFactoryCost] = useState(0)
  const [status, setStatus] = useState('ກຳລັງຜະລິດ')

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, customer_payments (amount), factory_payments (amount)`)
        .order('deposit_date', { ascending: false })
      if (error) throw error
      if (data) {
        const formattedData = data.map(order => ({
          ...order,
          added_customer_paid: order.customer_payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0,
          factory_paid: order.factory_payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0
        }))
        setOrders(formattedData)
      }
    } catch (err) { console.error("Fetch Error:", err) }
  }

  useEffect(() => { fetchOrders() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { 
      deposit_date: depositDate,
      completed_date: status === 'ຜະລິດສຳເລັດແລ້ວ' ? (completedDate || new Date().toISOString().split('T')[0]) : null,
      order_code: orderCode,
      total_quantity: totalQuantity,
      total_price: totalPrice,
      initial_deposit: initialDeposit,
      factory_cost: factoryCost,
      status: status
    }
    try {
      let error;
      if (editingId) { error = (await supabase.from('orders').update(payload).eq('id', editingId)).error }
      else { error = (await supabase.from('orders').insert([payload])).error }
      if (error) throw error
      alert("บันทึกสำเร็จ!"); resetForm(); fetchOrders();
    } catch (err: any) { alert("Error: " + err.message) }
  }

  const resetForm = () => {
    setEditingId(null); setOrderCode(''); setTotalQuantity(0); setTotalPrice(0);
    setInitialDeposit(0); setFactoryCost(0); setStatus('ກຳລັງຜະລິດ');
    setDepositDate(new Date().toISOString().split('T')[0]); setCompletedDate('');
  }

  const startEdit = (order: any) => {
    setEditingId(order.id); setDepositDate(order.deposit_date || ''); setCompletedDate(order.completed_date || '');
    setOrderCode(order.order_code || ''); setTotalQuantity(order.total_quantity || 0); setTotalPrice(order.total_price || 0);
    setInitialDeposit(order.initial_deposit || 0); setFactoryCost(order.factory_cost || 0); setStatus(order.status || 'ກຳລັງຜະລິດ');
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filteredOrders = orders.filter(order => {
    const code = (order.order_code || '').toLowerCase()
    const search = searchTerm.toLowerCase()
    const matchesSearch = code.includes(search)
    const matchesStatus = filterStatus === 'ທັງໝົດ' || order.status === filterStatus
    if (viewAll) return matchesSearch && matchesStatus
    const d = new Date(order.deposit_date)
    return matchesSearch && matchesStatus && (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear
  })

  const profitOrders = orders.filter(o => {
    if (!o.completed_date || o.status !== 'ຜະລິດສຳເລັດແລ້ວ') return false
    const d = new Date(o.completed_date)
    return (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear
  })
  
  const cashIn = orders.filter(o => {
    const d = new Date(o.deposit_date); return (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear
  }).reduce((sum, o) => sum + (o.initial_deposit || 0) + (o.added_customer_paid || 0), 0)

  const totalProfitValue = profitOrders.reduce((sum, o) => sum + ((o.total_price || 0) - (o.factory_cost || 0)), 0)

  return (
    <main className="min-h-screen bg-[#E8EBF0] text-slate-800 font-['Noto_Sans_Lao']">
      {/* 1. Header Section */}
      <header className="bg-[#1E293B] text-white py-3 px-6 flex justify-between items-center shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-[#FFD700] text-[#1E293B] px-3 py-1 rounded font-black text-xl italic shadow-sm">EG</div>
          <h1 className="text-lg font-bold">ລະບບບັນຊີຮ້ານ BG SPORT</h1>
        </div>
        <div className="flex gap-2 bg-[#ffffff15] p-1.5 rounded-lg border border-white/10">
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-transparent font-bold outline-none text-sm px-2 cursor-pointer">
              {['ມັງກອນ','ກຸມພາ','ມີນາ','ເມສາ','ພຶດສະພາ','ມິຖຸນາ','ກໍລະກົດ','ສິງຫາ','ກັນຍາ','ຕຸລາ','ພະຈິກ','ທັນວา'].map((m, i) => (<option key={i} value={i+1} className="text-black">{m}</option>))}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-transparent font-bold outline-none text-sm px-2 border-l border-white/20 cursor-pointer">
              <option value={2025} className="text-black">2025</option><option value={2026} className="text-black">2026</option>
            </select>
        </div>
      </header>

      <div className="p-4 space-y-4 max-w-full mx-auto">
        {/* Top 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Column 1: Input Form */}
          <div className="lg:col-span-3 bg-white p-5 rounded-2xl shadow-sm">
            <h2 className="text-sm font-black mb-4 flex items-center gap-2 text-blue-600">
              <span className="w-1 h-4 bg-blue-600 rounded-full"></span> {editingId ? 'ແກ້ໄຂອໍເດີ້' : 'ເພີ່ມອໍເດີ້ໃໝ່'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">ວັນທີມັດຈຳ</label>
                  <input type="date" value={depositDate} onChange={(e) => setDepositDate(e.target.value)} className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 text-sm font-bold text-black outline-none focus:ring-1 focus:ring-blue-400" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">ລະຫັດ</label>
                  <input type="text" value={orderCode} onChange={(e) => setOrderCode(e.target.value)} className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 text-sm font-black text-black outline-none focus:ring-1 focus:ring-blue-400" placeholder="PKF..." required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">ຈຳນວນ</label>
                  <input type="number" value={totalQuantity || ''} onChange={(e) => setTotalQuantity(Number(e.target.value))} className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 text-sm font-bold text-black" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">ລາຄາລວມ</label>
                  <input type="number" value={totalPrice || ''} onChange={(e) => setTotalPrice(Number(e.target.value))} className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 text-sm font-black text-black" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">ມັດຈຳ</label>
                  <input type="number" value={initialDeposit || ''} onChange={(e) => setInitialDeposit(Number(e.target.value))} className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 text-sm text-emerald-600 font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">ທຶນ</label>
                  <input type="number" value={factoryCost || ''} onChange={(e) => setFactoryCost(Number(e.target.value))} className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 text-sm text-rose-500 font-bold" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">ສະຖານະ</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 text-sm font-black text-black outline-none">
                  <option value="ກຳລັງຜະລິດ">📦 ກຳລັງຜະລິດ</option>
                  <option value="ຜະລິດສຳເລັດແລ້ວ">✅ ຜະລິດສຳເລັດແລ້ວ</option>
                </select>
              </div>
              {status === 'ຜະລິດສຳເລັດແລ້ວ' && (
                <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                  <label className="text-[10px] font-bold text-emerald-600 ml-1 uppercase">ວັນທີຜະລິດສຳເລັດ</label>
                  <input type="date" value={completedDate} onChange={(e) => setCompletedDate(e.target.value)} className="w-full p-2 bg-emerald-50 rounded-lg border border-emerald-100 text-sm font-bold text-black outline-none" required />
                </div>
              )}
              <button type="submit" className="w-full bg-[#1E293B] text-white p-3 rounded-lg font-black text-sm shadow hover:bg-slate-800 transition-all mt-2 uppercase tracking-wide">
                {editingId ? 'ອັບເດດ' : 'ບັນທຶກອໍເດີ້'}
              </button>
            </form>
          </div>

          {/* Column 2: Dashboard Cards */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-[#14B8A6] to-[#0D9488] p-5 rounded-2xl shadow-sm text-white flex flex-col justify-between">
              <p className="text-[10px] opacity-90 font-bold uppercase tracking-widest">Cash In / ເງິນສົດຮັບ</p>
              <h3 className="text-2xl font-black">{cashIn.toLocaleString()} <span className="text-xs opacity-70">₭</span></h3>
            </div>
            <div className="bg-gradient-to-br from-[#F59E0B] to-[#D97706] p-5 rounded-2xl shadow-sm text-white flex flex-col justify-between">
              <p className="text-[10px] opacity-90 font-bold uppercase tracking-widest">Net Profit / ກຳໄລ</p>
              <h3 className="text-2xl font-black">{totalProfitValue.toLocaleString()} <span className="text-xs opacity-70">₭</span></h3>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-rose-500">
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1">ຄ້າງຮັບລູກຄ້າລວມ</p>
              <h3 className="text-xl font-black text-rose-500">{orders.reduce((sum, o) => sum + ((o.total_price || 0) - ((o.initial_deposit || 0) + (o.added_customer_paid || 0))), 0).toLocaleString()}</h3>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-blue-500">
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1">ຄ້າງຈ່າຍໂຮງງານລວມ</p>
              <h3 className="text-xl font-black text-blue-600">{orders.reduce((sum, o) => sum + ((o.factory_cost || 0) - (o.factory_paid || 0)), 0).toLocaleString()}</h3>
            </div>
          </div>

          {/* Column 3: Profit Source */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl shadow-sm h-full flex flex-col overflow-hidden">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> ກຳໄລເດືອນນີ້ (ຈາກອໍເດີ້ທີ່ສຳເລັດ)
            </h2>
            <div className="space-y-2 overflow-y-auto flex-1 pr-1 scrollbar-hide">
              {profitOrders.map(o => (
                <div key={o.id} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center border border-slate-100">
                  <div>
                    <p className="font-black text-slate-700 text-xs">{o.order_code}</p>
                    <p className="text-[9px] text-slate-400 font-bold italic">{o.completed_date}</p>
                  </div>
                  <p className="text-emerald-600 font-black text-sm">+{((o.total_price || 0) - (o.factory_cost || 0)).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-white flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <input 
              type="text" 
              placeholder="ຄົ້ນຫາ PKF, 26, 1001..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-2xl border-none font-bold text-black outline-none ring-1 ring-slate-100 focus:ring-blue-400 text-sm shadow-inner"
            />
            <span className="absolute left-3 top-3.5 text-lg opacity-30">🔍</span>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={() => setViewAll(!viewAll)} className={`px-5 py-2.5 rounded-2xl font-bold text-[11px] transition-all shadow-sm ${viewAll ? 'bg-amber-100 text-amber-600 ring-1 ring-amber-200' : 'bg-slate-50 text-slate-400'}`}>
              ເບິ່ງສະເພາະເດືອນ
            </button>
            <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-slate-100">
                {['ທັງໝົດ', 'ກຳລັງຜະລິດ', 'ຜະລິດສຳເລັດ'].map(s => (
                  <button key={s} onClick={() => setFilterStatus(s === 'ຜະລິດສຳເລັດ' ? 'ຜະລິດສຳເລັດແລ້ວ' : s)} className={`px-5 py-2.5 rounded-xl text-[11px] font-black transition-all ${filterStatus === (s === 'ຜະລິດສຳເລັດ' ? 'ຜະລິດສຳເລັດແລ້ວ' : s) ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}>{s}</button>
                ))}
            </div>
            {/* Report Badge */}
            <div className="ml-2 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
               <p className="text-[8px] font-bold text-blue-400 uppercase">Report ເສື້ອ</p>
               <p className="font-black text-blue-700 text-sm leading-none">{filteredOrders.reduce((sum, o) => sum + (o.total_quantity || 0), 0).toLocaleString()} ຜືນ</p>
            </div>
          </div>
        </div>


        {/* Main Table - Full Data Column */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50/80">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-4 py-4">1.ລະຫັດອໍເດີ້</th>
                  <th className="px-4 py-4">2.ວັນທີມັດຈຳ</th>
                  <th className="px-4 py-4 text-center">3.ຈຳນວນ</th>
                  <th className="px-4 py-4 text-right">4.ລາຄາລວມ</th>
                  <th className="px-4 py-4 text-right text-emerald-600">5.ມັດຈຳສັ່ງຜະລິດ</th>
                  <th className="px-4 py-4 text-right text-rose-500">6.ຄ້າງຊຳລະ</th>
                  <th className="px-4 py-4 text-right text-slate-500">7.ຕົ້ນທຶນໂຮງງານ</th>
                  <th className="px-4 py-4 text-right text-blue-600">8.ກຳໄລສຸດທິ</th>
                  <th className="px-4 py-4 text-center">9.ສະຖານະ</th>
                  <th className="px-4 py-4 text-center">10.ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[13px]">
                {filteredOrders.map(order => {
                  const paid = (order.initial_deposit || 0) + (order.added_customer_paid || 0);
                  const remain = (order.total_price || 0) - paid;
                  const netProfit = (order.total_price || 0) - (order.factory_cost || 0);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition-all">
                      <td className="px-4 py-4 font-black text-slate-900">{order.order_code}</td>
                      <td className="px-4 py-4 text-slate-400 font-bold">{order.deposit_date}</td>
                      <td className="px-4 py-4 text-center font-black">{order.total_quantity}</td>
                      <td className="px-4 py-4 text-right font-black">{(order.total_price || 0).toLocaleString()}</td>
                      <td className="px-4 py-4 text-right font-bold text-emerald-600">{paid.toLocaleString()}</td>
                      <td className="px-4 py-4 text-right font-bold text-rose-500">{remain.toLocaleString()}</td>
                      <td className="px-4 py-4 text-right font-bold text-slate-500">{(order.factory_cost || 0).toLocaleString()}</td>
                      <td className="px-4 py-4 text-right font-black text-blue-600">{netProfit.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center">
                         <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase ${order.status === 'ຜະລິດສຳເລັດແລ້ວ' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-700'}`}>
                           {order.status === 'ຜະລິດສຳເລັດແລ້ວ' ? 'ສຳເລັດ' : 'ກຳລັງຜະລິດ'}
                         </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center gap-3">
                          <button onClick={() => startEdit(order)} className="text-slate-300 hover:text-blue-500 transition-colors">✏️</button>
                          <button onClick={() => (confirm('ລຶບ?') && supabase.from('orders').delete().eq('id', order.id).then(() => fetchOrders()))} className="text-slate-300 hover:text-rose-500 transition-colors">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}