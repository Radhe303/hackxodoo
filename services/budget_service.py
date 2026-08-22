from datetime import date

from config import supabase


# =========================================================
# HELPERS
# =========================================================

def _get_user_trip(trip_id, user_id):
    response = (
        supabase
        .table("trips")
        .select(
            """
            id,
            user_id,
            start_date,
            end_date,
            estimated_budget
            """
        )
        .eq("id", str(trip_id))
        .eq("user_id", str(user_id))
        .maybe_single()
        .execute()
    )

    return response.data


def _get_trip_stops(trip_id):
    response = (
        supabase
        .table("trip_stops")
        .select(
            """
            id,
            trip_id,
            city_id,
            arrival_date,
            departure_date
            """
        )
        .eq("trip_id", str(trip_id))
        .order("stop_order", desc=False)
        .execute()
    )

    return response.data or []


def _calculate_days(start_date, end_date):
    start = date.fromisoformat(start_date)
    end = date.fromisoformat(end_date)

    return (end - start).days + 1


# =========================================================
# HOTEL COST
# =========================================================

def calculate_hotel_cost(trip_id):

    stops = _get_trip_stops(trip_id)

    total_hotel_cost = 0.0
    breakdown = []

    for stop in stops:

        city_response = (
            supabase
            .table("cities")
            .select(
                """
                id,
                city_name,
                avg_hotel_cost
                """
            )
            .eq("id", str(stop["city_id"]))
            .maybe_single()
            .execute()
        )

        city = city_response.data

        if not city:
            continue

        arrival = date.fromisoformat(
            stop["arrival_date"]
        )

        departure = date.fromisoformat(
            stop["departure_date"]
        )

        nights = max(
            (departure - arrival).days,
            0
        )

        cost_per_night = float(
            city["avg_hotel_cost"] or 0
        )

        city_cost = nights * cost_per_night

        total_hotel_cost += city_cost

        breakdown.append({
            "city_id": city["id"],
            "city_name": city["city_name"],
            "nights": nights,
            "cost_per_night": round(
                cost_per_night,
                2
            ),
            "cost": round(
                city_cost,
                2
            )
        })

    return round(total_hotel_cost, 2), breakdown


# =========================================================
# FOOD COST
# =========================================================

def calculate_food_cost(trip_id):

    stops = _get_trip_stops(trip_id)

    total_food_cost = 0.0
    breakdown = []

    for stop in stops:

        city_response = (
            supabase
            .table("cities")
            .select(
                """
                id,
                city_name,
                avg_food_cost
                """
            )
            .eq("id", str(stop["city_id"]))
            .maybe_single()
            .execute()
        )

        city = city_response.data

        if not city:
            continue

        arrival = date.fromisoformat(
            stop["arrival_date"]
        )

        departure = date.fromisoformat(
            stop["departure_date"]
        )

        days = (
            departure - arrival
        ).days + 1

        cost_per_day = float(
            city["avg_food_cost"] or 0
        )

        city_cost = days * cost_per_day

        total_food_cost += city_cost

        breakdown.append({
            "city_id": city["id"],
            "city_name": city["city_name"],
            "days": days,
            "cost_per_day": round(
                cost_per_day,
                2
            ),
            "cost": round(
                city_cost,
                2
            )
        })

    return round(total_food_cost, 2), breakdown


# =========================================================
# ACTIVITY COST
# =========================================================

def calculate_activity_cost(trip_id):

    response = (
        supabase
        .table("stop_activities")
        .select(
            """
            id,
            stop_id,
            activity_id,
            custom_cost,
            activities (
                id,
                activity_name,
                estimated_cost
            ),
            trip_stops!inner (
                trip_id
            )
            """
        )
        .eq(
            "trip_stops.trip_id",
            str(trip_id)
        )
        .execute()
    )

    total_activity_cost = 0.0
    breakdown = []

    for item in response.data or []:

        activity = item.get("activities")

        if not activity:
            continue

        if item.get("custom_cost") is not None:
            activity_cost = float(
                item["custom_cost"]
            )
        else:
            activity_cost = float(
                activity["estimated_cost"] or 0
            )

        total_activity_cost += activity_cost

        breakdown.append({
            "stop_activity_id": item["id"],
            "activity_id": activity["id"],
            "activity_name": activity["activity_name"],
            "cost": round(
                activity_cost,
                2
            )
        })

    return round(total_activity_cost, 2), breakdown


# =========================================================
# TRANSPORT COST
# =========================================================

def calculate_transport_cost(trip_id):

    response = (
        supabase
        .table("trip_transport")
        .select(
            """
            id,
            from_stop,
            to_stop,
            distance_km,
            estimated_cost,
            transport_modes (
                id,
                mode_name
            )
            """
        )
        .eq(
            "trip_id",
            str(trip_id)
        )
        .execute()
    )

    total_transport_cost = 0.0
    breakdown = []

    for item in response.data or []:

        cost = float(
            item["estimated_cost"] or 0
        )

        total_transport_cost += cost

        mode = item.get(
            "transport_modes"
        )

        breakdown.append({
            "transport_id": item["id"],
            "from_stop": item["from_stop"],
            "to_stop": item["to_stop"],
            "transport_mode": (
                mode["mode_name"]
                if mode
                else None
            ),
            "distance_km": float(
                item["distance_km"] or 0
            ),
            "cost": round(
                cost,
                2
            )
        })

    return round(total_transport_cost, 2), breakdown


