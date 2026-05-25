import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { removeOrder, subscribeOrders, updateOrder } from '../services/orderService'
import { formatINR } from '../utils/formatters'
import { useToast } from '../hooks/useToast'

function formatDate(value) {
  if (!value) return '--'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleDateString('en-IN')
}

function paymentBadgeClass(status) {
  if (status === 'paid') return 'bg-emerald-100 text-emerald-700'
  return 'bg-amber-100 text-amber-700'
}

const ORDER_STATUS_OPTIONS = ['initiated', 'confirmed', 'completed']

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all')
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [selectedOrderIds, setSelectedOrderIds] = useState([])
  const [bulkStatus, setBulkStatus] = useState('')
  const [viewingOrder, setViewingOrder] = useState(null)
  const [updatingOrderId, setUpdatingOrderId] = useState('')
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [deletingOrderId, setDeletingOrderId] = useState('')
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const { error, success } = useToast()

  useEffect(() => {
    const unsubscribe = subscribeOrders(
      (nextOrders) => {
        setOrders(nextOrders)
        setLoading(false)
      },
      (err) => {
        setLoading(false)
        error(err?.message || 'Failed to load orders.')
      },
    )

    return unsubscribe
  }, [error])

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return orders.filter((order) => {
      const paymentMatch = paymentStatusFilter === 'all' || order.paymentStatus === paymentStatusFilter
      const orderMatch = orderStatusFilter === 'all' || order.orderStatus === orderStatusFilter

      if (!term) return paymentMatch && orderMatch

      const haystack = [
        order.productName,
        order.customer?.name,
        order.customer?.phone,
        order.customer?.address,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return paymentMatch && orderMatch && haystack.includes(term)
    })
  }, [orders, searchTerm, paymentStatusFilter, orderStatusFilter])

  const allFilteredSelected = filteredOrders.length > 0 && filteredOrders.every((order) => selectedOrderIds.includes(order.id))
  const selectedCount = selectedOrderIds.length

  const toggleRow = (orderId) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId],
    )
  }

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedOrderIds((prev) => prev.filter((id) => !filteredOrders.some((order) => order.id === id)))
      return
    }

    const filteredIds = filteredOrders.map((order) => order.id)
    setSelectedOrderIds((prev) => Array.from(new Set([...prev, ...filteredIds])))
  }

  const handleOrderStatusUpdate = async (orderId, orderStatus) => {
    try {
      setUpdatingOrderId(orderId)
      await updateOrder(orderId, { orderStatus })
      success(`Order marked as ${orderStatus}.`)
    } catch (err) {
      error(err?.message || 'Unable to update order status.')
    } finally {
      setUpdatingOrderId('')
    }
  }

  const handleBulkApplyStatus = async () => {
    if (!bulkStatus || !selectedCount) {
      error('Select orders and status before applying bulk update.')
      return
    }

    try {
      setBulkUpdating(true)
      await Promise.all(selectedOrderIds.map((orderId) => updateOrder(orderId, { orderStatus: bulkStatus })))
      success(`Updated ${selectedCount} order(s) to ${bulkStatus}.`)
      setSelectedOrderIds([])
      setBulkStatus('')
    } catch (err) {
      error(err?.message || 'Unable to apply bulk status update.')
    } finally {
      setBulkUpdating(false)
    }
  }

  const handleDeleteOrder = async (orderId) => {
    try {
      setDeletingOrderId(orderId)
      await removeOrder(orderId)
      setSelectedOrderIds((prev) => prev.filter((id) => id !== orderId))
      success('Order deleted successfully.')
    } catch (err) {
      error(err?.message || 'Unable to delete order.')
    } finally {
      setDeletingOrderId('')
    }
  }

  const handleBulkDelete = async () => {
    if (!selectedCount) {
      error('Select at least one order to delete.')
      return
    }

    try {
      setBulkDeleting(true)
      await Promise.all(selectedOrderIds.map((orderId) => removeOrder(orderId)))
      success(`Deleted ${selectedCount} order(s).`)
      setSelectedOrderIds([])
    } catch (err) {
      error(err?.message || 'Unable to delete selected orders.')
    } finally {
      setBulkDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-kicker">Admin Panel</p>
          <h1 className="section-title">Manage Orders</h1>
        </div>
        <Link to="/admin" className="btn-outline inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>
      </div>

      <section className="space-y-4 rounded-2xl border border-brand-gold/30 bg-white p-5 shadow-soft">
        <h2 className="text-2xl font-semibold text-brand-maroon">Filters</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm text-brand-maroon/80">
            Search
            <input
              className="input-field mt-1"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Name, phone, or product..."
            />
          </label>

          <label className="text-sm text-brand-maroon/80">
            Payment Status
            <select
              className="input-field mt-1"
              value={paymentStatusFilter}
              onChange={(event) => setPaymentStatusFilter(event.target.value)}
            >
              <option value="all">All Payment Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </label>

          <label className="text-sm text-brand-maroon/80">
            Order Status
            <select
              className="input-field mt-1"
              value={orderStatusFilter}
              onChange={(event) => setOrderStatusFilter(event.target.value)}
            >
              <option value="all">All Order Statuses</option>
              {ORDER_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <p className="text-sm text-brand-maroon/80">Showing {filteredOrders.length} of {orders.length} orders</p>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-gold/25 bg-white p-4 shadow-soft">
        <p className="text-sm text-brand-maroon/80">Selected: {selectedCount}</p>

        <div className="flex flex-wrap items-center gap-2">
          <select className="input-field w-56" value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value)}>
            <option value="">Update selected status...</option>
            {ORDER_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="rounded-lg bg-brand-maroon px-4 py-2 text-sm font-medium text-brand-cream disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleBulkApplyStatus}
            disabled={!selectedCount || !bulkStatus || bulkUpdating || bulkDeleting}
          >
            {bulkUpdating ? 'Applying...' : 'Apply'}
          </button>

          <button
            type="button"
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleBulkDelete}
            disabled={!selectedCount || bulkDeleting || bulkUpdating}
          >
            {bulkDeleting ? 'Deleting...' : 'Delete Selected'}
          </button>

          <button
            type="button"
            className="rounded-lg border border-brand-maroon/20 bg-brand-cream/40 px-4 py-2 text-sm font-medium text-brand-maroon disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => {
              setSelectedOrderIds([])
              setBulkStatus('')
            }}
            disabled={!selectedCount && !bulkStatus}
          >
            Clear
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-brand-gold/25 bg-white shadow-soft">
        {loading ? (
          <p className="p-5 text-brand-maroon/70">Loading orders...</p>
        ) : !filteredOrders.length ? (
          <p className="p-5 text-brand-maroon/70">No orders found for selected filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-brand-gold/20 bg-brand-cream/40 text-sm text-brand-maroon">
                <tr>
                  <th className="px-4 py-3">
                    <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAllFiltered} aria-label="Select all filtered orders" />
                  </th>
                  <th className="px-4 py-3">Customer / Product</th>
                  <th className="px-4 py-3">Price / Size</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Order Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => {
                  const isSelected = selectedOrderIds.includes(order.id)
                  const isUpdating = updatingOrderId === order.id
                  const isDeleting = deletingOrderId === order.id

                  return (
                    <tr key={order.id} className="border-b border-brand-gold/15 align-top text-sm text-brand-maroon/90 last:border-b-0">
                      <td className="px-4 py-4">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleRow(order.id)} aria-label={`Select order ${order.id}`} />
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <img
                            src={order.image || 'https://placehold.co/96x96/F8F1E5/5A0F1C?text=Order'}
                            alt={order.productName || 'Order product'}
                            className="h-14 w-14 rounded-lg border border-brand-gold/20 bg-brand-cream/30 object-cover"
                            loading="lazy"
                          />
                          <div>
                            <p className="font-semibold text-brand-maroon">{order.customer?.name || '--'}</p>
                            <p className="text-brand-maroon/75">{order.productName || '--'}</p>
                            <p className="text-brand-maroon/65">{order.customer?.phone || '--'}</p>
                            <p className="max-w-xs text-brand-maroon/65">{order.customer?.address || '--'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-semibold text-brand-maroon">{formatINR(order.price || 0)}</p>
                        <p className="text-brand-maroon/70">Size: {order.selectedSize || '--'}</p>
                      </td>

                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${paymentBadgeClass(order.paymentStatus)}`}>
                          {order.paymentStatus || 'pending'}
                        </span>
                        <p className="mt-1 text-brand-maroon/70">{order.paymentMethod || '--'}</p>
                        {order.razorpayPaymentId && <p className="truncate text-xs text-brand-maroon/60">ID: {order.razorpayPaymentId}</p>}
                      </td>

                      <td className="px-4 py-4">
                        <select
                          className="input-field min-w-40"
                          value={order.orderStatus || 'initiated'}
                          onChange={(event) => handleOrderStatusUpdate(order.id, event.target.value)}
                          disabled={isUpdating}
                        >
                          {ORDER_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-4 text-brand-maroon/80">{formatDate(order.createdAt)}</td>

                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button type="button" className="rounded-lg border border-brand-maroon/20 bg-brand-cream/40 px-3 py-1.5 text-sm text-brand-maroon" onClick={() => setViewingOrder(order)}>
                            View
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-sm text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => handleDeleteOrder(order.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {viewingOrder && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-brand-gold/30 bg-white p-6 shadow-royal">
            <h3 className="font-display text-2xl text-brand-maroon">Order Details</h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-[120px_1fr]">
              <img
                src={viewingOrder.image || 'https://placehold.co/120x120/F8F1E5/5A0F1C?text=Order'}
                alt={viewingOrder.productName || 'Order product'}
                className="h-28 w-28 rounded-lg border border-brand-gold/20 bg-brand-cream/30 object-cover"
                loading="lazy"
              />

              <div className="space-y-1 text-sm text-brand-maroon/90">
                <p><span className="font-medium">Product:</span> {viewingOrder.productName || '--'}</p>
                <p><span className="font-medium">Price:</span> {formatINR(viewingOrder.price || 0)}</p>
                <p><span className="font-medium">Size:</span> {viewingOrder.selectedSize || '--'}</p>
                <p><span className="font-medium">Customer:</span> {viewingOrder.customer?.name || '--'}</p>
                <p><span className="font-medium">Phone:</span> {viewingOrder.customer?.phone || '--'}</p>
                <p><span className="font-medium">Address:</span> {viewingOrder.customer?.address || '--'}</p>
                <p><span className="font-medium">Payment:</span> {viewingOrder.paymentMethod || '--'} / {viewingOrder.paymentStatus || '--'}</p>
                <p><span className="font-medium">Order Status:</span> {viewingOrder.orderStatus || '--'}</p>
                <p><span className="font-medium">Date:</span> {formatDate(viewingOrder.createdAt)}</p>
              </div>
            </div>

            <div className="mt-5 text-right">
              <button type="button" className="btn-outline" onClick={() => setViewingOrder(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
