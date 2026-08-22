from config import supabase


ITINERARY_FIELDS = """
    id,
    stop_id,
    activity_id,
    activity_date,
    activity_time,
    custom_cost
"""


ACTIVITY_FIELDS = """
    id,
    city_id,
    activity_name,
    category,
    description,
    estimated_cost,
    duration_hours,
    rating,
    image_url
"""


# =========================================================
# HELPERS
# =========================================================

def _get_user_trip(trip_id, user_id):
    """
    Verify that the trip belongs to the authenticated user.
    """

    response = (
        supabase
        .table("trips")
        .select("id, user_id, start_date, end_date")
        .eq("id", str(trip_id))
        .eq("user_id", str(user_id))
        .maybe_single()
        .execute()
    )

    return response.data


def _get_user_stop(stop_id, user_id):
    """
    Get a stop only if its trip belongs to the authenticated user.
    """

    response = (
        supabase
        .table("trip_stops")
        .select(
            """
            id,
            trip_id,
            city_id,
            stop_order,
            arrival_date,
            departure_date,
            notes,
            trips!inner (
                id,
                user_id
            )
            """
        )
        .eq("id", str(stop_id))
        .eq("trips.user_id", str(user_id))
        .maybe_single()
        .execute()
    )

    return response.data


def _get_activity(activity_id):
    """
    Get activity from master activities table.
    """

    response = (
        supabase
        .table("activities")
        .select(
            ACTIVITY_FIELDS
        )
        .eq("id", str(activity_id))
        .maybe_single()
        .execute()
    )

    return response.data


# =========================================================
# ADD ACTIVITY TO STOP
# =========================================================

def add_activity_to_stop(
    stop_id,
    user_id,
    activity_id,
    activity_date=None,
    activity_time=None,
    custom_cost=None
):
    """
    Attach an activity to a trip stop.
    """

    # -----------------------------------------------------
    # VERIFY STOP OWNERSHIP
    # -----------------------------------------------------

    stop = _get_user_stop(
        stop_id,
        user_id
    )

    if not stop:
        return None, "Trip stop not found"

    # -----------------------------------------------------
    # VERIFY ACTIVITY
    # -----------------------------------------------------

    activity = _get_activity(
        activity_id
    )

    if not activity:
        return None, "Activity not found"

    # -----------------------------------------------------
    # ACTIVITY MUST BELONG TO STOP'S CITY
    # -----------------------------------------------------

    if str(activity["city_id"]) != str(stop["city_id"]):
        return None, (
            "Activity does not belong to the selected city"
        )

    # -----------------------------------------------------
    # DATE VALIDATION
    # -----------------------------------------------------

    if activity_date:

        if (
            activity_date < stop["arrival_date"]
            or activity_date > stop["departure_date"]
        ):
            return None, (
                "Activity date must be within "
                "the stop dates"
            )

    # If date is not supplied, use arrival date
    else:
        activity_date = stop["arrival_date"]

    # -----------------------------------------------------
    # CUSTOM COST
    # -----------------------------------------------------

    if custom_cost is not None:

        try:
            custom_cost = float(custom_cost)
        except (TypeError, ValueError):
            return None, "Invalid custom cost"

        if custom_cost < 0:
            return None, (
                "Custom cost cannot be negative"
            )

    # -----------------------------------------------------
    # CHECK DUPLICATE ASSIGNMENT
    # -----------------------------------------------------

    existing_response = (
        supabase
        .table("stop_activities")
        .select("id")
        .eq("stop_id", str(stop_id))
        .eq("activity_id", str(activity_id))
        .eq("activity_date", activity_date)
        .maybe_single()
        .execute()
    )

    if existing_response.data:
        return None, (
            "Activity is already added to this stop"
        )

    # -----------------------------------------------------
    # CREATE STOP ACTIVITY
    # -----------------------------------------------------

    stop_activity_data = {
        "stop_id": str(stop_id),
        "activity_id": str(activity_id),
        "activity_date": activity_date
    }

    if activity_time:
        stop_activity_data["activity_time"] = activity_time

    if custom_cost is not None:
        stop_activity_data["custom_cost"] = custom_cost

    try:

        response = (
            supabase
            .table("stop_activities")
            .insert(stop_activity_data)
            .execute()
        )

    except Exception:
        return None, (
            "Unable to add activity to trip"
        )

    if not response.data:
        return None, (
            "Unable to add activity to trip"
        )

    return response.data[0], None


# =========================================================
# GET ACTIVITIES FOR A STOP
# =========================================================

