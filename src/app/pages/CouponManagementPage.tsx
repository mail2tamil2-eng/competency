import { useState, useMemo } from 'react';
import {
  TicketPercent, Plus, Edit2, Trash2, Search, IndianRupee,
  Percent, X, ChevronDown, Check, Filter, Tag, CalendarDays,
  BadgeCheck, BadgeX, Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

// ── Types ──────────────────────────────────────────────────────────────────────
type DiscountType = 'flat' | 'percentage';

interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  expiryDay?: number; expiryMonth?: number; expiryYear?: number;
  usageLimit?: number;
  usageCount: number;
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const uid   = () => Math.random().toString(36).slice(2, 10);
const fmt   = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const pad   = (n: number) => String(n).padStart(2, '0');
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const days  = Array.from({ length: 31 }, (_, i) => i + 1);
const years = Array.from({ length: 10 }, (_, i) => 2024 + i);

function couponStatus(c: Coupon): 'active' | 'expired' | 'exhausted' {
  if (c.expiryDay) {
    const now    = new Date(); now.setHours(0, 0, 0, 0);
    const month  = Math.max(1, Math.min(12, c.expiryMonth ?? 1));
    const expiry = new Date(c.expiryYear ?? 2099, month - 1, c.expiryDay);
    if (now > expiry) return 'expired';
  }
  if (c.usageLimit && c.usageCount >= c.usageLimit) return 'exhausted';
  return 'active';
}

function fmtDate(d: number, m: number, y: number) {
  const month = MONTHS[m - 1] ?? MONTHS[0];
  return `${pad(d)} ${month.slice(0, 3)} ${y}`;
}

// ── Mock Seed ──────────────────────────────────────────────────────────────────
const SEED: Coupon[] = [
  { id: 'cp1', code: 'SAVE10',    description: 'Save ₹10 on any course',          discountType: 'flat',       discountValue: 10,  expiryDay: 31, expiryMonth: 12, expiryYear: 2026, usageLimit: 200, usageCount: 47,  createdAt: '2026-07-01' },
  { id: 'cp2', code: 'FIRST500',  description: 'First purchase flat discount',     discountType: 'flat',       discountValue: 500, expiryDay: 31, expiryMonth: 8,  expiryYear: 2026, usageLimit: 50,  usageCount: 50,  createdAt: '2026-08-01' },
  { id: 'cp3', code: 'SUMMER25',  description: 'Summer sale — 25% off',           discountType: 'percentage', discountValue: 25,  usageLimit: 100, usageCount: 63, createdAt: '2026-06-01' },
  { id: 'cp4', code: 'LAUNCH100', description: 'New course launch offer',          discountType: 'flat',       discountValue: 100, expiryDay: 15, expiryMonth: 10, expiryYear: 2026, usageCount: 12,  createdAt: '2026-08-15' },
  { id: 'cp5', code: 'VIP20',     description: 'VIP members 20% off all courses',  discountType: 'percentage', discountValue: 20,  expiryDay: 1,  expiryMonth: 1,  expiryYear: 2026, usageLimit: 30,  usageCount: 30,  createdAt: '2025-01-01' },
];

// ── Confirm Dialog ─────────────────────────────────────────────────────────────
function ConfirmDialog({ open, title, message, onConfirm, onCancel }: {
  open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-5 h-5 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 text-center mb-1">{title}</h3>
        <p className="text-sm text-gray-500 text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">Delete</button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────────
function CouponModal({ coupon, onSave, onClose }: {
  coupon: Coupon | null;
  onSave: (c: Coupon) => void;
  onClose: () => void;
}) {
  const isEdit = !!coupon;
  const today  = new Date();

  const [code,          setCode]          = useState(coupon?.code ?? '');
  const [description,   setDescription]   = useState(coupon?.description ?? '');
  const [discountType,  setDiscountType]  = useState<DiscountType>(coupon?.discountType ?? 'flat');
  const [discountValue, setDiscountValue] = useState(coupon?.discountValue ?? 0);
  const [expiryDay,     setExpiryDay]     = useState<number>(coupon?.expiryDay   ?? today.getDate());
  const [expiryMonth,   setExpiryMonth]   = useState<number>(coupon?.expiryMonth ?? today.getMonth() + 1);
  const [expiryYear,    setExpiryYear]    = useState<number>(coupon?.expiryYear  ?? today.getFullYear() + 1);
  const [hasExpiry,     setHasExpiry]     = useState(!!(coupon?.expiryDay));
  const [usageLimit,    setUsageLimit]    = useState<string>(coupon?.usageLimit ? String(coupon.usageLimit) : '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!code.trim())       e.code     = 'Coupon code is required.';
    if (discountValue <= 0) e.discount = 'Discount must be greater than 0.';
    if (discountType === 'percentage' && discountValue > 100) e.discount = 'Percentage cannot exceed 100.';
    if (usageLimit !== '' && +usageLimit < 1) e.usageLimit = 'Usage limit must be at least 1.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      id:           coupon?.id ?? uid(),
      code:         code.trim().toUpperCase(),
      description,
      discountType,
      discountValue,
      ...(hasExpiry ? { expiryDay, expiryMonth, expiryYear } : {}),
      usageLimit:   usageLimit !== '' ? +usageLimit : undefined,
      usageCount:   coupon?.usageCount ?? 0,
      createdAt:    coupon?.createdAt ?? new Date().toISOString().split('T')[0],
    });
  };

  const selCls = (err?: string) =>
    `px-2.5 py-2.5 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-white appearance-none cursor-pointer transition-colors ${err ? 'border-red-400' : 'border-gray-200 focus:border-violet-500'}`;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <TicketPercent className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Coupon' : 'Create Coupon'}</h2>
              <p className="text-xs text-gray-500">Set code, discount, expiry and usage limit</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Coupon Code */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Coupon Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setErrors(p => ({ ...p, code: '' })); }}
              placeholder="e.g. SUMMER25"
              className={`w-full px-4 py-3 border-2 rounded-lg text-sm font-mono font-semibold tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-colors ${errors.code ? 'border-red-400' : 'border-gray-200 focus:border-violet-500'}`}
            />
            {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Description <span className="text-gray-400 font-normal text-xs">(Optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Summer sale — 20% off all courses"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
            />
          </div>

          {/* Discount Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Discount Type <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              {[
                { val: 'flat',       label: 'Flat Amount', sub: 'Fixed ₹ off', icon: <IndianRupee className="w-4 h-4" /> },
                { val: 'percentage', label: 'Percentage',  sub: '% off price', icon: <Percent className="w-4 h-4" /> },
              ].map(({ val, label, sub, icon }) => (
                <button key={val} type="button"
                  onClick={() => { setDiscountType(val as DiscountType); setDiscountValue(0); setErrors(p => ({ ...p, discount: '' })); }}
                  className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm transition-all ${discountType === val ? 'border-violet-500 bg-violet-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${discountType === val ? 'bg-violet-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {icon}
                  </div>
                  <div className="text-left">
                    <p className={`font-semibold text-xs ${discountType === val ? 'text-violet-700' : 'text-gray-600'}`}>{label}</p>
                    <p className="text-xs text-gray-400">{sub}</p>
                  </div>
                  {discountType === val && <Check className="w-4 h-4 text-violet-600 ml-auto flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Discount Value */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {discountType === 'flat' ? 'Discount Amount (₹)' : 'Discount Percentage (%)'}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold pointer-events-none select-none">
                {discountType === 'flat' ? '₹' : '%'}
              </span>
              <input
                type="number" min="1" max={discountType === 'percentage' ? 100 : undefined}
                value={discountValue || ''}
                onChange={e => { setDiscountValue(+e.target.value); setErrors(p => ({ ...p, discount: '' })); }}
                placeholder={discountType === 'flat' ? 'e.g. 500' : 'e.g. 20'}
                className={`w-full pl-8 pr-4 py-3 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-colors ${errors.discount ? 'border-red-400' : 'border-gray-200 focus:border-violet-500'}`}
              />
            </div>
            {errors.discount && <p className="text-xs text-red-500 mt-1">{errors.discount}</p>}
          </div>

          {/* Expiry Date */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Expiry Date <span className="text-gray-400 font-normal text-xs">(Optional)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="text-xs text-gray-500">{hasExpiry ? 'Enabled' : 'No expiry'}</span>
                <button type="button" onClick={() => setHasExpiry(v => !v)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${hasExpiry ? 'bg-violet-500' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${hasExpiry ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </label>
            </div>
            {hasExpiry && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <select value={expiryDay} onChange={e => setExpiryDay(+e.target.value)} className={selCls()}>
                    {days.map(v => <option key={v} value={v}>{pad(v)}</option>)}
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <select value={expiryMonth} onChange={e => setExpiryMonth(Math.max(1, Math.min(12, +e.target.value)))} className={`${selCls()} pr-7`}>
                    {MONTHS.map((mn, i) => <option key={mn} value={i + 1}>{mn}</option>)}
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <select value={expiryYear} onChange={e => setExpiryYear(+e.target.value)} className={selCls()}>
                    {years.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          {/* Usage Limit */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Usage Limit <span className="text-gray-400 font-normal text-xs">(Optional — leave blank for unlimited)</span>
            </label>
            <div className="relative">
              <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="number" min="1"
                value={usageLimit}
                onChange={e => { setUsageLimit(e.target.value); setErrors(p => ({ ...p, usageLimit: '' })); }}
                placeholder="Unlimited"
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-colors ${errors.usageLimit ? 'border-red-400' : 'border-gray-200 focus:border-violet-500'}`}
              />
            </div>
            {errors.usageLimit && <p className="text-xs text-red-500 mt-1">{errors.usageLimit}</p>}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all">
            <Check className="w-4 h-4" />
            {isEdit ? 'Save Changes' : 'Create Coupon'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Status Badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: 'active' | 'expired' | 'exhausted' }) {
  if (status === 'active')    return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
      <BadgeCheck className="w-3.5 h-3.5" /> Active
    </span>
  );
  if (status === 'exhausted') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
      <Users className="w-3.5 h-3.5" /> Exhausted
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-semibold">
      <BadgeX className="w-3.5 h-3.5" /> Expired
    </span>
  );
}

// ── Usage Bar ──────────────────────────────────────────────────────────────────
function UsageBar({ count, limit }: { count: number; limit: number }) {
  const pct = Math.min(100, Math.round((count / limit) * 100));
  const color = pct >= 100 ? 'bg-amber-500' : pct >= 75 ? 'bg-orange-400' : 'bg-violet-500';
  return (
    <div className="flex flex-col items-center gap-1 min-w-[80px]">
      <span className="text-xs font-bold text-gray-800 tabular-nums">{count} / {limit}</span>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400">{pct}% used</span>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export function CouponManagementPage() {
  const [coupons, setCoupons]           = useState<Coupon[]>(SEED);
  const [modalCoupon, setModalCoupon]   = useState<Coupon | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType]     = useState('');

  const filtered = useMemo(() => coupons.filter(c => {
    const status = couponStatus(c);
    if (filterStatus && status !== filterStatus) return false;
    if (filterType   && c.discountType !== filterType) return false;
    if (search && !c.code.toLowerCase().includes(search.toLowerCase()) &&
        !c.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [coupons, search, filterStatus, filterType]);

  const handleSave = (saved: Coupon) => {
    setCoupons(prev => {
      const exists = prev.find(c => c.id === saved.id);
      return exists ? prev.map(c => c.id === saved.id ? saved : c) : [...prev, saved];
    });
    toast.success(modalCoupon ? 'Coupon updated!' : 'Coupon created!');
    setModalCoupon(undefined);
  };

  const handleDelete = (c: Coupon) => {
    setCoupons(prev => prev.filter(x => x.id !== c.id));
    toast.success('Coupon deleted.');
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <AnimatePresence>
        {modalCoupon !== undefined && (
          <CouponModal coupon={modalCoupon} onSave={handleSave} onClose={() => setModalCoupon(undefined)} />
        )}
      </AnimatePresence>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Coupon"
        message={`"${deleteTarget?.code}" will be permanently deleted.`}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
              <TicketPercent className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Coupon Management</h1>
              <p className="text-xs text-gray-500">Create and manage discount coupon codes</p>
            </div>
          </div>
          <button onClick={() => setModalCoupon(null)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all">
            <Plus className="w-4 h-4" /> Create Coupon
          </button>
        </div>
      </header>

      <main className="px-6 py-6 space-y-5">

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search code or description..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white" />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white appearance-none">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="exhausted">Exhausted</option>
              <option value="expired">Expired</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white appearance-none">
              <option value="">All Types</option>
              <option value="flat">Flat (₹)</option>
              <option value="percentage">Percentage (%)</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {(search || filterStatus || filterType) && (
            <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterType(''); }}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left   text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">Coupon Code</th>
                  <th className="text-left   text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Description</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Discount</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                    <span className="flex items-center justify-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> Expiry</span>
                  </th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                    <span className="flex items-center justify-center gap-1"><Users className="w-3.5 h-3.5" /> Usage</span>
                  </th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <TicketPercent className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-400">No coupons found</p>
                      <p className="text-xs text-gray-300 mt-1">Try adjusting filters or create a new coupon</p>
                    </td>
                  </tr>
                ) : filtered.map(c => {
                  const status = couponStatus(c);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">

                      {/* Code */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                            <TicketPercent className="w-4 h-4 text-violet-600" />
                          </div>
                          <span className="font-mono font-bold text-sm text-gray-900 tracking-wider">{c.code}</span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-600">
                          {c.description || <span className="text-gray-300 italic">No description</span>}
                        </span>
                      </td>

                      {/* Discount */}
                      <td className="px-4 py-4 text-center">
                        {c.discountType === 'flat'
                          ? <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{fmt(c.discountValue)} off</span>
                          : <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">{c.discountValue}% off</span>
                        }
                      </td>

                      {/* Expiry */}
                      <td className="px-4 py-4 text-center">
                        {c.expiryDay
                          ? <span className="text-xs text-gray-600 font-medium">{fmtDate(c.expiryDay, c.expiryMonth!, c.expiryYear!)}</span>
                          : <span className="text-xs text-gray-400 italic">No expiry</span>}
                      </td>

                      {/* Usage */}
                      <td className="px-4 py-4">
                        <div className="flex justify-center">
                          {c.usageLimit
                            ? <UsageBar count={c.usageCount} limit={c.usageLimit} />
                            : <span className="text-xs text-gray-400 italic">Unlimited</span>}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 text-center">
                        <StatusBadge status={status} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setModalCoupon(c)}
                            className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteTarget(c)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
              Showing {filtered.length} of {coupons.length} {coupons.length === 1 ? 'coupon' : 'coupons'}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
