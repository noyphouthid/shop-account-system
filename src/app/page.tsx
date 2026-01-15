"use client"
import { useState, useEffect, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowDownCircle, TrendingUp, Users, Factory, Printer, FileSpreadsheet, Package, Shirt } from 'lucide-react';
import Link from 'next/link';

// --- 1. ข้อมูลเนื้อผ้าและราคา ---
const FABRIC_LIST = [
  { name: 'ຜ້າລາຍລູກກັອບ', short: 109000, long: 129000 },
  { name: 'ຜ້າສະແຄດີ', short: 109000, long: 129000 },
  { name: 'ຜ້າຮັງເຜີ້ງ', short: 109000, long: 129000 },
  { name: 'ຜ້າດາວກະຈາຍ', short: 109000, long: 129000 },
  { name: 'ຜ້າລັກກີ້', short: 119000, long: 139000 },
  { name: 'ຜ້າອະຕອມ', short: 119000, long: 139000 },
  { name: 'ຜ້າ Dry Tect', short: 119000, long: 139000 },
  { name: 'ຜ້າລາຍອິດ', short: 119000, long: 139000 },
  { name: 'ຜ້າລິ້ວເງົາ', short: 119000, long: 139000 },
  { name: 'ຜ້າບ໋ອກເງົາ', short: 119000, long: 139000 },
  { name: 'ຜ້າ 4 ຫຼ່ຽມ', short: 129000, long: 149000 },
  { name: 'ຜ້າຕາຫນ່າງຮູນ້ອຍ', short: 129000, long: 149000 },
  { name: 'ຜ້າສາມຫຼ່ຽມ', short: 129000, long: 149000 },
  { name: 'ຜ້າ Adidas 2023', short: 129000, long: 149000 },
  { name: 'ຜ້າ Adidas 2024', short: 149000, long: 169000 },
  { name: 'ຜ້າ ມາດດຣິດ', short: 149000, long: 169000 },
  { name: 'ຜ້າ ໄນກີ້01', short: 159000, long: 179000 },
  { name: 'ຜ້າໄມໂຄໜາ', short: 120000, long: 149000 },
  { name: 'ຜ້າໄມໂຄເກດລະອຽດ', short: 139000, long: 159000 },
];

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

  // --- Form States ---
  const [editingId, setEditingId] = useState<string | null>(null)
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0])
  const [completedDate, setCompletedDate] = useState('')
  const [orderCode, setOrderCode] = useState('')
  const [factoryBillCode, setFactoryBillCode] = useState('')
  const [status, setStatus] = useState('ກຳລັງຜະລິດ')
  
  const [selectedFabric, setSelectedFabric] = useState(FABRIC_LIST[0].name)
  const [shortSleeveQty, setShortSleeveQty] = useState(0)
  const [longSleeveQty, setLongSleeveQty] = useState(0)
  const [freeQty, setFreeQty] = useState(0)
  const [size3xlQty, setSize3xlQty] = useState(0)
  const [size4xlQty, setSize4xlQty] = useState(0)
  const [size5xlQty, setSize5xlQty] = useState(0)
  const [extraCharge, setExtraCharge] = useState(0)
  const [designDeposit, setDesignDeposit] = useState(0)
  const [initialDeposit, setInitialDeposit] = useState(0)
  const [factoryCost, setFactoryCost] = useState(0)

  const fabricData = FABRIC_LIST.find(f => f.name === selectedFabric);
  const totalShirts = shortSleeveQty + longSleeveQty + freeQty;
  
  const grossTotal = useMemo(() => {
    if (!fabricData) return 0;
    return (shortSleeveQty * fabricData.short) + 
           (longSleeveQty * fabricData.long) + 
           (size3xlQty * 20000) + 
           (size4xlQty * 25000) + 
           (size5xlQty * 35000) + 
           extraCharge;
  }, [selectedFabric, shortSleeveQty, longSleeveQty, size3xlQty, size4xlQty, size5xlQty, extraCharge]);

  const netTotal = grossTotal - designDeposit;
  const remainingDebt = netTotal - initialDeposit;

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
      factory_bill_code: factoryBillCode,
      fabric_type: selectedFabric,
      short_sleeve_qty: shortSleeveQty,
      long_sleeve_qty: longSleeveQty,
      free_qty: freeQty,
      size_3xl_qty: size3xlQty,
      size_4xl_qty: size4xlQty,
      size_5xl_qty: size5xlQty,
      extra_charge: extraCharge,
      design_deposit: designDeposit,
      total_quantity: totalShirts,
      total_price: netTotal,
      initial_deposit: initialDeposit,
      factory_cost: factoryCost,
      status: status
    }
    try {
      if (editingId) { 
        const { error } = await supabase.from('orders').update(payload).eq('id', editingId)
        if (error) throw error
      } else { 
        const { error } = await supabase.from('orders').insert([payload])
        if (error) throw error
      }
      alert("ບັນທຶກສຳເລັດ!"); 
      resetForm(); 
      await fetchOrders();
    } catch (err: any) { alert("Error: " + err.message) }
  }

  const resetForm = () => {
    setEditingId(null); setOrderCode(''); setFactoryBillCode(''); setStatus('ກຳລັງຜະລິດ');
    setShortSleeveQty(0); setLongSleeveQty(0); setFreeQty(0);
    setSize3xlQty(0); setSize4xlQty(0); setSize5xlQty(0);
    setExtraCharge(0); setDesignDeposit(0); setInitialDeposit(0); setFactoryCost(0);
    setDepositDate(new Date().toISOString().split('T')[0]); setCompletedDate('');
  }

  const startEdit = (order: any) => {
    setEditingId(order.id); setDepositDate(order.deposit_date || ''); setCompletedDate(order.completed_date || '');
    setOrderCode(order.order_code || ''); setFactoryBillCode(order.factory_bill_code || '');
    setSelectedFabric(order.fabric_type || FABRIC_LIST[0].name);
    setShortSleeveQty(order.short_sleeve_qty || 0); setLongSleeveQty(order.long_sleeve_qty || 0); setFreeQty(order.free_qty || 0);
    setSize3xlQty(order.size_3xl_qty || 0); setSize4xlQty(order.size_4xl_qty || 0); setSize5xlQty(order.size_5xl_qty || 0);
    setExtraCharge(order.extra_charge || 0); setDesignDeposit(order.design_deposit || 0);
    setInitialDeposit(order.initial_deposit || 0); setFactoryCost(order.factory_cost || 0); setStatus(order.status || 'ກຳລັງຜະລິດ');
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filteredOrders = orders.filter(order => {
    const code = (order.order_code || '').toLowerCase()
    const fcode = (order.factory_bill_code || '').toLowerCase()
    const matchesSearch = code.includes(searchTerm.toLowerCase()) || fcode.includes(searchTerm.toLowerCase())
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
  const totalShirtsMonthly = filteredOrders.reduce((sum, o) => sum + (o.total_quantity || 0), 0)
  const queryParams = `?month=${selectedMonth}&year=${selectedYear}`;

  return (
    <main className="min-h-screen bg-[#E8EBF0] text-slate-800 font-['Noto_Sans_Lao'] pb-10">
      <header className="bg-[#1E293B] text-white py-3 px-6 flex justify-between items-center shadow-md sticky top-0 z-50 print:hidden">
        <div className="flex items-center gap-3">
          <div className="bg-[#FFD700] text-[#1E293B] px-3 py-1 rounded font-black text-xl italic">BG</div>
          <h1 className="text-lg font-bold uppercase tracking-wider">BG SPORT ACCOUNTING</h1>
        </div>
        <div className="flex gap-2 bg-[#ffffff15] p-1.5 rounded-lg border border-white/10">
          <select value={selectedMonth} onChange={(e) => handleDateChange(Number(e.target.value), selectedYear)} className="bg-transparent font-bold outline-none text-sm px-2 cursor-pointer">
            {['ມັງກອນ', 'ກຸມພາ', 'ມີນາ', 'ເມສາ', 'ພຶດສະພາ', 'ມິຖຸນາ', 'ກໍລະກົດ', 'ສິງຫາ', 'ກັນຍา', 'ຕຸລາ', 'ພະຈິກ', 'ທັນວา'].map((m, i) => (<option key={i} value={i + 1} className="text-black">{m}</option>))}
          </select>
          <select value={selectedYear} onChange={(e) => handleDateChange(selectedMonth, Number(e.target.value))} className="bg-transparent font-bold outline-none text-sm px-2 border-l border-white/20 cursor-pointer">
            <option value={2025} className="text-black">2025</option><option value={2026} className="text-black">2026</option>
          </select>
        </div>
      </header>

      <div className="p-4 space-y-4 max-w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* --- Form Section (ขยายกว้างถึงกึ่งกลางหน้าจอ) --- */}
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl shadow-sm print:hidden border border-slate-200">
            <h2 className="text-base font-black mb-6 flex items-center gap-2 text-blue-600">
              <span className="w-1.5 h-5 bg-blue-600 rounded-full"></span> {editingId ? 'ແກ້ໄຂອໍເດີ້' : 'ເພີ່ມອໍເດີ້ໃໝ່'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[11px] font-bold text-slate-400">ວັນທີມັດຈຳ</label><input type="date" value={depositDate} onChange={(e) => setDepositDate(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all" required /></div>
                  <div className="space-y-1"><label className="text-[11px] font-bold text-slate-400">ລະຫັດຮ້ານ (PKF)</label><input type="text" value={orderCode} onChange={(e) => setOrderCode(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-black focus:ring-2 focus:ring-blue-100 outline-none transition-all" placeholder="PKF..." required /></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[11px] font-bold text-blue-500 italic">ບຶນໂຮງງານ (ຖ້າມີ)</label><input type="text" value={factoryBillCode} onChange={(e) => setFactoryBillCode(e.target.value)} className="w-full p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-sm font-black focus:ring-2 focus:ring-blue-100 outline-none" placeholder="ID ໂຮງງານ" /></div>
                  <div className="space-y-1"><label className="text-[11px] font-bold text-rose-500">ລວມຕົ້ນທຶນໂຮງງານ</label><input type="number" value={factoryCost || ''} onChange={(e) => setFactoryCost(Number(e.target.value))} className="w-full p-3 bg-rose-50/50 rounded-xl border border-rose-100 text-sm text-rose-600 font-bold focus:ring-2 focus:ring-rose-100 outline-none" placeholder="0" /></div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">ເລືອກເນື້ອຜ້າທີ່ສັ່ງ</label>
                  <select value={selectedFabric} onChange={(e) => setSelectedFabric(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold appearance-none cursor-pointer">
                    {FABRIC_LIST.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1"><label className="text-[11px] font-bold text-slate-400">ແຂນສັ້ນ</label><input type="number" value={shortSleeveQty || ''} onChange={(e) => setShortSleeveQty(Number(e.target.value))} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold text-center" /></div>
                  <div className="space-y-1"><label className="text-[11px] font-bold text-slate-400">ແຂນຍາວ</label><input type="number" value={longSleeveQty || ''} onChange={(e) => setLongSleeveQty(Number(e.target.value))} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold text-center" /></div>
                  <div className="space-y-1"><label className="text-[11px] font-bold text-slate-400">ຕົວແຖມ</label><input type="number" value={freeQty || ''} onChange={(e) => setFreeQty(Number(e.target.value))} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold text-center" /></div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1"><label className="text-[11px] font-bold text-amber-600">3XL (+20k)</label><input type="number" value={size3xlQty || ''} onChange={(e) => setSize3xlQty(Number(e.target.value))} className="w-full p-3 bg-amber-50 rounded-xl border border-amber-100 text-sm font-bold text-center" /></div>
                  <div className="space-y-1"><label className="text-[11px] font-bold text-amber-600">4XL (+25k)</label><input type="number" value={size4xlQty || ''} onChange={(e) => setSize4xlQty(Number(e.target.value))} className="w-full p-3 bg-amber-50 rounded-xl border border-amber-100 text-sm font-bold text-center" /></div>
                  <div className="space-y-1"><label className="text-[11px] font-bold text-amber-600">5XL (+35k)</label><input type="number" value={size5xlQty || ''} onChange={(e) => setSize5xlQty(Number(e.target.value))} className="w-full p-3 bg-amber-50 rounded-xl border border-amber-100 text-sm font-bold text-center" /></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[11px] font-bold text-slate-400">ບວກເພີ່ມ (ງານດ່ວນ)</label><input type="number" value={extraCharge || ''} onChange={(e) => setExtraCharge(Number(e.target.value))} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold" /></div>
                  <div className="space-y-1"><label className="text-[11px] font-bold text-rose-500">ຫັກມັດຈຳ (ອອກແບບ)</label><input type="number" value={designDeposit || ''} onChange={(e) => setDesignDeposit(Number(e.target.value))} className="w-full p-3 bg-rose-50 rounded-xl border border-rose-100 text-sm font-bold" /></div>
                </div>

                <div className="p-5 bg-slate-900 rounded-2xl text-white shadow-xl">
                  <div className="flex justify-between text-[11px] opacity-70 mb-2 font-bold uppercase tracking-widest"><span>ລວມ {totalShirts} ຜືນ</span><span>Gross: {grossTotal.toLocaleString()}</span></div>
                  <div className="flex justify-between items-center"><span className="text-sm font-black">ຍອດລວມສຸດທິ:</span><span className="text-2xl font-black text-[#FFD700]">{netTotal.toLocaleString()} ₭</span></div>
                </div>

                <div className="grid grid-cols-2 gap-4 items-end">
                  <div className="space-y-1"><label className="text-[11px] font-bold text-emerald-600">ມັດຈຳສັ່ງຜະລິດ (ຮັບແລ້ວ)</label><input type="number" value={initialDeposit || ''} onChange={(e) => setInitialDeposit(Number(e.target.value))} className="w-full p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-sm font-black text-emerald-700" required /></div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <span className="text-[10px] font-black text-rose-500 uppercase">Balance:</span>
                    <span className="text-lg font-black text-rose-600">{remainingDebt.toLocaleString()} ₭</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">ສະຖານະການຜະລິດ</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-black cursor-pointer">
                      <option value="ກຳລັງຜະລິດ">📦 ກຳລັງຜະລິດ</option>
                      <option value="ຜະລິດສຳເລັດແລ້ວ">✅ ຜະລິດສຳເລັດແລ້ວ</option>
                    </select>
                  </div>
                  {status === 'ຜະລິດສຳເລັດແລ້ວ' && (
                    <div className="space-y-1 animate-in fade-in slide-in-from-top-1"><label className="text-[11px] font-bold text-slate-400">ວັນທີສຳເລັດ</label><input type="date" value={completedDate} onChange={(e) => setCompletedDate(e.target.value)} className="w-full p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-sm font-bold" /></div>
                  )}
                </div>

                <button type="submit" className="w-full bg-[#1E293B] text-white p-4 rounded-2xl font-black text-base shadow-lg mt-2 hover:bg-slate-800 transition-all hover:scale-[0.99] active:scale-95">
                  {editingId ? 'ອັບເດດຂໍ້ມູນອໍເດີ້' : 'ບັນທຶກອໍເດີ້ໃໝ່'}
                </button>
                {editingId && <button type="button" onClick={resetForm} className="w-full text-slate-400 text-xs font-bold py-2">ຍົກເລີກການແກ້ໄຂ</button>}
            </form>
          </div>

          {/* --- Dashboard Cards (ย่อมาครึ่งขวา) --- */}
          <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-6 rounded-[32px] shadow-lg text-white">
              <div className="flex justify-between items-start mb-6"><div className="p-2 bg-white/20 rounded-xl"><ArrowDownCircle size={24}/></div><p className="text-[10px] font-bold uppercase bg-black/10 px-2 py-1 rounded-lg">Cash In</p></div>
              <p className="text-xs opacity-80 mb-1 font-bold">ມັດຈຳທີ່ຮັບມາແລ້ວ</p>
              <h3 className="text-3xl font-extrabold">{cashIn.toLocaleString()} ₭</h3>
            </div>
            <Link href={`/profit-details${queryParams}`} className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-[32px] shadow-lg text-white hover:scale-[1.02] transition-transform">
              <div className="flex justify-between items-start mb-6"><div className="p-2 bg-white/20 rounded-xl"><TrendingUp size={24}/></div><p className="text-[10px] font-bold uppercase bg-black/10 px-2 py-1 rounded-lg">Net Profit</p></div>
              <p className="text-xs opacity-80 mb-1 font-bold">ກຳໄລສຸດທິ</p>
              <h3 className="text-3xl font-extrabold">{totalProfitValue.toLocaleString()} ₭</h3>
            </Link>
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4"><div className="p-2 bg-purple-50 rounded-xl text-purple-500"><Package size={20} /></div><p className="text-slate-400 text-[10px] font-bold uppercase">ອໍເດີ້ທັງໝົດ</p></div>
              <h3 className="text-3xl font-black text-purple-600">{filteredOrders.length} <span className="text-xs ml-1 font-bold italic">Orders</span></h3>
            </div>
            <Link href={`/customer-debt${queryParams}`} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col justify-between hover:border-rose-200 transition-colors">
              <div className="flex items-center gap-3 mb-4"><div className="p-2 bg-rose-50 rounded-xl text-rose-500"><Users size={20} /></div><p className="text-slate-400 text-[10px] font-bold uppercase">ລູกຄ້າຄ້າງຈ່າຍ</p></div>
              <h3 className="text-3xl font-black text-rose-500">{totalCustomerDebt.toLocaleString()} ₭</h3>
            </Link>
            <Link href={`/factory-paid${queryParams}`} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col justify-between hover:border-emerald-200 transition-colors">
              <div className="flex items-center gap-3 mb-4"><div className="p-2 bg-emerald-50 rounded-xl text-emerald-500"><ArrowDownCircle size={20} /></div><p className="text-slate-400 text-[10px] font-bold uppercase">ຈ່າຍໂຮງງານແລ້ວ</p></div>
              <h3 className="text-3xl font-black text-emerald-600">{totalFactoryPaid.toLocaleString()} ₭</h3>
            </Link>
            <Link href={`/factory-debt${queryParams}`} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col justify-between hover:border-blue-200 transition-colors">
              <div className="flex items-center gap-3 mb-4"><div className="p-2 bg-blue-50 rounded-xl text-blue-500"><Factory size={20} /></div><p className="text-slate-400 text-[10px] font-bold uppercase">ຄ້າງຈ່າຍໂຮງງານ</p></div>
              <h3 className="text-3xl font-black text-blue-600">{totalFactoryDebt.toLocaleString()} ₭</h3>
            </Link>
          </div>
        </div>

        {/* --- Filters & Actions --- */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-white flex flex-col md:flex-row justify-between items-center gap-4 print:hidden mt-4">
          <div className="relative w-full md:w-80">
            <input type="text" placeholder="ຄົ້ນຫາ PKF ຫຼື ບຶນໂຮງງານ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 rounded-2xl border-none font-bold text-sm ring-1 ring-slate-100 focus:ring-blue-400 shadow-inner" />
            <span className="absolute left-4 top-4 opacity-30">🔍</span>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="bg-blue-50 px-5 py-2.5 rounded-2xl border border-blue-100 flex flex-col justify-center">
               <p className="text-[8px] font-black text-blue-400 uppercase leading-none mb-1">Total Shirts Monthly</p>
               <p className="font-black text-blue-700 text-base leading-none">{totalShirtsMonthly.toLocaleString()} ຜືນ</p>
            </div>
            <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100">
                <button onClick={() => window.print()} className="px-5 py-2 flex items-center gap-2 text-[11px] font-black text-slate-600 hover:bg-white rounded-xl transition-all"><Printer size={16}/> Print</button>
                <button className="px-5 py-2 flex items-center gap-2 text-[11px] font-black text-emerald-600 hover:bg-white rounded-xl transition-all"><FileSpreadsheet size={16}/> Excel</button>
            </div>
            <button onClick={() => setViewAll(!viewAll)} className={`px-6 py-3 rounded-2xl font-black text-[11px] shadow-sm transition-all ${!viewAll ? 'bg-amber-100 text-amber-600 ring-1 ring-amber-200' : 'bg-slate-50 text-slate-400'}`}>{viewAll ? 'ສະແດງທັງໝົດ' :'ເບິ່ງສະເພາະເດືອນ' }</button>
            <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100">
              {['ທັງໝົດ', 'ກຳລັງຜະລິດ', 'ຜະລິດສຳເລັດ'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s === 'ຜະລິດສຳເລັດ' ? 'ຜະລິດສຳເລັດແລ້ວ' : s)} className={`px-6 py-2.5 rounded-xl text-[11px] font-black transition-all ${filterStatus === (s === 'ຜະລິດສຳເລັດ' ? 'ຜະລິດສຳເລັດແລ້ວ' : s) ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        {/* --- Table Section --- */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50/80">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-5">ລະຫັດອໍເດີ້ / ບຶນໂຮງງານ</th>
                  <th className="px-6 py-5 text-center">ຂໍ້ມູນຜ້າ/ຈຳນວນ</th>
                  <th className="px-6 py-5 text-right">ລາຄາລວມສຸທິ</th>
                  <th className="px-6 py-5 text-right text-emerald-600">ມັດຈຳແລ້ວ</th>
                  <th className="px-6 py-5 text-right text-rose-500">ຄ້າງຊຳລະ</th>
                  <th className="px-6 py-5 text-right text-blue-600">ຕົ້ນທຶนໂຮງງານ</th>
                  <th className="px-6 py-5 text-center">ຈ່າຍໂຮງງານ</th>
                  <th className="px-6 py-5 text-center">ສະຖານະຜະລິດ</th>
                  <th className="px-6 py-5 text-center print:hidden">ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[13px] font-bold">
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={9} className="py-20 text-center text-slate-300 font-black italic">ຍັງບໍ່ມີຂໍ້ມູນໃນລາຍການນີ້</td></tr>
                ) : filteredOrders.map(order => {
                  const totalPaid = (order.initial_deposit || 0) + (order.added_customer_paid || 0);
                  const customerRemain = (order.total_price || 0) - totalPaid;
                  const isPaidFactory = order.factory_payment_status === 'ຊຳລະແລ້ວ';
                  
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-6 py-4">
                        <div className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">{order.order_code}</div>
                        <div className="text-[10px] text-blue-400 italic font-medium">{order.factory_bill_code || '---'}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-xs text-slate-600 font-black">{order.fabric_type}</div>
                        <div className="text-[10px] text-slate-400 font-bold">ລວມ: {order.total_quantity} ຜືນ</div>
                      </td>
                      <td className="px-6 py-4 text-right">{(order.total_price || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-emerald-600 font-black">{totalPaid.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-rose-500 font-black">{customerRemain.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-blue-600">{(order.factory_cost || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-center">
                        <input type="checkbox" checked={isPaidFactory} onChange={() => toggleFactoryPayment(order.id, order.factory_payment_status)} className="w-5 h-5 rounded-lg text-blue-600 cursor-pointer border-slate-300 focus:ring-blue-500" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase shadow-sm ${order.status === 'ຜະລິດສຳເລັດແລ້ວ' ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700'}`}>{order.status === 'ຜະລິດສຳເລັດແລ້ວ' ? 'ສຳເລັດ' : 'ກຳລັງຜະລິດ'}</span>
                      </td>
                      <td className="px-6 py-4 print:hidden text-center">
                        <button onClick={() => startEdit(order)} className="mr-3 opacity-30 hover:opacity-100 transition-opacity p-2 hover:bg-white rounded-lg shadow-sm">✏️</button>
                        <button onClick={() => confirm('ລຶບອໍເດີ້?') && supabase.from('orders').delete().eq('id', order.id).then(() => fetchOrders())} className="opacity-30 hover:opacity-100 transition-opacity p-2 hover:bg-white rounded-lg shadow-sm text-rose-500">🗑️</button>
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
  return <Suspense fallback={<div className="p-20 text-center font-black animate-pulse">Loading Dashboard...</div>}><DashboardContent /></Suspense>
}