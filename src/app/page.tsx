"use client"
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowDownCircle, TrendingUp, Users, Factory, Printer, FileSpreadsheet, Package } from 'lucide-react';
import Link from 'next/link';

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const initialMonth = Number(searchParams.get('month')) || new Date().getMonth() + 1
  const initialYear = Number(searchParams.get('year')) || new Date().getFullYear()

  const [orders, setOrders] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('ທັງໝົດ')
  const [viewAll, setViewAll] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(initialMonth)
  const [selectedYear, setSelectedYear] = useState(initialYear)

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
          added_customer_paid: order.customer_payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0
        }))
        setOrders(formattedData)
      }
    } catch (err) { console.error("Fetch Error:", err) }
  }

  useEffect(() => { fetchOrders() }, [])

  const handleDateChange = (m: number, y: number) => {
    setSelectedMonth(m); setSelectedYear(y);
    router.push(`?month=${m}&year=${y}`, { scroll: false });
  }

  const toggleFactoryPayment = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ຊຳລະແລ້ວ' ? 'ຍັງບໍ່ທັນຊຳລະ' : 'ຊຳລະແລ້ວ'
    const { error } = await supabase.from('orders').update({ factory_payment_status: newStatus }).eq('id', id)
    if (!error) fetchOrders()
  }

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
      if (editingId) { await supabase.from('orders').update(payload).eq('id', editingId) }
      else { await supabase.from('orders').insert([payload]) }
      alert("ບັນທຶກສຳເລັດ!"); resetForm(); fetchOrders();
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
    const matchesSearch = code.includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'ທັງໝົດ' || order.status === filterStatus
    if (viewAll) return matchesSearch && matchesStatus
    const d = new Date(order.deposit_date)
    return matchesSearch && matchesStatus && (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear
  })

  const cashIn = filteredOrders.reduce((sum, o) => sum + (o.initial_deposit || 0) + (o.added_customer_paid || 0), 0)
  const totalProfitValue = filteredOrders.filter(o => o.status === 'ຜະລິດສຳເລັດແລ້ວ').reduce((sum, o) => sum + ((o.total_price || 0) - (o.factory_cost || 0)), 0)
  const totalFactoryPaid = filteredOrders.filter(o => o.factory_payment_status === 'ຊຳລະແລ້ວ').reduce((sum, o) => sum + (o.factory_cost || 0), 0)
  const totalCustomerDebt = filteredOrders.reduce((sum, o) => sum + ((o.total_price || 0) - ((o.initial_deposit || 0) + (o.added_customer_paid || 0))), 0)
  const totalFactoryDebt = filteredOrders.filter(o => o.factory_payment_status !== 'ຊຳລະແລ້ວ').reduce((sum, o) => sum + (o.factory_cost || 0), 0)
  const totalShirts = filteredOrders.reduce((sum, o) => sum + (o.total_quantity || 0), 0)
  const queryParams = `?month=${selectedMonth}&year=${selectedYear}`;

  return (
    <main className="min-h-screen bg-[#E8EBF0] text-slate-800 font-['Noto_Sans_Lao'] pb-10">
      <header className="bg-[#1E293B] text-white py-3 px-6 flex justify-between items-center shadow-md sticky top-0 z-50 print:hidden">
        <div className="flex items-center gap-3">
          <div className="bg-[#FFD700] text-[#1E293B] px-3 py-1 rounded font-black text-xl italic">BG</div>
          <h1 className="text-lg font-bold">ລະບົບບັນຊີຮ້ານ BG SPORT</h1>
        </div>
        <div className="flex gap-2 bg-[#ffffff15] p-1.5 rounded-lg border border-white/10">
          <select value={selectedMonth} onChange={(e) => handleDateChange(Number(e.target.value), selectedYear)} className="bg-transparent font-bold outline-none text-sm px-2 cursor-pointer">
            {['ມັງກອນ', 'ກຸມພາ', 'ມີນາ', 'ເມສາ', 'ພຶດສະພາ', 'ມິຖຸນາ', 'ກໍລະກົດ', 'ສິງຫາ', 'ກັນຍາ', 'ຕຸລາ', 'ພະຈິກ', 'ທັນວາ'].map((m, i) => (<option key={i} value={i + 1} className="text-black">{m}</option>))}
          </select>
          <select value={selectedYear} onChange={(e) => handleDateChange(selectedMonth, Number(e.target.value))} className="bg-transparent font-bold outline-none text-sm px-2 border-l border-white/20 cursor-pointer">
            <option value={2025} className="text-black">2025</option><option value={2026} className="text-black">2026</option>
          </select>
        </div>
      </header>

      <div className="p-4 space-y-4 max-w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-3 bg-white p-5 rounded-2xl shadow-sm print:hidden border border-slate-200">
            <h2 className="text-sm font-black mb-4 flex items-center gap-2 text-blue-600">
              <span className="w-1 h-4 bg-blue-600 rounded-full"></span> {editingId ? 'ແກ້ໄຂອໍເດີ້' : 'ເພີ່ມອໍເດີ້ໃໝ່'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400">ວັນທີມັດຈຳ</label><input type="date" value={depositDate} onChange={(e) => setDepositDate(e.target.value)} className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 text-sm font-bold outline-none" required /></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400">ລະຫັດ</label><input type="text" value={orderCode} onChange={(e) => setOrderCode(e.target.value)} className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 text-sm font-black outline-none" placeholder="PKF..." required /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400">ຈຳນວນ</label><input type="number" value={totalQuantity || ''} onChange={(e) => setTotalQuantity(Number(e.target.value))} className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 text-sm font-bold" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400">ລາຄາລວມ</label><input type="number" value={totalPrice || ''} onChange={(e) => setTotalPrice(Number(e.target.value))} className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 text-sm font-black" required /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400">ມັດຈຳ</label><input type="number" value={initialDeposit || ''} onChange={(e) => setInitialDeposit(Number(e.target.value))} className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 text-sm text-emerald-600 font-bold" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400">ຕົ້ນທຶນ</label><input type="number" value={factoryCost || ''} onChange={(e) => setFactoryCost(Number(e.target.value))} className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 text-sm text-rose-500 font-bold" /></div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">ສະຖານະຜະລິດ</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 text-sm font-black">
                    <option value="ກຳລັງຜະລິດ">📦 ກຳລັງຜະລິດ</option>
                    <option value="ຜະລິດສຳເລັດແລ້ວ">✅ ຜະລິດສຳເລັດແລ້ວ</option>
                  </select>
                </div>
                {/* เพิ่มช่องวันที่ผลิตเสร็จเหมือนตัวเดิม */}
                {status === 'ຜະລິດສຳເລັດແລ້ວ' && (
                  <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
                    <label className="text-[10px] font-bold text-slate-400">ວັນທີຜະລິດສຳເລັດ</label>
                    <input type="date" value={completedDate} onChange={(e) => setCompletedDate(e.target.value)} className="w-full p-2 bg-emerald-50 rounded-lg border border-emerald-100 text-sm font-bold outline-none" />
                  </div>
                )}
                <button type="submit" className="w-full bg-[#1E293B] text-white p-3 rounded-xl font-black text-sm shadow mt-2 hover:bg-slate-800 transition-colors">
                  {editingId ? 'ອັບເດດອໍເດີ້' : 'ບັນທຶກອໍເດີ້'}
                </button>
                {editingId && <button type="button" onClick={resetForm} className="w-full text-slate-400 text-[10px] font-bold mt-1">ຍົກເລີກ</button>}
            </form>
          </div>

          <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-5 rounded-[24px] shadow-lg text-white">
              <div className="flex justify-between items-start mb-4"><div className="p-2 bg-white/20 rounded-xl"><ArrowDownCircle size={20}/></div><p className="text-[10px] font-bold uppercase bg-black/10 px-2 py-1 rounded-lg">Cash In</p></div>
              <p className="text-xs opacity-80 mb-1">ຍອດເງິນມັດຈຳເຂົ້າມາທັງໝົດ</p>
              <h3 className="text-2xl font-extrabold">{cashIn.toLocaleString()} ₭</h3>
            </div>
            <Link href={`/profit-details${queryParams}`} className="bg-gradient-to-br from-amber-500 to-orange-600 p-5 rounded-[24px] shadow-lg text-white hover:scale-[1.02] transition-transform">
              <div className="flex justify-between items-start mb-4"><div className="p-2 bg-white/20 rounded-xl"><TrendingUp size={20}/></div><p className="text-[10px] font-bold uppercase bg-black/10 px-2 py-1 rounded-lg">Net Profit</p></div>
              <p className="text-xs opacity-80 mb-1">ກຳໄລສຸດທິ</p>
              <h3 className="text-2xl font-extrabold">{totalProfitValue.toLocaleString()} ₭</h3>
            </Link>
            <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-3"><div className="p-2 bg-purple-50 rounded-xl text-purple-500"><Package size={18} /></div><p className="text-slate-400 text-[10px] font-bold uppercase">ຈຳນວນອໍເດີ້ໃນເດືອນ</p></div>
              <h3 className="text-2xl font-black text-purple-600">{filteredOrders.length} <span className="text-xs ml-1 font-bold italic">Orders</span></h3>
            </div>
            <Link href={`/customer-debt${queryParams}`} className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 flex flex-col justify-between hover:border-rose-200 transition-colors">
              <div className="flex items-center gap-3 mb-3"><div className="p-2 bg-rose-50 rounded-xl text-rose-500"><Users size={18} /></div><p className="text-slate-400 text-[10px] font-bold uppercase">ຍອດຄ້າງຈ່າຍນຳລູກຄ້າ</p></div>
              <h3 className="text-2xl font-black text-rose-500">{totalCustomerDebt.toLocaleString()} ₭</h3>
            </Link>
            <Link href={`/factory-paid${queryParams}`} className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 flex flex-col justify-between hover:border-emerald-200 transition-colors">
              <div className="flex items-center gap-3 mb-3"><div className="p-2 bg-emerald-50 rounded-xl text-emerald-500"><ArrowDownCircle size={18} /></div><p className="text-slate-400 text-[10px] font-bold uppercase">ຊຳລະໂຮງງານແລ້ວ</p></div>
              <h3 className="text-2xl font-black text-emerald-600">{totalFactoryPaid.toLocaleString()} ₭</h3>
            </Link>
            <Link href={`/factory-debt${queryParams}`} className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 flex flex-col justify-between hover:border-blue-200 transition-colors">
              <div className="flex items-center gap-3 mb-3"><div className="p-2 bg-blue-50 rounded-xl text-blue-500"><Factory size={18} /></div><p className="text-slate-400 text-[10px] font-bold uppercase">ຍອດຄ້າງຈ່າຍໂຮງງານ</p></div>
              <h3 className="text-2xl font-black text-blue-600">{totalFactoryDebt.toLocaleString()} ₭</h3>
            </Link>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl shadow-sm border border-white flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
          <div className="relative w-full md:w-80">
            <input type="text" placeholder="ຄົ້ນຫາ PKF..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-2xl border-none font-bold text-sm ring-1 ring-slate-100 focus:ring-blue-400 shadow-inner" />
            <span className="absolute left-3 top-3.5 opacity-30">🔍</span>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100 flex flex-col justify-center">
               <p className="text-[8px] font-bold text-blue-400 uppercase leading-none mb-1">Total Shirts</p>
               <p className="font-black text-blue-700 text-sm leading-none">{totalShirts.toLocaleString()} ຜືນ</p>
            </div>
            <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-slate-100">
                <button onClick={() => window.print()} className="px-4 py-2 flex items-center gap-2 text-[11px] font-black text-slate-600 hover:bg-white rounded-xl transition-all"><Printer size={14}/> Print</button>
                <button className="px-4 py-2 flex items-center gap-2 text-[11px] font-black text-emerald-600 hover:bg-white rounded-xl transition-all"><FileSpreadsheet size={14}/> Excel</button>
            </div>
            <button onClick={() => setViewAll(!viewAll)} className={`px-5 py-2.5 rounded-2xl font-bold text-[11px] shadow-sm transition-all ${!viewAll ? 'bg-amber-100 text-amber-600 ring-1 ring-amber-200' : 'bg-slate-50 text-slate-400'}`}>{viewAll ? 'ສະແດງທັງໝົດ' :'ເບິ່ງສະເພາະເດືອນ' }</button>
            <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-slate-100">
              {['ທັງໝົດ', 'ກຳລັງຜະລິດ', 'ຜະລິດສຳເລັດ'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s === 'ຜະລິດສຳເລັດ' ? 'ຜະລິດສຳເລັດແລ້ວ' : s)} className={`px-5 py-2.5 rounded-xl text-[11px] font-black transition-all ${filterStatus === (s === 'ຜະລິດສຳເລັດ' ? 'ຜະລິດສຳເລັດແລ້ວ' : s) ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50/80">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-4 py-4">ລະຫັດອໍເດີ້</th>
                  <th className="px-4 py-4 text-center">ຈຳນວນ</th> {/* คืนคอลัมน์ จำนวน */}
                  <th className="px-4 py-4 text-right">ລາຄາລວມ</th>
                  <th className="px-4 py-4 text-right text-emerald-600">ໂອນມັດຈຳແລ້ວ</th>
                  <th className="px-4 py-4 text-right text-rose-500">ຄ້າງຊຳລະຈາກລູກຄ້າ</th>
                  <th className="px-4 py-4 text-right text-blue-600">ຕົ້ນທຶນ</th>
                  <th className="px-4 py-4 text-center">ຈ່າຍໂຮງງານ</th>
                  <th className="px-4 py-4 text-center">ສະຖານະຜະລິດ</th>
                  <th className="px-4 py-4 text-center print:hidden">ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[13px] font-bold">
                {filteredOrders.map(order => {
                  const paid = (order.initial_deposit || 0) + (order.added_customer_paid || 0);
                  const isPaid = order.factory_payment_status === 'ຊຳລະແລ້ວ';
                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition-all">
                      <td className="px-4 py-4 font-black text-slate-900">{order.order_code}</td>
                      <td className="px-4 py-4 text-center text-slate-500">{order.total_quantity || 0}</td> {/* แสดงจำนวนเสื้อ */}
                      <td className="px-4 py-4 text-right">{(order.total_price || 0).toLocaleString()}</td>
                      <td className="px-4 py-4 text-right text-emerald-600">{paid.toLocaleString()}</td>
                      <td className="px-4 py-4 text-right text-rose-500">{(order.total_price - paid).toLocaleString()}</td>
                      <td className="px-4 py-4 text-right text-blue-600">{(order.factory_cost || 0).toLocaleString()}</td>
                      <td className="px-4 py-4 text-center">
                        <input type="checkbox" checked={isPaid} onChange={() => toggleFactoryPayment(order.id, order.factory_payment_status)} className="w-4 h-4 rounded text-blue-600 cursor-pointer" />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase ${order.status === 'ຜະລິດສຳເລັດແລ້ວ' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-amber-100 text-amber-700'}`}>{order.status === 'ຜະລິດສຳເລັດແລ້ວ' ? 'ສຳເລັດ' : 'ກຳລັງຜະລິດ'}</span>
                      </td>
                      <td className="px-4 py-4 print:hidden text-center">
                        <button onClick={() => startEdit(order)} className="mr-3 opacity-40 hover:opacity-100 transition-opacity">✏️</button>
                        <button onClick={() => confirm('ລຶບ?') && supabase.from('orders').delete().eq('id', order.id).then(() => fetchOrders())} className="opacity-40 hover:opacity-100 transition-opacity">🗑️</button>
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

export default function Home() {
  return <Suspense fallback={<div className="p-10 text-center">Loading...</div>}><DashboardContent /></Suspense>
}