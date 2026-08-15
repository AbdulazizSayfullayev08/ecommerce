interface AlertProps {
  type: 'error' | 'success' | 'info'
  message: string
}

export function Alert({ type, message }: AlertProps) {
  const styles = {
    error: 'bg-red-50 text-red-700 border-red-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  }
  return (
    <div className={`rounded-lg border px-4 py-2 text-sm ${styles[type]}`}>
      {message}
    </div>
  )
}
