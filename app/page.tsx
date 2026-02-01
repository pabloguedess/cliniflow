'use client'

import { supabase } from '@/lib/supabase'

export default function Home() {
  const testConnection = async () => {
    const { data, error } = await supabase.auth.getSession()
    console.log(data, error)
  }

  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold">CliniFlow 🚀</h1>
      <button
        onClick={testConnection}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Testar Supabase
      </button>
    </main>
  )
}
