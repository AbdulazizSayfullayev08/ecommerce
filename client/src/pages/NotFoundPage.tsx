import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p className="mt-4 text-lg text-gray-600">Sahifa topilmadi</p>
      <Link to="/" className="mt-6 rounded-lg bg-indigo-600 px-6 py-2 text-white">
        Bosh sahifaga qaytish
      </Link>
    </div>
  )
}