def get_stop_itinerary(stop_id, user_id):
    """
    Get all activities assigned to a specific stop.
    """

    stop = _get_user_stop(
        stop_id,
        user_id
    )

    if not stop:
        return None, "Trip stop not found"

    response = (
        supabase
        .table("stop_activities")
        .select(
            f"""
            {ITINERARY_FIELDS},
            activities (
                {ACTIVITY_FIELDS}
            )
            """
        )
        .eq("stop_id", str(stop_id))
        .order(
            "activity_date",
            desc=False
        )
        .order(
            "activity_time",
            desc=False
        )
        .execute()
    )

    return {
        "stop": stop,
        "activities": response.data or []
    }, None


# =========================================================
# GET COMPLETE TRIP ITINERARY
# =========================================================

def get_trip_itinerary(trip_id, user_id):
    """
    Get complete itinerary of an owned trip,
    grouped naturally by trip stops.
    """

    trip = _get_user_trip(
        trip_id,
        user_id
    )

    if not trip:
        return None, "Trip not found"

    stops_response = (
        supabase
        .table("trip_stops")
        .select(
            """
            id,
            trip_id,
            city_id,
            stop_order,
            arrival_date,
            departure_date,
            notes,
            cities (
                id,
                city_name,
                country,
                region,
                latitude,
                longitude,
                image_url
            ),
            stop_activities (
                id,
                stop_id,
                activity_id,
                activity_date,
                activity_time,
                custom_cost,
                activities (
                    id,
                    city_id,
                    activity_name,
                    category,
                    description,
                    estimated_cost,
                    duration_hours,
                    rating,
                    image_url
                )
            )
            """
        )
        .eq("trip_id", str(trip_id))
        .order(
            "stop_order",
            desc=False
        )
        .execute()
    )

    return {
        "trip": trip,
        "stops": stops_response.data or []
    }, None


# =========================================================
# UPDATE STOP ACTIVITY
# =========================================================

def update_stop_activity(
    stop_activity_id,
    user_id,
    activity_date=None,
    activity_time=None,
    custom_cost=None
):
    """
    Update an activity already assigned to a stop.
    """

    # -----------------------------------------------------
    # GET CURRENT RECORD
    # -----------------------------------------------------

    current_response = (
        supabase
        .table("stop_activities")
        .select(
            f"""
            {ITINERARY_FIELDS},
            trip_stops!inner (
                trip_id,
                city_id,
                arrival_date,
                departure_date,
                trips!inner (
                    user_id
                )
            )
            """
        )
        .eq(
            "id",
            str(stop_activity_id)
        )
        .eq(
            "trip_stops.trips.user_id",
            str(user_id)
        )
        .maybe_single()
        .execute()
    )

    current = current_response.data

    if not current:
        return None, "Itinerary activity not found"

    stop = current["trip_stops"]

    update_data = {}

    # -----------------------------------------------------
    # DATE
    # -----------------------------------------------------

    final_date = (
        activity_date
        if activity_date is not None
        else current["activity_date"]
    )

    if (
        final_date < stop["arrival_date"]
        or final_date > stop["departure_date"]
    ):
        return None, (
            "Activity date must be within "
            "the stop dates"
        )

    update_data["activity_date"] = final_date

    # -----------------------------------------------------
    # TIME
    # -----------------------------------------------------

    if activity_time is not None:
        update_data["activity_time"] = activity_time

    # -----------------------------------------------------
    # COST
    # -----------------------------------------------------

    if custom_cost is not None:

        try:
            custom_cost = float(custom_cost)
        except (TypeError, ValueError):
            return None, "Invalid custom cost"

        if custom_cost < 0:
            return None, (
                "Custom cost cannot be negative"
            )

        update_data["custom_cost"] = custom_cost

    # -----------------------------------------------------
    # UPDATE
    # -----------------------------------------------------

    try:

        response = (
            supabase
            .table("stop_activities")
            .update(update_data)
            .eq(
                "id",
                str(stop_activity_id)
            )
            .execute()
        )

    except Exception:
        return None, (
            "Unable to update itinerary activity"
        )

    if not response.data:
        return None, (
            "Unable to update itinerary activity"
        )

    return response.data[0], None


# =========================================================
# REMOVE ACTIVITY FROM STOP
# =========================================================

def remove_activity_from_stop(
    stop_activity_id,
    user_id
):
    """
    Remove an activity from a trip stop.
    """

    current_response = (
        supabase
        .table("stop_activities")
        .select(
            """
            id,
            stop_id,
            trip_stops!inner (
                trips!inner (
                    user_id
                )
            )
            """
        )
        .eq(
            "id",
            str(stop_activity_id)
        )
        .eq(
            "trip_stops.trips.user_id",
            str(user_id)
        )
        .maybe_single()
        .execute()
    )

    current = current_response.data

    if not current:
        return False, "Itinerary activity not found"

    try:

        response = (
            supabase
            .table("stop_activities")
            .delete()
            .eq(
                "id",
                str(stop_activity_id)
            )
            .execute()
        )

    except Exception:
        return False, (
            "Unable to remove activity"
        )

    if not response.data:
        return False, (
            "Unable to remove activity"
        )

    return True, None