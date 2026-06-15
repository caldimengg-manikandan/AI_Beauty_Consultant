"""
indexes.py — Create MongoDB indexes for the sync architecture.
Called once at startup. Safe to re-run — existing indexes are preserved.
Additive only — no existing indexes are modified or removed.
"""
import logging
logger = logging.getLogger(__name__)


def create_sync_indexes(salons_collection, salon_events_collection):
    """
    Create performance indexes required by the Shop Owner ↔ Customer
    synchronization architecture. All operations are idempotent.
    """
    try:
        # ── salons collection ─────────────────────────────────────────────────
        salons_collection.create_index(
            [("is_active", 1), ("city", 1)],
            name="idx_active_city", background=True
        )
        salons_collection.create_index(
            [("is_active", 1), ("is_verified", 1), ("salon_type", 1), ("gender_served", 1)],
            name="idx_active_verified_type_gender", background=True
        )
        salons_collection.create_index(
            [("is_active", 1), ("avg_service_price", 1)],
            name="idx_active_price", background=True
        )
        salons_collection.create_index(
            [("owner_user_id", 1)],
            name="idx_owner_user_id", background=True
        )
        salons_collection.create_index(
            [("id", 1)],
            name="idx_salon_id", unique=True, background=True
        )
        # Text index for full-text search (name, city, address)
        try:
            salons_collection.create_index(
                [("name", "text"), ("city", "text"), ("address", "text")],
                name="idx_text_search", background=True
            )
        except Exception as tex:
            # Text index already exists with different fields — skip silently
            logger.debug(f"Text index skipped: {tex}")

        # ── salon_events collection ───────────────────────────────────────────
        salon_events_collection.create_index(
            [("salon_id", 1), ("timestamp", -1)],
            name="idx_events_salon_time", background=True
        )
        salon_events_collection.create_index(
            [("actor_id", 1), ("timestamp", -1)],
            name="idx_events_actor_time", background=True
        )
        salon_events_collection.create_index(
            [("action", 1), ("timestamp", -1)],
            name="idx_events_action_time", background=True
        )

        logger.info("Sync architecture MongoDB indexes created/verified successfully")

    except Exception as e:
        # Index creation failure is non-fatal — app continues without indexes
        logger.warning(f"Index creation warning (non-fatal): {e}")


def create_app_indexes(db):
    """
    Create performance indexes for all major app collections.
    Called at startup — idempotent, non-fatal on failure.
    """
    try:
        # ── users ─────────────────────────────────────────────────────────────
        users = db["users"]
        users.create_index([("email", 1)],      name="idx_users_email",  unique=True, background=True)
        users.create_index([("role", 1)],        name="idx_users_role",               background=True)

        # ── analysis (skin scans) ─────────────────────────────────────────────
        analysis = db["analysis_results"]
        analysis.create_index([("user_id", 1), ("created_at", -1)], name="idx_analysis_user_time", background=True)
        analysis.create_index([("created_at", -1)],                  name="idx_analysis_time",      background=True)

        # ── appointments ──────────────────────────────────────────────────────
        appointments = db["appointments"]
        appointments.create_index([("user_id", 1)],                                name="idx_appt_user",      background=True)
        appointments.create_index([("appointment_date", 1), ("user_id", 1)],       name="idx_appt_date_user", background=True)

        # ── slot_bookings ─────────────────────────────────────────────────────
        slot_bookings = db["slot_bookings"]
        slot_bookings.create_index([("user_id", 1),   ("created_at", -1)], name="idx_sb_user_time",    background=True)
        slot_bookings.create_index([("salon_id", 1),  ("appointment_date", 1), ("appointment_time", 1), ("status", 1)],
                                    name="idx_sb_salon_slot_status", background=True)
        slot_bookings.create_index([("booking_ref", 1)], name="idx_sb_booking_ref", background=True)
        slot_bookings.create_index([("id", 1)],           name="idx_sb_id",          background=True)
        slot_bookings.create_index([("status", 1), ("appointment_date", 1)],
                                    name="idx_sb_status_date", background=True)

        # ── payments ──────────────────────────────────────────────────────────
        payments = db["payments"]
        payments.create_index([("booking_id", 1)], name="idx_pay_booking",  background=True)
        payments.create_index([("user_id", 1), ("created_at", -1)], name="idx_pay_user_time", background=True)

        # ── notification_preferences ──────────────────────────────────────────
        notif_prefs = db["notification_preferences"]
        notif_prefs.create_index([("user_email", 1)], name="idx_notifpref_email", background=True)

        # ── reviews ───────────────────────────────────────────────────────────
        reviews = db["salon_reviews"]
        reviews.create_index([("salon_id", 1), ("created_at", -1)], name="idx_review_salon_time", background=True)
        reviews.create_index([("user_id", 1)],                       name="idx_review_user",       background=True)

        logger.info("App MongoDB indexes created/verified successfully")

    except Exception as e:
        logger.warning(f"App index creation warning (non-fatal): {e}")
