import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpDown, Filter, LayoutGrid, List as ListIcon, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { QrLifecycleStatus, QrRecord } from '../../types/qr'
import { computeStatus } from '../../utils/status'
import { QRCard } from './QRCard'
import './QRList.css'

type QRListProps = {
  records: QrRecord[]
  onIncrementDownload: (id: string) => Promise<void>
}

type SortOption = 'newest' | 'oldest' | 'quota_high' | 'quota_low' | 'remaining_low'

const STATUS_OPTIONS: { label: string; value: QrLifecycleStatus | 'all' }[] = [
  { label: '全部', value: 'all' },
  { label: '可使用', value: 'active' },
  { label: '部分使用', value: 'partial_used' },
  { label: '已用完', value: 'used_up' },
  { label: '已過期', value: 'expired' },
  { label: '已停用', value: 'disabled' },
]

export function QRList({ records, onIncrementDownload }: QRListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [statusFilter, setStatusFilter] = useState<QrLifecycleStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  const filteredAndSortedRecords = useMemo(() => {
    return records
      .filter((record) => {
        const matchesSearch =
          record.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.code.toLowerCase().includes(searchTerm.toLowerCase())

        const status = computeStatus(record)
        const matchesStatus = statusFilter === 'all' || status === statusFilter

        return matchesSearch && matchesStatus
      })
      .sort((left, right) => {
        switch (sortBy) {
          case 'oldest':
            return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
          case 'quota_high':
            return right.totalQuota - left.totalQuota
          case 'quota_low':
            return left.totalQuota - right.totalQuota
          case 'remaining_low':
            return left.remainingQuota - right.remainingQuota
          case 'newest':
          default:
            return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        }
      })
  }, [records, searchTerm, sortBy, statusFilter])

  return (
    <div className="partner-list-wrap">
      <div className="partner-list-controls">
        <div className="partner-search-wrap">
          <Search size={18} />
          <input
            type="text"
            placeholder="搜尋合作夥伴名稱或 QR 代碼"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="partner-view-toggle" aria-label="切換顯示模式">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'active' : ''}
          >
            <LayoutGrid size={18} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'active' : ''}
          >
            <ListIcon size={18} />
          </button>
        </div>
      </div>

      <div className="partner-list-toolbar">
        <div className="partner-filter-row">
          <Filter size={16} />
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatusFilter(option.value)}
              className={statusFilter === option.value ? 'active' : ''}
            >
              {option.label}
            </button>
          ))}
        </div>

        <label className="partner-sort-wrap">
          <ArrowUpDown size={16} />
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)}>
            <option value="newest">建立時間：新到舊</option>
            <option value="oldest">建立時間：舊到新</option>
            <option value="quota_high">總名額：多到少</option>
            <option value="quota_low">總名額：少到多</option>
            <option value="remaining_low">剩餘名額：少到多</option>
          </select>
        </label>
      </div>

      <AnimatePresence mode="wait">
        {filteredAndSortedRecords.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="glass-card partner-empty-state"
          >
            <div className="partner-empty-icon">
              <Search size={32} />
            </div>
            <h3>找不到符合條件的憑證</h3>
            <p>請調整搜尋文字或篩選條件，重新查看目前的 QR 清單。</p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
              }}
            >
              清除搜尋與篩選
            </button>
          </motion.div>
        ) : (
          <motion.div
            key={viewMode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={viewMode === 'grid' ? 'partner-card-grid' : 'partner-card-list'}
          >
            <AnimatePresence mode="popLayout">
              {filteredAndSortedRecords.map((record) => (
                <QRCard
                  key={record.id}
                  record={record}
                  compact={viewMode === 'list'}
                  onIncrementDownload={onIncrementDownload}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
