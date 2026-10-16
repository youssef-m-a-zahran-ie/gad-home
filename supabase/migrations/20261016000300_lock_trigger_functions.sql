-- Trigger-only functions: nobody calls these over the API.
-- (place_order, order_receipt, is_admin, is_admin_email are public on purpose; set_stock checks is_admin itself.)
revoke execute on function public.apply_stock_movement() from public, anon, authenticated;
revoke execute on function public.order_status_stock() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
