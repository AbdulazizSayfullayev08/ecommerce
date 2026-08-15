import { useSearchParams, Link } from 'react-router-dom'

export default function CheckoutSuccessPage() {
  const [params] = useSearchParams()
  const orderNumber = params.get('order') ?? params.get('session_id') ?? ''

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
        ✓
      </div>
      <h1 className="mt-4 text-2xl font-bold">Buyurtma qabul qilindi!</h1>
      <p className="mt-2 text-gray-600">
        Buyurtmangiz muvaffaqiyatli rasmiylashtirildi. Tez orada operatorlarimiz
        siz bilan bog'lanadi.
      </p>
      {orderNumber && (
        <p className="mt-3 rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-700">
          Buyurtma raqami: <span className="font-semibold">{orderNumber}</span>
        </p>
      )}
      <div className="mt-6 flex justify-center gap-3">
        <Link
          to="/products"
          className="rounded-xl bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700"
        >
          Xaridni davom ettirish
        </Link>
        <Link
          to="/account"
          className="rounded-xl border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-50"
        >
          Hisobim
        </Link>
      </div>
    </div>
  )
}
