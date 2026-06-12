"""
avg_price.py — avg_service_price auto-calculation helper.
Additive module — does NOT modify any existing code.
"""
from typing import List


def compute_avg_service_price(services: List[dict]) -> float:
    """
    Return the average price of all ACTIVE services.
    A service is considered active if:
      - it has no is_active key (legacy document, treat as active), OR
      - is_active is True
    Returns 0.0 when there are no active services.
    """
    active = [
        s for s in (services or [])
        if s.get("is_active", True)  # treat missing key as active (backward compat)
    ]
    if not active:
        return 0.0
    prices = [float(s.get("price", 0)) for s in active]
    return round(sum(prices) / len(prices), 2)
