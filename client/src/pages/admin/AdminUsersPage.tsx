import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { userApi } from '@/features/user/userApi'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import type { User, UserRole } from '@/types'

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [total, setTotal] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async (page = 1) => {
    setIsLoading(true)
    setError('')
    try {
      const result = await userApi.listUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        page,
      })
      setUsers(result.users)
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Foydalanuvchilar yuklanmadi')
    } finally {
      setIsLoading(false)
    }
  }, [search, roleFilter])

  useEffect(() => {
    void load(1)
  }, [load])

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    void load(1)
  }

  const run = async (id: string, fn: () => Promise<{ user: User }>, successMessage: string) => {
    setError('')
    setMessage('')
    setBusyId(id)
    try {
      const { user } = await fn()
      setUsers((prev) => prev.map((u) => (u._id === user._id ? user : u)))
      setMessage(successMessage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold">Foydalanuvchilar</h1>
      <p className="mt-1 text-sm text-gray-500">Jami: {total}</p>

      <form onSubmit={handleSearch} className="mt-4 flex gap-2">
        <Input
          id="user-search"
          placeholder="Ism yoki email bo'yicha qidirish"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        >
          <option value="">Barcha rollar</option>
          <option value="customer">Xaridor</option>
          <option value="seller">Seller</option>
          <option value="admin">Admin</option>
        </select>
        <Button type="submit">Qidirish</Button>
      </form>

      {message && <div className="mt-3"><Alert type="success" message={message} /></div>}
      {error && <div className="mt-3"><Alert type="error" message={error} /></div>}

      {isLoading ? (
        <p className="py-10 text-center text-sm text-gray-400">Yuklanmoqda...</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3">Foydalanuvchi</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Holat</th>
                <th className="px-4 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => {
                const isSelf = user._id === currentUser?._id
                return (
                <tr key={user._id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      disabled={isSelf || busyId === user._id}
                      onChange={(e) =>
                        void run(
                          user._id,
                          () => userApi.changeRole(user._id, e.target.value as UserRole),
                          'Rol o\'zgartirildi',
                        )
                      }
                      className="rounded-lg border border-gray-300 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="customer">Xaridor</option>
                      <option value="seller">Seller</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.isBlocked ? (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">
                          Bloklangan
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-600">
                          Faol
                        </span>
                      )}
                      {user.role === 'seller' &&
                        (user.isApproved ? (
                          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600">
                            Tasdiqlangan
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-600">
                            Kutilmoqda
                          </span>
                        ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2 text-xs">
                      {user.role === 'seller' && !user.isApproved && (
                        <button
                          disabled={busyId === user._id}
                          onClick={() =>
                            void run(
                              user._id,
                              () => userApi.setApproved(user._id, true),
                              'Seller tasdiqlandi',
                            )
                          }
                          className="font-medium text-indigo-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Tasdiqlash
                        </button>
                      )}
                      {!isSelf && (
                        <button
                          disabled={busyId === user._id}
                          onClick={() =>
                            void run(
                              user._id,
                              () => userApi.setBlocked(user._id, !user.isBlocked),
                              user.isBlocked ? 'Blok olib tashlandi' : 'Foydalanuvchi bloklandi',
                            )
                          }
                          className={
                            user.isBlocked
                              ? 'font-medium text-green-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50'
                              : 'font-medium text-red-500 hover:underline disabled:cursor-not-allowed disabled:opacity-50'
                          }
                        >
                          {busyId === user._id
                            ? 'Iltimos kuting...'
                            : user.isBlocked
                              ? 'Blokdan chiqarish'
                              : 'Bloklash'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {users.length === 0 && !isLoading && (
        <p className="py-8 text-center text-sm text-gray-400">Hech narsa topilmadi.</p>
      )}
    </div>
  )
}
