from app.mongodb.client import db

# ── Existing collections (DO NOT MODIFY) ─────────────────────────────────────
analysis_collection      = db["analysis_results"]
appointments_collection  = db["appointments"]
users_collection         = db["users"]
settings_collection      = db["settings"]
salons_collection        = db["salons"]
reviews_collection       = db["salon_reviews"]
slot_bookings_collection = db["slot_bookings"]

# ── New enterprise collections ────────────────────────────────────────────────
staff_collection            = db["salon_staff"]
coupons_collection          = db["coupons"]
loyalty_collection          = db["loyalty_wallets"]
inventory_collection        = db["inventory"]
campaigns_collection        = db["campaigns"]
automations_collection      = db["automations"]
reels_collection            = db["reels"]
franchises_collection       = db["franchises"]
memberships_collection      = db["memberships"]
user_subscriptions_collection = db["user_subscriptions"]
waitlist_collection         = db["waitlist"]
webhooks_collection         = db["webhooks"]
api_keys_collection         = db["api_keys"]
b2b_products_collection     = db["b2b_products"]
b2b_orders_collection       = db["b2b_orders"]
support_tickets_collection  = db["support_tickets"]
invoices_collection         = db["invoices"]
commissions_collection      = db["commissions"]

# ── E-Commerce Collections ───────────────────────────────────────────────────
ecommerce_orders_collection = db["ecommerce_orders"]
ecommerce_carts_collection  = db["ecommerce_carts"]

# ── Form Builder Collections ─────────────────────────────────────────────────
custom_forms_collection      = db["custom_forms"]
form_submissions_collection  = db["form_submissions"]

# ── Staff HR Collections ─────────────────────────────────────────────────────
staff_attendance_collection  = db["staff_attendance"]
staff_leaves_collection      = db["staff_leaves"]
