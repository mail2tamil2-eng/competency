import { useState, useMemo } from 'react';
import {
  ShoppingCart, Plus, Edit2, Trash2, Search, Tag, IndianRupee,
  Percent, X, ChevronDown, Check, BookOpen, Filter, ReceiptText,
  TrendingDown, TicketPercent, Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

// ── Types ──────────────────────────────────────────────────────────────────────
type DiscountType = 'none' | 'flat' | 'percentage';

interface CourseData {
  id: string;
  name: string;
  category: string;
  price: number;
}

interface CouponOption {
  id: string;
  code: string;
  label: string;
  discount: number; // flat ₹ off
}

interface EcommerceItem {
  id: string;
  courseId: string;
  price: number;
  discountType: DiscountType;
  discountValue: number;
  couponId: string;
  createdAt: string;
}

// ── Mock Data ──────────────────────────────────────────────────────────────────
const CATEGORIES = ['Technology', 'Business', 'Design', 'Marketing', 'Healthcare'];

const COURSES: CourseData[] = [
  { id: 'c1',  name: 'React & TypeScript Mastery',       category: 'Technology',  price: 4999 },
  { id: 'c2',  name: 'Python for Data Science',          category: 'Technology',  price: 3999 },
  { id: 'c3',  name: 'AWS Cloud Practitioner',           category: 'Technology',  price: 5499 },
  { id: 'c4',  name: 'Node.js Backend Development',      category: 'Technology',  price: 3499 },
  { id: 'c5',  name: 'Business Strategy Fundamentals',   category: 'Business',    price: 2999 },
  { id: 'c6',  name: 'Financial Accounting Basics',      category: 'Business',    price: 2499 },
  { id: 'c7',  name: 'Startup Masterclass',              category: 'Business',    price: 5999 },
  { id: 'c8',  name: 'UI/UX Design Principles',          category: 'Design',      price: 3299 },
  { id: 'c9',  name: 'Figma Advanced Techniques',        category: 'Design',      price: 2799 },
  { id: 'c10', name: 'Brand Identity Design',            category: 'Design',      price: 3799 },
  { id: 'c11', name: 'Digital Marketing Essentials',     category: 'Marketing',   price: 1999 },
  { id: 'c12', name: 'SEO & Content Strategy',           category: 'Marketing',   price: 2299 },
  { id: 'c13', name: 'Medical Terminology 101',          category: 'Healthcare',  price: 1499 },
  { id: 'c14', name: 'Healthcare Management',            category: 'Healthcare',  price: 3199 },
];

const COUPONS: CouponOption[] = [
  { id: 'cp1', code: 'SAVE10',    label: 'SAVE10 — ₹10 off',     discount: 10 },
  { id: 'cp2', code: 'FIRST500',  label: 'FIRST500 — ₹500 off',  discount: 500 },
  { id: 'cp3', code: 'FLAT200',   label: 'FLAT200 — ₹200 off',   discount: 200 },
  { id: 'cp4', code: 'SUMMER25',  label: 'SUMMER25 — ₹250 off',  discount: 250 },
  { id: 'cp5', code: 'LAUNCH100', label: 'LAUNCH100 — ₹100 off', discount: 100 },
  { id: 'cp6', code: 'VIP1000',   label: 'VIP1000 — ₹1000 off',  discount: 1000 },
  { id: 'cp7', code: 'NEWUSER50', label: 'NEWUSER50 — ₹50 off',  discount: 50 },
];

const SEED: EcommerceItem[] = [
  { id: 'e1', courseId: 'c1',  price: 4999, discountType: 'percentage', discountValue: 20,  couponId: 'cp1', createdAt: '2026-07-12' },
  { id: 'e2', courseId: 'c5',  price: 2999, discountType: 'flat',       discountValue: 500, couponId: 'cp2', createdAt: '2026-07-18' },
  { id: 'e3', courseId: 'c8',  price: 3299, discountType: 'none',       discountValue: 0,   couponId: '',    createdAt: '2026-08-01' },
  { id: 'e4', courseId: 'c11', price: 1999, discountType: 'percentage', discountValue: 15,  couponId: 'cp4', createdAt: '2026-08-10' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

function calcFinal(basePrice: number, discountType: DiscountType, discountValue: number, couponId: string) {
  let price = basePrice;
  if (discountType === 'flat')       price = Math.max(0, price - discountValue);
  if (discountType === 'percentage') price = Math.max(0, price - Math.round(price * discountValue / 100));
  const coupon = COUPONS.find(c => c.id === couponId);
  price = Math.max(0, price - (coupon?.discount ?? 0));
  return price;
}

// ── Confirm Dialog ─────────────────────────────────────────────────────────────
function ConfirmDialog({ open, title, message, onConfirm, onCancel }: {
  open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
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

// ── Price Breakdown ────────────────────────────────────────────────────────────
function PriceBreakdown({ basePrice, discountType, discountValue, couponId }: {
  basePrice: number; discountType: DiscountType; discountValue: number; couponId: string;
}) {
  const discountAmount = discountType === 'flat'
    ? Math.min(discountValue, basePrice)
    : discountType === 'percentage'
    ? Math.round(basePrice * discountValue / 100)
    : 0;

  const coupon = COUPONS.find(c => c.id === couponId);
  const couponDiscount = coupon?.discount ?? 0;
  const finalPrice = Math.max(0, basePrice - discountAmount - couponDiscount);
  const totalSaved = basePrice - finalPrice;

  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <ReceiptText className="w-4 h-4 text-orange-600" />
        <span className="text-sm font-bold text-gray-800">Price Breakdown</span>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Original Price</span>
          <span className="font-medium text-gray-900">{fmt(basePrice)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-green-700">
            <span>{discountType === 'flat' ? 'Flat Discount' : `Discount (${discountValue}%)`}</span>
            <span className="font-medium">− {fmt(discountAmount)}</span>
          </div>
        )}
        {coupon && (
          <div className="flex justify-between text-green-700">
            <span className="flex items-center gap-1"><TicketPercent className="w-3 h-3" /> {coupon.code}</span>
            <span className="font-medium">− {fmt(coupon.discount)}</span>
          </div>
        )}
        <div className="h-px bg-orange-200 my-2" />
        <div className="flex justify-between">
          <span className="font-bold text-gray-900 text-base">Final Price</span>
          <span className="font-bold text-orange-600 text-lg">{fmt(finalPrice)}</span>
        </div>
        {totalSaved > 0 && (
          <div className="mt-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5" />
            You save {fmt(totalSaved)} ({Math.round((totalSaved / basePrice) * 100)}% off)
          </div>
        )}
      </div>
    </div>
  );
}

// ── Form Modal ─────────────────────────────────────────────────────────────────
function EcommerceModal({ item, onSave, onClose }: {
  item: EcommerceItem | null;
  onSave: (item: EcommerceItem) => void;
  onClose: () => void;
}) {
  const isEdit = !!item;
  const [category, setCategory]     = useState(item ? COURSES.find(c => c.id === item.courseId)?.category ?? '' : '');
  const [courseId, setCourseId]     = useState(item?.courseId ?? '');
  const [price, setPrice]           = useState(item?.price ?? 0);
  const [discountType, setDiscountType] = useState<DiscountType>(item?.discountType ?? 'none');
  const [discountValue, setDiscountValue] = useState(item?.discountValue ?? 0);
  const [couponId, setCouponId]     = useState(item?.couponId ?? '');
  const [errors, setErrors]         = useState<Record<string, string>>({});

  const filteredCourses = COURSES.filter(c => !category || c.category === category);
  const selectedCourse  = COURSES.find(c => c.id === courseId) ?? null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!category)   e.category = 'Please select a category.';
    if (!courseId)   e.courseId = 'Please select a course.';
    if (!price || price <= 0) e.price = 'Please enter a valid course price.';
    if ((discountType === 'flat' || discountType === 'percentage') && discountValue <= 0)
      e.discount = 'Discount value must be greater than 0.';
    if (discountType === 'percentage' && discountValue > 100)
      e.discount = 'Percentage cannot exceed 100.';
    if (discountType === 'flat' && discountValue >= price)
      e.discount = 'Flat discount cannot exceed the course price.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      id: item?.id ?? uid(),
      courseId,
      price,
      discountType,
      discountValue: discountType === 'none' ? 0 : discountValue,
      couponId,
      createdAt: item?.createdAt ?? new Date().toISOString().split('T')[0],
    });
  };

  const selCls = (err?: string) =>
    `w-full px-4 py-3 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 bg-white appearance-none transition-colors ${err ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-orange-500'}`;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Course Pricing' : 'Add Course Pricing'}</h2>
              <p className="text-xs text-gray-500">Configure pricing and discounts for a course</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Course Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Course Category <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={e => { setCategory(e.target.value); setCourseId(''); setErrors(p => ({ ...p, category: '' })); }}
                className={selCls(errors.category)}
              >
                <option value="">Select a category...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
          </div>

          {/* Course */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Course <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={courseId}
                onChange={e => {
                  const id = e.target.value;
                  setCourseId(id);
                  const found = COURSES.find(c => c.id === id);
                  if (found) setPrice(found.price);
                  setErrors(p => ({ ...p, courseId: '' }));
                }}
                disabled={!category}
                className={`${selCls(errors.courseId)} disabled:bg-gray-50 disabled:text-gray-400`}
              >
                <option value="">{category ? 'Select a course...' : 'Select a category first'}</option>
                {filteredCourses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {errors.courseId && <p className="text-xs text-red-500 mt-1">{errors.courseId}</p>}
          </div>

          {/* Course Price */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Course Price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm pointer-events-none select-none">₹</span>
              <input
                type="number"
                min="1"
                value={price || ''}
                onChange={e => { setPrice(+e.target.value); setErrors(p => ({ ...p, price: '' })); }}
                placeholder="Enter course price"
                className={`w-full pl-8 pr-4 py-3 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-colors ${errors.price ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-orange-500'}`}
              />
            </div>
            {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
            {selectedCourse && price !== selectedCourse.price && price > 0 && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <IndianRupee className="w-3 h-3" />
                Default price for this course is <span className="font-semibold">{fmt(selectedCourse.price)}</span>
              </p>
            )}
          </div>

          {/* Discount Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Discount</label>
            <div className="flex gap-3">
              {[
                { val: 'none',       label: 'No Discount', icon: <Tag className="w-4 h-4" /> },
                { val: 'flat',       label: 'Flat (₹)',    icon: <IndianRupee className="w-4 h-4" /> },
                { val: 'percentage', label: 'Percentage',  icon: <Percent className="w-4 h-4" /> },
              ].map(({ val, label, icon }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => { setDiscountType(val as DiscountType); setDiscountValue(0); setErrors(p => ({ ...p, discount: '' })); }}
                  className={`flex-1 flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 text-xs font-semibold transition-all ${discountType === val ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'}`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>

          {/* Discount Value */}
          <AnimatePresence>
            {discountType !== 'none' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {discountType === 'flat' ? 'Discount Amount (₹)' : 'Discount Percentage (%)'}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium pointer-events-none">
                    {discountType === 'flat' ? '₹' : '%'}
                  </span>
                  <input
                    type="number"
                    min="1"
                    max={discountType === 'percentage' ? 100 : undefined}
                    value={discountValue || ''}
                    onChange={e => { setDiscountValue(+e.target.value); setErrors(p => ({ ...p, discount: '' })); }}
                    placeholder={discountType === 'flat' ? 'e.g. 500' : 'e.g. 20'}
                    className={`w-full pl-8 pr-4 py-3 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-colors ${errors.discount ? 'border-red-400' : 'border-gray-200 focus:border-orange-500'}`}
                  />
                </div>
                {errors.discount && <p className="text-xs text-red-500 mt-1">{errors.discount}</p>}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Coupon Code */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Coupon Code <span className="text-gray-400 font-normal text-xs">(Optional)</span>
            </label>
            <div className="relative">
              <TicketPercent className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={couponId}
                onChange={e => setCouponId(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white appearance-none transition-colors"
              >
                <option value="">No coupon</option>
                {COUPONS.map(c => (
                  <option key={c.id} value={c.id}>{c.code} — {c.label.split('—')[1]?.trim()}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {couponId && (
              <div className="flex items-center justify-between mt-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
                <span className="text-xs text-orange-700 font-medium flex items-center gap-1.5">
                  <TicketPercent className="w-3 h-3" />
                  {COUPONS.find(c => c.id === couponId)?.code} applied
                </span>
                <button type="button" onClick={() => setCouponId('')} className="text-orange-400 hover:text-orange-700 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          {price > 0 && (
            <PriceBreakdown
              basePrice={price}
              discountType={discountType}
              discountValue={discountValue}
              couponId={couponId}
            />
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
          >
            <Check className="w-4 h-4" />
            {isEdit ? 'Save Changes' : 'Add Pricing'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Preview Modal ──────────────────────────────────────────────────────────────
function PreviewModal({ item, onClose }: { item: EcommerceItem; onClose: () => void }) {
  const course = COURSES.find(c => c.id === item.courseId)!;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Pricing Preview</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Course</p>
            <p className="font-semibold text-gray-900">{course.name}</p>
            <span className="text-xs text-gray-400">{course.category}</span>
          </div>
          <PriceBreakdown basePrice={item.price} discountType={item.discountType} discountValue={item.discountValue} couponId={item.couponId} />
        </div>
        <div className="px-6 pb-5">
          <button onClick={onClose} className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">Close</button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export function EcommercePage() {
  const [items, setItems]           = useState<EcommerceItem[]>(SEED);
  const [modalItem, setModalItem]   = useState<EcommerceItem | null | undefined>(undefined); // undefined=closed, null=create, object=edit
  const [previewItem, setPreviewItem] = useState<EcommerceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EcommerceItem | null>(null);
  const [search, setSearch]         = useState('');
  const [filterCat, setFilterCat]   = useState('');

  const filtered = useMemo(() => items.filter(item => {
    const course = COURSES.find(c => c.id === item.courseId);
    if (!course) return false;
    if (filterCat && course.category !== filterCat) return false;
    if (search && !course.name.toLowerCase().includes(search.toLowerCase()) && !course.category.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [items, search, filterCat]);

  const handleSave = (saved: EcommerceItem) => {
    setItems(prev => {
      const exists = prev.find(i => i.id === saved.id);
      return exists ? prev.map(i => i.id === saved.id ? saved : i) : [...prev, saved];
    });
    toast.success(modalItem ? 'Pricing updated successfully!' : 'Course pricing added!');
    setModalItem(undefined);
  };

  const handleDelete = (item: EcommerceItem) => {
    setItems(prev => prev.filter(i => i.id !== item.id));
    toast.success('Course pricing removed.');
    setDeleteTarget(null);
  };

  const discountBadge = (item: EcommerceItem) => {
    if (item.discountType === 'flat')       return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">−₹{item.discountValue}</span>;
    if (item.discountType === 'percentage') return <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">−{item.discountValue}%</span>;
    return <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-semibold">No discount</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Modals */}
      <AnimatePresence>
        {modalItem !== undefined && (
          <EcommerceModal
            item={modalItem}
            onSave={handleSave}
            onClose={() => setModalItem(undefined)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {previewItem && <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />}
      </AnimatePresence>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove Course Pricing"
        message={`Remove pricing for "${COURSES.find(c => c.id === deleteTarget?.courseId)?.name ?? ''}"? This cannot be undone.`}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">E-Commerce</h1>
              <p className="text-xs text-gray-500">Manage course pricing, discounts &amp; coupons</p>
            </div>
          </div>
          <button
            onClick={() => setModalItem(null)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Add Course Pricing
          </button>
        </div>
      </header>

      <main className="px-6 py-6 space-y-6">

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search course or category..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
              className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white appearance-none"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
          {(search || filterCat) && (
            <button onClick={() => { setSearch(''); setFilterCat(''); }} className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
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
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">Course</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Category</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Original</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Discount</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Coupons</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Final Price</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <ShoppingCart className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-400">No pricing entries found</p>
                      <p className="text-xs text-gray-300 mt-1">Try adjusting the search or filter</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map(item => {
                    const course = COURSES.find(c => c.id === item.courseId)!;
                    const finalPrice = calcFinal(item.price, item.discountType, item.discountValue, item.couponId);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-4 h-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{course.name}</p>
                              <p className="text-xs text-gray-400">Added {item.createdAt}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">{course.category}</span>
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-gray-700">{fmt(item.price)}</td>
                        <td className="px-4 py-4 text-center">{discountBadge(item)}</td>
                        <td className="px-4 py-4 text-center">
                          {item.couponId
                            ? <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-mono font-semibold">
                                {COUPONS.find(c => c.id === item.couponId)?.code ?? '—'}
                              </span>
                            : <span className="text-xs text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm font-bold text-orange-600">{fmt(finalPrice)}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setPreviewItem(item)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Preview"
                            ><Eye className="w-4 h-4" /></button>
                            <button
                              onClick={() => setModalItem(item)}
                              className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Edit"
                            ><Edit2 className="w-4 h-4" /></button>
                            <button
                              onClick={() => setDeleteTarget(item)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            ><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
              Showing {filtered.length} of {items.length} {items.length === 1 ? 'entry' : 'entries'}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
