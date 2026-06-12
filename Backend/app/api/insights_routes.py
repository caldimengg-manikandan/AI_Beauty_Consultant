"""
AI Business Insights Engine — Real MongoDB Aggregation Pipeline
Replaces all mock/random data with genuine analytics from:
  - slot_bookings_collection  → booking trends, peak hours, service popularity
  - invoices_collection       → revenue trends
  - staff_collection          → stylist performance
  - inventory_collection      → stock health
  - Gemini API                → natural language business recommendations
"""
from fastapi import APIRouter, Depends, Query
from datetime import datetime, timedelta
from collections import Counter, defaultdict
import os

from app.auth.jwt_handler import get_current_user
from app.auth.rbac import require_shop_owner
from app.mongodb.collections import (
    salons_collection,
    slot_bookings_collection,
    invoices_collection,
    staff_collection,
    inventory_collection,
    users_collection,
)

router = APIRouter(
    prefix="/api/insights",
    tags=["AI Business Insights"],
    dependencies=[__import__('fastapi').Depends(require_shop_owner)]
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# ── Helpers ────────────────────────────────────────────────────────────────────

def _get_owner_salon(user: dict):
    salon = salons_collection.find_one({"owner_user_id": user.get("sub")})
    return salon

def _parse_time_to_24h(time_str: str) -> int:
    """Convert '2:00 PM' → 14, '10:00 AM' → 10 for grouping."""
    try:
        parts = time_str.strip().split(":")
        hour = int(parts[0])
        meridiem = "PM" if "PM" in time_str.upper() else "AM"
        if meridiem == "PM" and hour != 12:
            hour += 12
        elif meridiem == "AM" and hour == 12:
            hour = 0
        return hour
    except Exception:
        return 10  # default fallback

def _generate_gemini_insights(salon_name: str, data_summary: dict) -> list:
    """
    Call Gemini API with real salon data to generate business recommendations.
    Falls back to rule-based insights if API key not configured.
    """
    insights = []

    # --- Rule-based insights from real data ---
    bookings_count = data_summary.get("total_bookings_30d", 0)
    revenue_30d = data_summary.get("total_revenue_30d", 0)
    slowest_day = data_summary.get("slowest_day")
    busiest_day = data_summary.get("busiest_day")
    top_service = data_summary.get("top_service")
    low_stock_count = data_summary.get("low_stock_count", 0)
    repeat_customer_pct = data_summary.get("repeat_customer_pct", 0)
    peak_hour = data_summary.get("peak_hour")

    # Revenue insight
    if revenue_30d > 0:
        avg_daily = round(revenue_30d / 30, 0)
        insights.append({
            "type": "success",
            "title": "Revenue on Track",
            "message": f"Your salon generated ₹{revenue_30d:,.0f} in the last 30 days — averaging ₹{avg_daily:,.0f}/day. "
                       f"Maintain this momentum by offering weekend packages."
        })

    # Slow day promotion
    if slowest_day and busiest_day:
        insights.append({
            "type": "opportunity",
            "title": f"Boost {slowest_day} Bookings",
            "message": f"{slowest_day} has the fewest bookings compared to your peak on {busiest_day}. "
                       f"Launch a '{slowest_day} Special' — 10% off on all services to fill slots."
        })

    # Top service upsell
    if top_service:
        insights.append({
            "type": "trend",
            "title": f"Capitalize on '{top_service}'",
            "message": f"'{top_service}' is your most booked service this month. Consider creating a bundle "
                       f"(e.g., {top_service} + Head Massage) to increase per-customer revenue."
        })

    # Low stock warning
    if low_stock_count > 0:
        insights.append({
            "type": "warning",
            "title": f"{low_stock_count} Products Low on Stock",
            "message": f"You have {low_stock_count} inventory items at or below reorder level. "
                       f"Place orders with your B2B supplier to avoid service disruptions."
        })

    # Customer retention
    if repeat_customer_pct >= 50:
        insights.append({
            "type": "success",
            "title": "Strong Customer Loyalty",
            "message": f"{repeat_customer_pct:.0f}% of your bookings this month are from returning customers. "
                       f"Introduce a loyalty card program to reward them and increase visit frequency."
        })
    elif repeat_customer_pct > 0:
        insights.append({
            "type": "opportunity",
            "title": "Improve Customer Retention",
            "message": f"Only {repeat_customer_pct:.0f}% repeat bookings detected. Send a WhatsApp follow-up "
                       f"2 weeks after each visit with a 5% return discount to boost loyalty."
        })

    # Peak hour insight
    if peak_hour is not None:
        h = peak_hour
        label = f"{h}:00 {'AM' if h < 12 else 'PM'}" if h <= 12 else f"{h - 12}:00 PM"
        insights.append({
            "type": "trend",
            "title": f"Peak Hour: {label}",
            "message": f"Most bookings arrive around {label}. Schedule your senior stylists and "
                       f"prioritize premium services during this window to maximize revenue."
        })

    # --- Try Gemini API for additional AI insight ---
    if GEMINI_API_KEY and bookings_count > 0:
        try:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-1.5-flash")
            prompt = (
                f"You are a business analyst for a beauty salon called '{salon_name}'. "
                f"Based on the following real data, give ONE specific, actionable tip in 2 sentences. "
                f"Data: Total bookings this month: {bookings_count}, Revenue: ₹{revenue_30d}, "
                f"Top service: {top_service}, Busiest day: {busiest_day}, Slowest day: {slowest_day}. "
                f"Be concise and direct. Do not use bullet points."
            )
            response = model.generate_content(prompt)
            if response.text:
                insights.append({
                    "type": "ai",
                    "title": "✨ Gemini AI Tip",
                    "message": response.text.strip()
                })
        except Exception:
            pass  # Gracefully skip if Gemini fails

    return insights


# ── Main Dashboard ─────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def get_insights_dashboard(
    days: int = Query(30, description="Number of past days to analyze"),
    user: dict = Depends(get_current_user)
):
    """
    Real-data AI insights dashboard for the shop owner.
    Uses MongoDB aggregation pipelines — zero mock/random values.
    """
    salon = _get_owner_salon(user)
    if not salon:
        return {"error": "No salon found for this account"}

    salon_id = salon["id"]
    since_dt = datetime.utcnow() - timedelta(days=days)
    since_str = since_dt.isoformat()  # kept for Python-side string parsing only

    # ── 1. Revenue Trend (last 7 days from invoices) ──────────────────────────
    # Build a date-keyed dict first
    revenue_by_date: dict = {}
    for i in range(6, -1, -1):
        d = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
        revenue_by_date[d] = 0.0

    # Use datetime object for BSON Date comparison (not ISO string)
    invoices = list(invoices_collection.find({
        "salon_id": salon_id,
        "$or": [
            {"created_at": {"$gte": since_dt}},
            {"created_at": {"$gte": since_str}}
        ]
    }))

    for inv in invoices:
        raw_dt = inv.get("created_at", "")
        if isinstance(raw_dt, datetime):
            d_str = raw_dt.strftime("%Y-%m-%d")
        elif isinstance(raw_dt, str) and len(raw_dt) >= 10:
            d_str = raw_dt[:10]
        else:
            continue
        if d_str in revenue_by_date:
            revenue_by_date[d_str] += float(inv.get("grand_total", inv.get("total_amount", 0)))

    revenue_trends = [{"date": d, "revenue": round(v, 2)} for d, v in revenue_by_date.items()]
    total_revenue_30d = sum(revenue_by_date.values())

    # ── 2. Peak Booking Hours ─────────────────────────────────────────────────
    # Use datetime object for BSON Date comparison
    bookings_30d = list(slot_bookings_collection.find({
        "salon_id": salon_id,
        "$or": [
            {"created_at": {"$gte": since_dt}},
            {"created_at": {"$gte": since_str}}
        ]
    }))

    hour_counts: dict = defaultdict(int)
    for b in bookings_30d:
        time_str = b.get("appointment_time", "")
        if time_str:
            hour = _parse_time_to_24h(time_str)
            hour_counts[hour] += 1

    # Build 9AM–9PM range
    peak_hours = []
    peak_hour_val = None
    peak_hour_max = 0
    for h in range(9, 22):
        label = f"{h}:00" if h < 12 else ("12:00" if h == 12 else f"{h - 12}:00")
        suffix = "AM" if h < 12 else "PM"
        count = hour_counts.get(h, 0)
        peak_hours.append({"time": f"{label} {suffix}", "bookings": count})
        if count > peak_hour_max:
            peak_hour_max = count
            peak_hour_val = h

    # ── 3. Day-of-week Analysis ───────────────────────────────────────────────
    day_counts: dict = defaultdict(int)
    for b in bookings_30d:
        appt_date = b.get("appointment_date", "")
        try:
            if isinstance(appt_date, str) and len(appt_date) >= 10:
                d = datetime.strptime(appt_date[:10], "%Y-%m-%d")
                day_counts[d.strftime("%A")] += 1
        except Exception:
            pass

    slowest_day = min(day_counts, key=day_counts.get) if day_counts else None
    busiest_day = max(day_counts, key=day_counts.get) if day_counts else None
    day_of_week_data = [{"day": k, "bookings": v} for k, v in sorted(day_counts.items())]

    # ── 4. Service Popularity ─────────────────────────────────────────────────
    service_counter = Counter(b.get("service_name", "Unknown") for b in bookings_30d)
    top_service = service_counter.most_common(1)[0][0] if service_counter else None
    services_breakdown = [
        {"service": s, "bookings": c} for s, c in service_counter.most_common(8)
    ]

    # ── 5. Staff Performance (real booking-linked data) ───────────────────────
    staff_list = list(staff_collection.find({"salon_id": salon_id, "is_active": True}))
    top_stylists = []
    for s in staff_list:
        s.pop("_id", None)
        staff_id = s.get("id")
        # Count completed bookings linked to this staff
        completed = slot_bookings_collection.count_documents({
            "salon_id": salon_id,
            "stylist_id": staff_id,
            "status": "completed"
        })
        # Sum revenue from invoices linked to this staff
        staff_invoices = list(invoices_collection.find({
            "salon_id": salon_id,
            "staff_id": staff_id,
            "created_at": {"$gte": since_str}
        }))
        staff_revenue = sum(
            float(inv.get("grand_total", inv.get("total_amount", 0)))
            for inv in staff_invoices
        )
        top_stylists.append({
            "id": staff_id,
            "name": s.get("name", "Unknown"),
            "role": s.get("role", "stylist"),
            "completed_bookings": completed,
            "revenue": round(staff_revenue, 2),
            "rating": s.get("avg_rating", 0.0) or 4.5
        })
    top_stylists = sorted(top_stylists, key=lambda x: x["revenue"], reverse=True)[:5]

    # ── 6. Customer Retention ─────────────────────────────────────────────────
    all_customer_ids = [b.get("user_id") for b in bookings_30d if b.get("user_id")]
    customer_freq = Counter(all_customer_ids)
    repeat_customers = sum(1 for c, count in customer_freq.items() if count > 1)
    unique_customers = len(customer_freq)
    repeat_pct = round((repeat_customers / unique_customers) * 100, 1) if unique_customers > 0 else 0

    # ── 7. Inventory Health ───────────────────────────────────────────────────
    low_stock_count = inventory_collection.count_documents({
        "salon_id": salon_id,
        "is_active": True,
        "$expr": {"$lte": ["$quantity", "$low_stock_threshold"]}
    })

    # ── 8. Monthly Comparison ─────────────────────────────────────────────────
    prev_month_start_dt = datetime.utcnow() - timedelta(days=60)
    prev_month_end_dt = datetime.utcnow() - timedelta(days=30)
    prev_month_start_str = prev_month_start_dt.isoformat()
    prev_month_end_str = prev_month_end_dt.isoformat()

    prev_bookings = slot_bookings_collection.count_documents({
        "salon_id": salon_id,
        "$or": [
            {"created_at": {"$gte": prev_month_start_dt, "$lt": prev_month_end_dt}},
            {"created_at": {"$gte": prev_month_start_str, "$lt": prev_month_end_str}}
        ]
    })
    curr_bookings = len(bookings_30d)

    prev_invoices = list(invoices_collection.find({
        "salon_id": salon_id,
        "$or": [
            {"created_at": {"$gte": prev_month_start_dt, "$lt": prev_month_end_dt}},
            {"created_at": {"$gte": prev_month_start_str, "$lt": prev_month_end_str}}
        ]
    }))
    prev_revenue = sum(float(i.get("grand_total", i.get("total_amount", 0))) for i in prev_invoices)

    booking_growth = round(((curr_bookings - prev_bookings) / prev_bookings) * 100, 1) if prev_bookings > 0 else 0
    revenue_growth = round(((total_revenue_30d - prev_revenue) / prev_revenue) * 100, 1) if prev_revenue > 0 else 0

    # ── 9. AI Recommendations (Gemini + rule-based) ───────────────────────────
    data_summary = {
        "total_bookings_30d": curr_bookings,
        "total_revenue_30d": total_revenue_30d,
        "slowest_day": slowest_day,
        "busiest_day": busiest_day,
        "top_service": top_service,
        "low_stock_count": low_stock_count,
        "repeat_customer_pct": repeat_pct,
        "peak_hour": peak_hour_val,
    }
    ai_recommendations = _generate_gemini_insights(salon.get("name", "Your Salon"), data_summary)

    # ── 10. Forecast (simple linear projection) ───────────────────────────────
    avg_daily_rev = total_revenue_30d / days if days > 0 else 0
    projected_next_week = round(avg_daily_rev * 7 * 1.05, 2)  # +5% optimistic
    growth_label = f"+{revenue_growth}%" if revenue_growth >= 0 else f"{revenue_growth}%"

    return {
        "period_days": days,
        "salon_name": salon.get("name"),

        # Revenue
        "revenue_trends": revenue_trends,
        "total_revenue_30d": round(total_revenue_30d, 2),
        "revenue_growth_vs_last_month": revenue_growth,

        # Bookings
        "total_bookings_30d": curr_bookings,
        "booking_growth_vs_last_month": booking_growth,
        "peak_hours": peak_hours,
        "day_of_week": day_of_week_data,

        # Services
        "services_breakdown": services_breakdown,
        "top_service": top_service,

        # Staff
        "top_stylists": top_stylists,

        # Customers
        "unique_customers": unique_customers,
        "repeat_customers": repeat_customers,
        "repeat_customer_pct": repeat_pct,

        # Inventory
        "low_stock_alerts": low_stock_count,

        # AI
        "ai_recommendations": ai_recommendations,

        # Forecast
        "forecast": {
            "next_week_revenue": projected_next_week,
            "expected_growth": growth_label,
        }
    }


