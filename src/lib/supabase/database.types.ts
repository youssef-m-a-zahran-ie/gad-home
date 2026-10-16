// Generated from the Supabase schema (project home-store), then compacted by hand:
// Insert = required columns + optional rest, Update = Partial<Row>.
// Regenerate after schema changes.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Rel<Fk extends string, Col extends string, Ref extends string> = {
  foreignKeyName: Fk;
  columns: [Col];
  isOneToOne: false;
  referencedRelation: Ref;
  referencedColumns: ["id"];
};
type T<Row, Req extends keyof Row, R extends Rel<string, string, string>[] = []> = {
  Row: Row;
  Insert: Pick<Row, Req> & Partial<Omit<Row, Req>>;
  Update: Partial<Row>;
  Relationships: R;
};

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

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.18" };
  public: {
    Tables: {
      admins: T<AdminRow, "email">;
      banners: T<BannerRow, "image_path">;
      categories: T<CategoryRow, "name" | "slug", [Rel<"categories_parent_id_fkey", "parent_id", "categories">]>;
      governorates: T<GovernorateRow, "name">;
      order_items: T<OrderItemRow, "line_total" | "name" | "order_id" | "price" | "qty", [Rel<"order_items_order_id_fkey", "order_id", "orders">, Rel<"order_items_product_id_fkey", "product_id", "products">]>;
      orders: T<OrderRow, "address" | "city" | "customer_name" | "governorate" | "phone" | "shipping" | "subtotal" | "total", [Rel<"orders_governorate_id_fkey", "governorate_id", "governorates">]>;
      product_images: T<ProductImageRow, "path" | "product_id", [Rel<"product_images_product_id_fkey", "product_id", "products">]>;
      products: T<ProductRow, "name" | "price" | "slug", [Rel<"products_category_id_fkey", "category_id", "categories">]>;
      settings: T<SettingsRow, never>;
      stock_movements: T<StockMovementRow, "change" | "product_id" | "reason", [Rel<"stock_movements_product_id_fkey", "product_id", "products">]>;
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: never; Returns: boolean };
      is_admin_email: { Args: { p_email: string }; Returns: boolean };
      order_receipt: { Args: { p_id: string }; Returns: Json };
      place_order: { Args: { p_customer: Json; p_ip?: string; p_items: Json }; Returns: Json };
      set_stock: { Args: { p_note?: string; p_product: string; p_stock: number }; Returns: number };
    };
    Enums: { order_status: OrderStatus; payment_method: PaymentMethod };
    CompositeTypes: { [_ in never]: never };
  };
};
