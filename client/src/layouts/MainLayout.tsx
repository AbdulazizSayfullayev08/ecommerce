import { Link, NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Bosh sahifa' },
  { to: '/products', label: 'Mahsulotlar' },
  { to: '/cart', label: 'Savat' },
  { to: '/login', label: 'Kirish' },
]

export default function MainLayout() {
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
