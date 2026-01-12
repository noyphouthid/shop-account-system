"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'

export default function CustomerDebt() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const { data: orders } = await supabase
        .from('orders')
        .select(`*, customer_payments(amount)`)
      
      if (orders) {
        const filtered = orders.filter(o => {
          const paid = (o.initial_deposit || 0) + (o.customer_payments?.reduce((sum:any, p:any) => sum + p.amount, 0) || 0);
          return (o.total_price - paid) > 0;
        });
        setData(filtered);
      }
    }
    fetchData()
  }, [])

  return (
    <main className="min-h-screen bg-[#E8EBF0] p-6 font-['Noto_Sans_Lao']">
      <div className="max-w-6xl mx-auto space-y-4">
        <Link href="/" className="flex items-center gap-2 text-slate-600 font-bold print:hidden"><ArrowLeft size={20} /> ກັບຄືນ</Link>
        <div className="bg-white p-6 rounded-[24px] shadow-sm border-l-8 border-rose-400">
          <div className="flex items-center gap-3 mb-2"><Users className="text-rose-400"/><h1 className="text-2xl font-black">ຍອດຄ້າງຊຳລະຈາກລູກຄ້າ</h1></div>
          <p className="text-rose-600 font-bold text-xl">ລວມຍອດຄ້າງຮັບທັງໝົດ: {data.reduce((sum, o) => {
            const paid = (o.initial_deposit || 0) + (o.customer_payments?.reduce((s:any, p:any) => s + p.amount, 0) || 0);
            return sum + (o.total_price - paid);
          }, 0).toLocaleString()} ₭</p>
        </div>
        <div className="bg-white rounded-[24px] shadow-sm overflow-hidden text-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50"><tr className="font-black text-slate-400 border-b"><th className="px-6 py-4">ລະຫັດອໍເດີ້</th><th className="px-6 py-4 text-right">ລາຄາເຕັມ</th><th className="px-6 py-4 text-right">ຈ່າຍແລ້ວ</th><th className="px-6 py-4 text-right text-rose-500">ຍັງຄ້າງ</th></tr></thead>
            <tbody>
              {data.map(o => {
                const paid = (o.initial_deposit || 0) + (o.customer_payments?.reduce((s:any, p:any) => s + p.amount, 0) || 0);
                return (
                  <tr key={o.id} className="border-b hover:bg-slate-50">
                    <td className="px-6 py-4 font-black">{o.order_code}</td>
                    <td className="px-6 py-4 text-right font-bold">{o.total_price.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-emerald-600 font-bold">{paid.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-rose-500 font-black">{(o.total_price - paid).toLocaleString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}