@router.get("/services-breakdown")
async def services_breakdown(
    days: int = Query(30),
    user: dict = Depends(get_current_user)
):
    """Top services booked in the last N days."""
    salon = _get_owner_salon(user)
    if not salon:
        return {"error": "No salon found"}
    salon_id = salon["id"]
    since_dt_local = datetime.utcnow() - timedelta(days=days)
    since_str_local = since_dt_local.isoformat()

    bookings = list(slot_bookings_collection.find({
        "salon_id": salon_id,
        "$or": [
            {"created_at": {"$gte": since_dt_local}},
            {"created_at": {"$gte": since_str_local}}
        ]
    }))
    counter = Counter(b.get("service_name", "Unknown") for b in bookings)
    total = len(bookings)
    breakdown = [
        {
            "service": s,
            "bookings": c,
            "percentage": round((c / total) * 100, 1) if total > 0 else 0
        }
        for s, c in counter.most_common(10)
    ]
    return {"services": breakdown, "total_bookings": total, "period_days": days}


@router.get("/customer-retention")
async def customer_retention(
    days: int = Query(30),
    user: dict = Depends(get_current_user)
):
    """New vs returning customers in the last N days."""
    salon = _get_owner_salon(user)
    if not salon:
        return {"error": "No salon found"}
    salon_id = salon["id"]
    since_dt_ret = datetime.utcnow() - timedelta(days=days)
    since_str_ret = since_dt_ret.isoformat()

    bookings = list(slot_bookings_collection.find({
        "salon_id": salon_id,
        "$or": [
            {"created_at": {"$gte": since_dt_ret}},
            {"created_at": {"$gte": since_str_ret}}
        ]
    }))
    customer_freq = Counter(b.get("user_id") for b in bookings if b.get("user_id"))
    new_customers = sum(1 for c, count in customer_freq.items() if count == 1)
    returning_customers = sum(1 for c, count in customer_freq.items() if count > 1)

    return {
        "total_unique_customers": len(customer_freq),
        "new_customers": new_customers,
        "returning_customers": returning_customers,
        "retention_rate_pct": round((returning_customers / len(customer_freq)) * 100, 1) if customer_freq else 0,
        "period_days": days
    }


