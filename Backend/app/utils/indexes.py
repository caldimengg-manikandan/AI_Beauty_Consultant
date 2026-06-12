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
