from config import supabase


SAVED_DESTINATION_FIELDS = """
    id,
    user_id,
    city_id,
    created_at
"""


CITY_FIELDS = """
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


# =========================================================
# SAVE DESTINATION
# =========================================================

def save_destination(user_id, city_id):
    """
    Save a city for the authenticated user.
    """

    # -----------------------------------------------------
    # VERIFY CITY EXISTS
    # -----------------------------------------------------

    city_response = (
        supabase
        .table("cities")
        .select("id")
        .eq("id", str(city_id))
        .maybe_single()
        .execute()
    )

    if not city_response.data:
        return None, "City not found"

    # -----------------------------------------------------
    # DUPLICATE CHECK
    # -----------------------------------------------------

    existing_response = (
        supabase
        .table("saved_destinations")
        .select("id")
        .eq("user_id", str(user_id))
        .eq("city_id", str(city_id))
        .maybe_single()
        .execute()
    )

    if existing_response.data:
        return None, "Destination is already saved"

    # -----------------------------------------------------
    # INSERT
    # -----------------------------------------------------

    try:

        response = (
            supabase
            .table("saved_destinations")
            .insert({
                "user_id": str(user_id),
                "city_id": str(city_id)
            })
            .execute()
        )

    except Exception:
        return None, (
            "Unable to save destination"
        )

    if not response.data:
        return None, (
            "Unable to save destination"
        )

    return response.data[0], None


# =========================================================
# GET SAVED DESTINATIONS
# =========================================================

def get_saved_destinations(user_id):
    """
    Return all saved cities of the authenticated user.
    """

    response = (
        supabase
        .table("saved_destinations")
        .select(
            f"""
            {SAVED_DESTINATION_FIELDS},
            cities (
                {CITY_FIELDS}
            )
            """
        )
        .eq("user_id", str(user_id))
        .order(
            "created_at",
            desc=True
        )
        .execute()
    )

    return response.data or []


# =========================================================
# REMOVE SAVED DESTINATION
# =========================================================

def remove_saved_destination(
    user_id,
    city_id
):
    """
    Remove a saved city from the authenticated user's list.
    """

    existing_response = (
        supabase
        .table("saved_destinations")
        .select("id")
        .eq("user_id", str(user_id))
        .eq("city_id", str(city_id))
        .maybe_single()
        .execute()
    )

    if not existing_response.data:
        return False, "Saved destination not found"

    try:

        response = (
            supabase
            .table("saved_destinations")
            .delete()
            .eq("user_id", str(user_id))
            .eq("city_id", str(city_id))
            .execute()
        )

    except Exception:
        return False, (
            "Unable to remove saved destination"
        )

    if not response.data:
        return False, (
            "Unable to remove saved destination"
        )

    return True, None