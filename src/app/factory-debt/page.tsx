"use client"
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Printer, FileSpreadsheet, Search, Factory } from 'lucide-react'

function DebtContent() {
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  
  const month = Number(searchParams.get('month')) || new Date().getMonth() + 1
  const year = Number(searchParams.get('year')) || new Date().getFullYear()

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('orders').select('*').neq('factory_payment_status', 'ຊຳລະແລ້ວ')
      if (data) setOrders(data)
    }
    fetchData()
  }, [])

  const filteredData = orders.filter(o => {
    const d = new Date(o.deposit_date)
    const matchesDate = (d.getMonth() + 1) === month && d.getFullYear() === year
    const matchesSearch = o.order_code?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesDate && matchesSearch
  })

  const totalDebt = filteredData.reduce((sum, o) => sum + (o.factory_cost || 0), 0)

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-['Noto_Sans_Lao']">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center print:hidden">
          <Link href="/" className="flex items-center gap-2 text-slate-500 font-bold hover:text-blue-600 transition-colors">
            <ArrowLeft size={20} /> ກັບຄືນໜ້າຫຼັກ
          </Link>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-2xl text-sm font-bold shadow-sm hover:bg-slate-50"><Printer size={16}/> Print</button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-rose-50 text-rose-500 rounded-2xl"><Factory size={32}/></div>
            <div>
              <h1 className="text-3xl font-black text-slate-800">ຍອດຄ້າງຈ່າຍໂຮງງານ</h1>
              <p className="text-slate-400 font-bold">ປະຈຳເດືອນ {month} / {year}</p>
            </div>
          </div>
          <div className="bg-rose-50 px-8 py-4 rounded-[24px] text-center border border-rose-100">
            <p className="text-rose-500 text-xs font-black uppercase mb-1">ຍອດຄ້າງຈ່າຍລວມ</p>
            <p className="text-3xl font-black text-rose-600">{totalDebt.toLocaleString()} <span className="text-sm">₭</span></p>
          </div>
        </div>

        <div className="relative print:hidden">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input type="text" placeholder="ຄົ້ນຫາດ້ວຍລະຫັດອໍເດີ້..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-none shadow-sm font-bold ring-1 ring-slate-100 focus:ring-2 focus:ring-rose-500 outline-none" />
        </div>

        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-5">ວັນທີ</th>
                <th className="px-8 py-5">ລະຫັດອໍເດີ້</th>
                <th className="px-8 py-5 text-right">ຕົ້ນທຶນທັງໝົດ</th>
                <th className="px-8 py-5 text-center">ສະຖານະ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors text-sm font-bold">
                  <td className="px-8 py-5 text-slate-500">{item.deposit_date}</td>
                  <td className="px-8 py-5 font-black text-slate-900">{item.order_code}</td>
                  <td className="px-8 py-5 text-right text-rose-600 font-black">{item.factory_cost.toLocaleString()}</td>
                  <td className="px-8 py-5 text-center">
                    <span className="bg-rose-100 text-rose-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase">ຍັງບໍ່ທັນຊຳລະ</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}

export default function FactoryDebt() {
  return <Suspense fallback={<div>Loading...</div>}><DebtContent /></Suspense>
}