# =========================================================
# COMPLETE BUDGET CALCULATION
# =========================================================

def calculate_trip_budget(
    trip_id,
    user_id,
    miscellaneous_cost=0,
    budget_limit=None
):

    trip = _get_user_trip(
        trip_id,
        user_id
    )

    if not trip:
        return None, "Trip not found"

    # -----------------------------------------------------
    # MISCELLANEOUS
    # -----------------------------------------------------

    try:
        miscellaneous_cost = float(
            miscellaneous_cost or 0
        )
    except (TypeError, ValueError):
        return None, "Invalid miscellaneous cost"

    if miscellaneous_cost < 0:
        return None, (
            "Miscellaneous cost cannot be negative"
        )

    # -----------------------------------------------------
    # BUDGET LIMIT
    # -----------------------------------------------------

    if budget_limit is not None:

        try:
            budget_limit = float(
                budget_limit
            )
        except (TypeError, ValueError):
            return None, "Invalid budget limit"

        if budget_limit < 0:
            return None, (
                "Budget limit cannot be negative"
            )

    # -----------------------------------------------------
    # COMPONENT CALCULATIONS
    # -----------------------------------------------------

    transport_cost, transport_breakdown = (
        calculate_transport_cost(
            trip_id
        )
    )

    hotel_cost, hotel_breakdown = (
        calculate_hotel_cost(
            trip_id
        )
    )

    food_cost, food_breakdown = (
        calculate_food_cost(
            trip_id
        )
    )

    activity_cost, activity_breakdown = (
        calculate_activity_cost(
            trip_id
        )
    )

    # -----------------------------------------------------
    # TOTAL
    # -----------------------------------------------------

    total_budget = round(
        transport_cost
        + hotel_cost
        + food_cost
        + activity_cost
        + miscellaneous_cost,
        2
    )

    # -----------------------------------------------------
    # DAILY AVERAGE
    # -----------------------------------------------------

    trip_days = _calculate_days(
        trip["start_date"],
        trip["end_date"]
    )

    average_per_day = round(
        total_budget / trip_days,
        2
    ) if trip_days > 0 else 0

    # -----------------------------------------------------
    # OVER-BUDGET DETECTION
    # -----------------------------------------------------

    is_over_budget = False
    over_budget_amount = 0.0
    remaining_budget = None

    if budget_limit is not None:

        is_over_budget = (
            total_budget > budget_limit
        )

        if is_over_budget:
            over_budget_amount = round(
                total_budget - budget_limit,
                2
            )
            remaining_budget = 0.0

        else:
            remaining_budget = round(
                budget_limit - total_budget,
                2
            )

    # -----------------------------------------------------
    # SAVE ESTIMATED BUDGET
    # -----------------------------------------------------

    try:

        (
            supabase
            .table("trips")
            .update({
                "estimated_budget": total_budget
            })
            .eq("id", str(trip_id))
            .eq("user_id", str(user_id))
            .execute()
        )

    except Exception:
        return None, (
            "Unable to update trip budget"
        )

    return {
        "trip_id": str(trip_id),

        "trip_days": trip_days,

        "transport_cost": transport_cost,

        "hotel_cost": hotel_cost,

        "food_cost": food_cost,

        "activity_cost": activity_cost,

        "miscellaneous_cost": round(
            miscellaneous_cost,
            2
        ),

        "total_budget": total_budget,

        "average_cost_per_day": average_per_day,

        "budget_limit": budget_limit,

        "is_over_budget": is_over_budget,

        "over_budget_amount": over_budget_amount,

        "remaining_budget": remaining_budget,

        "breakdown": {
            "transport": transport_breakdown,
            "hotel": hotel_breakdown,
            "food": food_breakdown,
            "activities": activity_breakdown
        }
    }, None


# =========================================================
# SAVE BUDGET
# =========================================================

def save_trip_budget(
    trip_id,
    user_id,
    budget_data
):

    trip = _get_user_trip(
        trip_id,
        user_id
    )

    if not trip:
        return None, "Trip not found"

    payload = {
        "trip_id": str(trip_id),
        "transport_cost": float(
            budget_data["transport_cost"]
        ),
        "hotel_cost": float(
            budget_data["hotel_cost"]
        ),
        "food_cost": float(
            budget_data["food_cost"]
        ),
        "activity_cost": float(
            budget_data["activity_cost"]
        ),
        "miscellaneous_cost": float(
            budget_data["miscellaneous_cost"]
        ),
        "total_budget": float(
            budget_data["total_budget"]
        )
    }

    try:

        response = (
            supabase
            .table("trip_budget")
            .upsert(
                payload,
                on_conflict="trip_id"
            )
            .execute()
        )

    except Exception:
        return None, (
            "Unable to save trip budget"
        )

    if not response.data:
        return None, (
            "Unable to save trip budget"
        )

    return response.data[0], None


# =========================================================
# GET BUDGET
# =========================================================

def get_trip_budget(
    trip_id,
    user_id
):

    trip = _get_user_trip(
        trip_id,
        user_id
    )

    if not trip:
        return None, "Trip not found"

    response = (
        supabase
        .table("trip_budget")
        .select(
            """
            id,
            trip_id,
            transport_cost,
            hotel_cost,
            food_cost,
            activity_cost,
            miscellaneous_cost,
            total_budget
            """
        )
        .eq(
            "trip_id",
            str(trip_id)
        )
        .maybe_single()
        .execute()
    )

    return response.data, None