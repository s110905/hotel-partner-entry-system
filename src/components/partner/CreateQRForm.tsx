import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Plus, Users } from 'lucide-react'
import { useState } from 'react'
import './CreateQRForm.css'

type CreateQRFormProps = {
  partnerName: string
  onAdd: (partnerName: string, totalQuota: number) => Promise<void>
}

export function CreateQRForm({ partnerName, onAdd }: CreateQRFormProps) {
  const [quota, setQuota] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isSuccess || isSubmitting) return

    setError('')

    if (quota < 1 || quota > 100) {
      setError('可用名額請設定在 1 到 100 之間。')
      return
    }

    setIsSubmitting(true)

    try {
      await onAdd(partnerName.trim(), quota)
      setIsSubmitting(false)
      setIsSuccess(true)

      window.setTimeout(() => {
        setIsSuccess(false)
        setQuota(1)
      }, 1800)
    } catch (err) {
      setIsSubmitting(false)
      setError('建立失敗，請稍後再試。')
    }
  }

  return (
    <motion.div layout className="glass-card create-form-card">
      <div className="create-form-header">
        <div className="create-form-icon">
          <Plus size={20} />
        </div>
        <div>
          <h3>建立新憑證</h3>
        </div>
      </div>

      <div className="create-form-body">
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              className="create-form-success"
            >
              <div className="create-form-success-icon">
                <CheckCircle2 size={42} />
              </div>
              <h4>憑證建立成功</h4>
              <p>新的 QR 憑證已加入清單，您可以立即下載並提供給合作夥伴。</p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="create-form-fields"
            >
              <label className="create-form-field">
                <span className="create-form-label">
                  <Users size={14} />
                  可用人數
                </span>
                <div className="create-form-quota-row">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={quota}
                    onChange={(event) => setQuota(Number.parseInt(event.target.value, 10))}
                    disabled={isSubmitting}
                  />
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quota}
                    onChange={(event) => {
                      const v = Number.parseInt(event.target.value, 10)
                      setQuota(isNaN(v) ? 1 : Math.max(1, Math.min(100, v)))
                    }}
                    onBlur={() => {
                      if (!quota) setQuota(1)
                    }}
                    disabled={isSubmitting}
                    className="create-form-number"
                  />
                </div>
                <small>每次發放上限為 100 人。</small>
              </label>

              <AnimatePresence>
                {error ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="create-form-error"
                  >
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <button type="submit" disabled={isSubmitting} className="btn-primary create-form-submit">
                {isSubmitting ? '建立中...' : '建立 QR 憑證'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
