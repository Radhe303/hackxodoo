from datetime import date

from config import supabase


# =========================================================
# DASHBOARD SERVICE
# =========================================================

def get_dashboard(user_id):
    """
    Build dashboard data for the authenticated user.

    Dashboard includes:
        - upcoming trips
        - recent trips
        - popular cities
        - recommended destinations
        - budget highlights
    """

    today = date.today().isoformat()

    # =====================================================
    # UPCOMING TRIPS
    # =====================================================

    upcoming_response = (
        supabase
        .table("trips")
        .select(
            """
            id,
            trip_name,
            cover_photo,
            start_date,
            end_date,
            status,
            visibility,
            estimated_budget
            """
        )
        .eq("user_id", str(user_id))
        .gte("start_date", today)
        .neq("status", "cancelled")
        .order(
            "start_date",
            desc=False
        )
        .limit(5)
        .execute()
    )

    upcoming_trips = (
        upcoming_response.data or []
    )

    # =====================================================
    # RECENT TRIPS
    # =====================================================

    recent_response = (
        supabase
        .table("trips")
        .select(
            """
            id,
            trip_name,
            cover_photo,
            start_date,
            end_date,
            status,
            visibility,
            estimated_budget,
            created_at
            """
        )
        .eq("user_id", str(user_id))
        .order(
            "created_at",
            desc=True
        )
        .limit(5)
        .execute()
    )

    recent_trips = (
        recent_response.data or []
    )

    # =====================================================
    # POPULAR CITIES
    # =====================================================

    popular_response = (
        supabase
        .table("cities")
        .select(
            """
            id,
            city_name,
            country,
            region,
            latitude,
            longitude,
            cost_index,
            avg_hotel_cost,
            avg_food_cost,
            avg_local_transport,
            popularity_score,
            image_url
            """
        )
        .order(
            "popularity_score",
            desc=True
        )
        .limit(8)
        .execute()
    )

    popular_cities = (
        popular_response.data or []
    )

    # =====================================================
    # SAVED DESTINATIONS
    # =====================================================

    saved_response = (
        supabase
        .table("saved_destinations")
        .select(
            """
            city_id,
            cities (
                id,
                city_name,
                country,
                region,
                latitude,
                longitude,
                cost_index,
                avg_hotel_cost,
                avg_food_cost,
                avg_local_transport,
                popularity_score,
                image_url
            )
            """
        )
        .eq("user_id", str(user_id))
        .order(
            "created_at",
            desc=True
        )
        .limit(8)
        .execute()
    )

    saved_destinations = (
        saved_response.data or []
    )

    # =====================================================
    # RECOMMENDATIONS
    # =====================================================

    # For the MVP, recommendations are based on
    # globally popular destinations while excluding
    # already saved destinations.

    saved_city_ids = {
        str(item["city_id"])
        for item in saved_destinations
        if item.get("city_id")
    }

    recommended_destinations = [
        city
        for city in popular_cities
        if str(city["id"]) not in saved_city_ids
    ][:5]

    # =====================================================
    # BUDGET HIGHLIGHTS
    # =====================================================

    budget_highlights = []

    for trip in upcoming_trips:

        budget = float(
            trip.get("estimated_budget") or 0
        )

        budget_highlights.append({
            "trip_id": trip["id"],
            "trip_name": trip["trip_name"],
            "estimated_budget": round(
                budget,
                2
            ),
            "start_date": trip["start_date"],
            "end_date": trip["end_date"]
        })

    # =====================================================
    # SUMMARY
    # =====================================================

    total_upcoming_budget = round(
        sum(
            item["estimated_budget"]
            for item in budget_highlights
        ),
        2
    )

    return {
        "upcoming_trips": upcoming_trips,
        "recent_trips": recent_trips,
        "popular_cities": popular_cities,
        "recommended_destinations": (
            recommended_destinations
        ),
        "budget_highlights": {
            "trips": budget_highlights,
            "total_upcoming_budget": (
                total_upcoming_budget
            )
        }
    }