from config import supabase
from services.gemini_service import (
    generate_raw_travel_data,
    normalize_city_data,
    normalize_activities
)


# =========================================================
# CITY + ACTIVITY INGESTION
# =========================================================

def ingest_city_data(
    city_name,
    country,
    activity_limit=10
):
    """
    Fetch raw travel data from Gemini, normalize it,
    then safely insert/update city and activities.

    Gemini is used only as a raw data provider.
    """

    city_name = str(city_name or "").strip()
    country = str(country or "").strip()

    if not city_name:
        return None, "City name is required"

    if not country:
        return None, "Country is required"

    # =====================================================
    # 1. GET RAW DATA FROM GEMINI
    # =====================================================

    try:
        raw_data = generate_raw_travel_data(
            city_name=city_name,
            country=country,
            activity_limit=activity_limit
        )

    except Exception as exc:
        return None, str(exc)

    if not isinstance(raw_data, dict):
        return None, "Invalid Gemini response"

    # =====================================================
    # 2. NORMALIZE CITY
    # =====================================================

    try:
        city_data = normalize_city_data(
            raw_data=raw_data,
            city_name=city_name,
            country=country
        )

    except (TypeError, ValueError) as exc:
        return None, str(exc)

    # =====================================================
    # 3. CHECK EXISTING CITY
    # =====================================================

    try:
        existing_response = (
            supabase
            .table("cities")
            .select("id")
            .eq(
                "city_name",
                city_name
            )
            .eq(
                "country",
                country
            )
            .maybe_single()
            .execute()
        )

    except Exception:
        return None, (
            "Unable to check existing city"
        )

    existing_city = existing_response.data

    # =====================================================
    # 4. INSERT OR UPDATE CITY
    # =====================================================

    try:

        if existing_city:

            city_id = existing_city["id"]

            city_response = (
                supabase
                .table("cities")
                .update(city_data)
                .eq(
                    "id",
                    city_id
                )
                .execute()
            )

            if not city_response.data:
                return None, (
                    "Unable to update city"
                )

            city = city_response.data[0]

        else:

            city_response = (
                supabase
                .table("cities")
                .insert(city_data)
                .execute()
            )

            if not city_response.data:
                return None, (
                    "Unable to insert city"
                )

            city = city_response.data[0]
            city_id = city["id"]

    except Exception:
        return None, (
            "Unable to save city data"
        )

    # =====================================================
    # 5. NORMALIZE ACTIVITIES
    # =====================================================

    try:

        activities = normalize_activities(
            raw_data=raw_data,
            city_id=city_id
        )

    except (TypeError, ValueError) as exc:
        return None, str(exc)

    # =====================================================
    # 6. INSERT ACTIVITIES WITHOUT DUPLICATES
    # =====================================================

    inserted_activities = []
    skipped_activities = []

    for activity in activities:

        activity_name = activity[
            "activity_name"
        ]

        try:

            existing_activity_response = (
                supabase
                .table("activities")
                .select("id")
                .eq(
                    "city_id",
                    str(city_id)
                )
                .eq(
                    "activity_name",
                    activity_name
                )
                .maybe_single()
                .execute()
            )

        except Exception:
            return None, (
                "Unable to check existing activity"
            )

        if existing_activity_response.data:

            skipped_activities.append(
                activity_name
            )

            continue

        try:

            activity_response = (
                supabase
                .table("activities")
                .insert(activity)
                .execute()
            )

        except Exception:
            return None, (
                f"Unable to insert activity: "
                f"{activity_name}"
            )

        if activity_response.data:
            inserted_activities.append(
                activity_response.data[0]
            )

    # =====================================================
    # 7. RESULT
    # =====================================================

    return {
        "city": city,
        "activities_inserted": inserted_activities,
        "activities_skipped": skipped_activities,
        "activity_count": len(
            inserted_activities
        ),
        "skipped_count": len(
            skipped_activities
        )
    }, None