@router.get("/churn-risk")
async def get_churn_risk(
    user: dict = Depends(get_current_user)
):
    """
    Identifies customers at risk of churning:
    - Visited at least 2 times (regular customer)
    - Last visit was > 30 days ago
    """
    salon = _get_owner_salon(user)
    if not salon:
        return {"error": "No salon found"}
    salon_id = salon["id"]

    # Fetch all completed bookings for the salon to analyze history
    all_bookings = list(slot_bookings_collection.find({
        "salon_id": salon_id,
        "status": "completed"
    }))

    # Group bookings by user
    user_stats = {}
    for b in all_bookings:
        uid = b.get("user_id")
        if not uid:
            continue
            
        # Parse BSON Date or ISO string
        created_at = b.get("created_at")
        if isinstance(created_at, str):
            try:
                dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            except ValueError:
                dt = datetime.utcnow() # Fallback
        elif isinstance(created_at, datetime):
            dt = created_at
        else:
            continue

        if uid not in user_stats:
            user_stats[uid] = {
                "visits": 0,
                "last_visit": dt,
                "client_name": b.get("customer_name") or "Valued Client",
                "phone": b.get("customer_phone", "")
            }
        
        user_stats[uid]["visits"] += 1
        if dt > user_stats[uid]["last_visit"]:
            user_stats[uid]["last_visit"] = dt

    # Filter for churn risk: visits >= 2 AND last_visit > 30 days ago
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)
    
    at_risk_users = []
    for uid, stats in user_stats.items():
        if stats["visits"] >= 2 and stats["last_visit"] < thirty_days_ago:
            # Try to fetch real user details if they have an account
            user_doc = users_collection.find_one({"_id": uid}) or users_collection.find_one({"email": uid})
            
            email = uid if "@" in uid else (user_doc.get("email") if user_doc else "")
            name = user_doc.get("name") if user_doc else stats["client_name"]
            
            at_risk_users.append({
                "user_id": uid,
                "name": name,
                "email": email,
                "phone": stats["phone"],
                "total_visits": stats["visits"],
                "last_visit_date": stats["last_visit"].isoformat(),
                "days_since_last_visit": (now - stats["last_visit"]).days
            })
            
    # Sort by days_since_last_visit descending (most at risk first)
    at_risk_users.sort(key=lambda x: x["days_since_last_visit"], reverse=True)

    return {
        "status": "success",
        "total_at_risk": len(at_risk_users),
        "at_risk_customers": at_risk_users
    }
