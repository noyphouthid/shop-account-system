"use client"
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Printer, FileSpreadsheet, Search } from 'lucide-react'

function ProfitContent() {
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  
  // ดึงค่าเดือน/ปี จาก URL ถ้าไม่มีให้ใช้ปัจจุบัน
  const month = Number(searchParams.get('month')) || new Date().getMonth() + 1
  const year = Number(searchParams.get('year')) || new Date().getFullYear()

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('orders').select('*').eq('status', 'ຜະລິດສຳເລັດແລ້ວ')
      if (data) setOrders(data)
    }
    fetchData()
  }, [])

  // กรองข้อมูลตามเดือน/ปี และ คำค้นหา
  const filteredData = orders.filter(o => {
    const d = new Date(o.deposit_date)
    const matchesDate = (d.getMonth() + 1) === month && d.getFullYear() === year
    const matchesSearch = o.order_code?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesDate && matchesSearch
  })

  const totalProfit = filteredData.reduce((sum, o) => sum + (o.total_price - o.factory_cost), 0)

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-['Noto_Sans_Lao']">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
          <Link href="/" className="flex items-center gap-2 text-slate-500 font-bold hover:text-blue-600 transition-colors">
            <ArrowLeft size={20} /> ກັບຄືນໜ້າຫຼັກ
          </Link>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-2xl text-sm font-bold shadow-sm hover:bg-slate-50"><Printer size={16}/> Print</button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-200/50 hover:bg-emerald-700"><FileSpreadsheet size={16}/> Export Excel</button>
          </div>
        </div>

        {/* Title & Stats Card */}
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-800">ລາຍລະອຽດກຳໄລສຸດທິ</h1>
            <p className="text-slate-400 font-bold">ປະຈຳເດືອນ {month} / {year}</p>
          </div>
          <div className="bg-emerald-50 px-8 py-4 rounded-[24px] text-center border border-emerald-100">
            <p className="text-emerald-500 text-xs font-black uppercase mb-1">ກຳໄລລວມທັງໝົດ</p>
            <p className="text-3xl font-black text-emerald-600">{totalProfit.toLocaleString()} <span className="text-sm">₭</span></p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative print:hidden">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="ຄົ້ນຫາດ້ວຍລະຫັດອໍເດີ້..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-none shadow-sm font-bold ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Improved Table */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-5">ວັນທີວັນທີ</th>
                <th className="px-8 py-5">ລະຫັດອໍເດີ້</th>
                <th className="px-8 py-5 text-right">ລາຄາຂາຍ</th>
                <th className="px-8 py-5 text-right">ຕົ້ນທຶນໂຮງງານ</th>
                <th className="px-8 py-5 text-right text-emerald-600 bg-emerald-50/30">ກຳໄລ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-8 py-5 text-slate-500 font-medium">{item.deposit_date}</td>
                  <td className="px-8 py-5 font-black text-slate-900">{item.order_code}</td>
                  <td className="px-8 py-5 text-right font-black">{item.total_price.toLocaleString()}</td>
                  <td className="px-8 py-5 text-right font-black text-slate-600">{item.factory_cost.toLocaleString()}</td>
                  <td className="px-8 py-5 text-right font-black text-emerald-600 bg-emerald-50/10">{(item.total_price - item.factory_cost).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredData.length === 0 && (
            <div className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest">ບໍ່ມີຂໍ້ມູນໃນເດືອນນີ້</div>
          )}
        </div>
      </div>
    </main>
  )
}

export default function ProfitDetails() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <ProfitContent />
    </Suspense>
  )
}