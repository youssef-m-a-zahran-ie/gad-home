// Row shapes of the Neon schema (see db/migrations). Update by hand when the schema changes.
export type OrderStatus = "new" | "confirmed" | "shipped" | "delivered" | "cancelled";
export type PaymentMethod = "cod" | "instapay";

export type AdminRow = { created_at: string; email: string };
export type BannerRow = {
  created_at: string; id: string; image_path: string; is_active: boolean; link: string | null;
  mobile_image_path: string | null; sort: number; title: string | null;
};
export type CategoryRow = {
  created_at: string; id: string; image_path: string | null; is_active: boolean; name: string;
  parent_id: string | null; show_on_home: boolean; slug: string; sort: number; updated_at: string;
};
export type GovernorateRow = { fee: number; id: number; is_active: boolean; name: string; sort: number };
export type OrderItemRow = {
  cost: number | null; id: string; image_path: string | null; line_total: number; name: string;
  order_id: string; price: number; product_id: string | null; qty: number;
};
export type OrderRow = {
  address: string; admin_note: string | null; city: string; created_at: string; customer_name: string;
  governorate: string; governorate_id: number | null; id: string; notes: string | null; number: number;
  paid: boolean; payment_method: PaymentMethod; phone: string; phone2: string | null; shipping: number;
  status: OrderStatus; subtotal: number; total: number; updated_at: string;
  utm_campaign: string | null; utm_source: string | null;
};
export type ProductImageRow = { created_at: string; id: string; path: string; product_id: string; sort: number };
export type ProductRow = {
  category_id: string | null; compare_at_price: number | null; cost: number | null; created_at: string;
  description: string | null; id: string; is_active: boolean; is_best_seller: boolean; is_trending: boolean;
  low_stock_at: number; name: string; price: number; sku: string | null; slug: string; sort: number;
  stock: number; updated_at: string;
};
export type SettingsRow = {
  address: string | null; announcement: string | null; delivery_days: string | null; facebook: string | null;
  free_shipping_over: number | null; id: number; instagram: string | null; instapay: string | null;
  logo_path: string | null; min_order: number; phone: string | null; return_days: number; store_name: string;
  tagline: string | null; tiktok: string | null; updated_at: string; wallet: string | null; whatsapp: string | null;
};
export type StockMovementRow = {
  change: number; created_at: string; created_by: string | null; id: number; note: string | null;
  order_id: string | null; product_id: string; reason: string;
};

