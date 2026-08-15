import { useEffect, useState } from 'react'
import { apiRequest } from '@/utils/api'
import type { HealthData } from '@/types'

export default function HomePage() {
  const [status, setStatus] = useState<string>('tekshirilmoqda...')

  useEffect(() => {
    apiRequest<HealthData>('/health')
      .then((data) => setStatus(data.status))
      .catch(() => setStatus('serverga ulanib bo\'lmadi'))
  }, [])

  return (
    <div>
      <section className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-10 text-white">
        <h1 className="text-3xl font-bold">Multi-vendor e-commerce do'kon</h1>
        <p className="mt-2 text-indigo-100">
          Faza 1 skeleton tayyor. Backend holati: <strong>{status}</strong>
        </p>
      </section>
    </div>
  )
}
