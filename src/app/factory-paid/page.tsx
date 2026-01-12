"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'

export default function FactoryPaid() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('factory_payment_status', 'ຊຳລະແລ້ວ')
      if (orders) setData(orders)
    }
    fetchData()
  }, [])

  return (
    <main className="min-h-screen bg-[#E8EBF0] p-6 font-['Noto_Sans_Lao']">
      <div className="max-w-6xl mx-auto space-y-4">
        <Link href="/" className="flex items-center gap-2 text-slate-600 font-bold print:hidden"><ArrowLeft size={20} /> ກັບຄືນ</Link>
        <div className="bg-white p-6 rounded-[24px] shadow-sm border-l-8 border-emerald-500">
          <h1 className="text-2xl font-black">ລາຍການຊຳລະໂຮງງານແລ້ວ</h1>
          <p className="text-emerald-600 font-bold">ລວມຍອດທີ່ຈ່າຍແລ້ວ: {data.reduce((sum, item) => sum + (item.factory_cost), 0).toLocaleString()} ₭</p>
        </div>
        <div className="bg-white rounded-[24px] shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50"><tr className="text-[11px] font-black text-slate-400 border-b"><th className="px-6 py-4">ວັນທີ</th><th className="px-6 py-4">ລະຫັດອໍເดີ້</th><th className="px-6 py-4 text-right">ຍອດທີ່ຊຳລະ</th><th className="px-6 py-4 text-center">ສະຖານະ</th></tr></thead>
            <tbody>
              {data.map(item => (
                <tr key={item.id} className="text-sm border-b">
                  <td className="px-6 py-4">{item.deposit_date}</td>
                  <td className="px-6 py-4 font-black">{item.order_code}</td>
                  <td className="px-6 py-4 text-right font-bold">{item.factory_cost.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center"><span className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded text-xs font-bold">ຊຳລະແລ້ວ</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}