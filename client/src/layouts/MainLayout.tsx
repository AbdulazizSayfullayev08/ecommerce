import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { useCart } from '@/features/cart/CartContext'
import { getFileUrl } from '@/utils/fileUrl'

const navItems = [
  { to: '/', label: 'Bosh sahifa' },
  { to: '/products', label: 'Mahsulotlar' },
]

export default function MainLayout() {
  const { user, logout } = useAuth()
  const { itemCount } = useCart()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/" className="text-xl font-bold text-indigo-600">
            Do'kon
          </Link>
          <nav className="flex items-center gap-6">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive
                    ? 'font-medium text-indigo-600'
                    : 'text-gray-600 hover:text-indigo-600'
                }
              >
                {item.label}
              </NavLink>
            ))}

            {user ? (
              <div className="flex items-center gap-3">
                <NavLink
                  to="/cart"
                  className={({ isActive }) =>
                    `relative rounded-lg px-3 py-1.5 text-sm ${
                      isActive
                        ? 'font-medium text-indigo-600'
                        : 'text-gray-600 hover:text-indigo-600'
                    }`
                  }
                >
                  Savat
                  {itemCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {itemCount}
                    </span>
                  )}
                </NavLink>
                <div className="flex items-center gap-2">
                  {user.avatar && (
                    <img
                      src={getFileUrl(user.avatar)}
                      alt=""
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  )}
                  <Link to="/account" className="text-gray-700 hover:text-indigo-600">
                    {user.name}
                  </Link>
                </div>
                {user.role === 'admin' && (
                  <Link to="/admin/users" className="text-gray-600 hover:text-indigo-600">
                    Boshqaruv
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin/payouts" className="text-gray-600 hover:text-indigo-600">
                    To'lovlar
                  </Link>
                )}
                <button
                  onClick={() => logout()}
                  className="rounded-lg px-3 py-1.5 text-sm text-red-500 hover:bg-red-50"
                >
                  Chiqish
                </button>
              </div>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  isActive
                    ? 'font-medium text-indigo-600'
                    : 'text-gray-600 hover:text-indigo-600'
                }
              >
                Kirish
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Do'kon — Multi-vendor e-commerce
      </footer>
    </div>
  )
}
