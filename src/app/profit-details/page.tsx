"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Printer, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'

export default function ProfitDetails() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'ຜະລິດສຳເລັດແລ້ວ')
      if (orders) setData(orders)
    }
    fetchData()
  }, [])

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
      "ວັນທີ": item.deposit_date,
      "ລະຫັດອໍເດີ້": item.order_code,
      "ລາຄາຂາຍ": item.total_price,
      "ຕົ້ນທຶນ": item.factory_cost,
      "ກຳໄລ": item.total_price - item.factory_cost
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Profit Report");
    XLSX.writeFile(workbook, "รายงานกำไรสุทธิ.xlsx");
  }

  return (
    <main className="min-h-screen bg-[#E8EBF0] p-6 font-['Noto_Sans_Lao']">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex justify-between items-center print:hidden">
          <Link href="/" className="flex items-center gap-2 text-slate-600 font-bold hover:text-blue-600">
            <ArrowLeft size={20} /> ກັບຄືນหน้าหลัก
          </Link>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold"><Printer size={16}/> Print</button>
            <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold"><FileSpreadsheet size={16}/> Excel</button>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
          <h1 className="text-2xl font-black text-slate-800">ລາຍລະອຽດກຳໄລສຸດທິ</h1>
          <p className="text-emerald-600 font-bold">ລວມກຳໄລທັງໝົດ: {data.reduce((sum, item) => sum + (item.total_price - item.factory_cost), 0).toLocaleString()} ₭</p>
        </div>
        <div className="bg-white rounded-[24px] shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50"><tr className="text-[11px] font-black text-slate-400 border-b"><th className="px-6 py-4">ວັນທີ</th><th className="px-6 py-4">ລະຫັດອໍເດີ້</th><th className="px-6 py-4 text-right">ລາຄາຂາຍ</th><th className="px-6 py-4 text-right">ຕົ້ນທຶน</th><th className="px-6 py-4 text-right">ກຳໄລ</th></tr></thead>
            <tbody>
              {data.map(item => (
                <tr key={item.id} className="text-sm border-b hover:bg-slate-50">
                  <td className="px-6 py-4">{item.deposit_date}</td>
                  <td className="px-6 py-4 font-black">{item.order_code}</td>
                  <td className="px-6 py-4 text-right">{item.total_price.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">{item.factory_cost.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-emerald-600 font-bold">{(item.total_price - item.factory_cost).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}