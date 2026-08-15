import { useState } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { ProfileTab } from './tabs/ProfileTab'
import { AddressesTab } from './tabs/AddressesTab'
import { SecurityTab } from './tabs/SecurityTab'
import { SellerTab } from './tabs/SellerTab'
import { OrdersTab } from './tabs/OrdersTab'

type Tab = 'profile' | 'addresses' | 'security' | 'seller' | 'orders'

const tabs: { id: Tab; label: string; adminOnly?: boolean; sellerOnly?: boolean }[] = [
  { id: 'profile', label: 'Profil' },
  { id: 'orders', label: 'Buyurtmalarim' },
  { id: 'addresses', label: 'Manzillar' },
  { id: 'security', label: 'Xavfsizlik' },
  { id: 'seller', label: 'Seller bo\'lish' },
]

export default function AccountPage() {
  const { user } = useAuth()
  const [active, setActive] = useState<Tab>('profile')

  const visible = tabs.filter(
    (t) =>
      !(t.adminOnly && user?.role !== 'admin') &&
      !(t.sellerOnly && user?.role !== 'seller'),
  )

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold">Shaxsiy kabinet</h1>
      <p className="mt-1 text-sm text-gray-500">{user?.email}</p>

      <div className="mt-6 flex gap-6">
        <nav className="flex w-44 shrink-0 flex-col gap-1">
          {visible.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                active === tab.id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          {active === 'profile' && <ProfileTab />}
          {active === 'orders' && <OrdersTab />}
          {active === 'addresses' && <AddressesTab />}
          {active === 'security' && <SecurityTab />}
          {active === 'seller' && <SellerTab />}
        </div>
      </div>
    </div>
  )
}
