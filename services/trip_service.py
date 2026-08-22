from datetime import date

from config import supabase


TRIP_FIELDS = """
    id,
    user_id,
    trip_name,
    description,
    cover_photo,
    start_date,
    end_date,
    status,
    visibility,
    estimated_budget,
    created_at,
    updated_at
"""


STOP_FIELDS = """
    id,
    trip_id,
    city_id,
    stop_order,
    arrival_date,
    departure_date,
    notes
"""


# =========================================================
# HELPERS
# =========================================================

def _validate_date_range(start_date, end_date):
    """
    Validate trip date range.
    """

    try:
        start = date.fromisoformat(start_date)
        end = date.fromisoformat(end_date)
    except (TypeError, ValueError):
        return None, None

    if start > end:
        return None, None

    return start, end


def _get_user_trip(trip_id, user_id):
    """
    Return a trip only if it belongs to the authenticated user.
    """

    response = (
        supabase
        .table("trips")
        .select(TRIP_FIELDS)
        .eq("id", str(trip_id))
        .eq("user_id", str(user_id))
        .maybe_single()
        .execute()
    )

    return response.data


def _get_user_stop(stop_id, user_id):
    """
    Return a stop only if it belongs to a trip
    owned by the authenticated user.
    """

    response = (
        supabase
        .table("trip_stops")
        .select(
            f"""
            {STOP_FIELDS},
            trips!inner(user_id)
            """
        )
        .eq("id", str(stop_id))
        .eq("trips.user_id", str(user_id))
        .maybe_single()
        .execute()
    )

    return response.data


# =========================================================
# CREATE TRIP
# =========================================================

def create_trip(
    user_id,
    trip_name,
    start_date,
    end_date,
    description=None,
    cover_photo=None
):
    """
    Create a new trip.

    New trips always start as:
        status = planning
        visibility = private
        estimated_budget = 0
    """

    trip_name = str(trip_name or "").strip()
    description = (
        str(description).strip()
        if description
        else None
    )
    cover_photo = (
        str(cover_photo).strip()
        if cover_photo
        else None
    )

    if not trip_name:
        return None, "Trip name is required"

    if len(trip_name) > 150:
        return None, "Trip name must not exceed 150 characters"

    start, end = _validate_date_range(
        start_date,
        end_date
    )

    if not start or not end:
        return None, "Invalid trip dates"

    trip_data = {
        "user_id": str(user_id),
        "trip_name": trip_name,
        "description": description,
        "cover_photo": cover_photo,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "status": "planning",
        "visibility": "private",
        "estimated_budget": 0
    }

    try:
        response = (
            supabase
            .table("trips")
            .insert(trip_data)
            .execute()
        )

    except Exception:
        return None, "Unable to create trip"

    if not response.data:
        return None, "Unable to create trip"

    return response.data[0], None


# =========================================================
# GET USER TRIPS
# =========================================================

def get_user_trips(user_id, limit=20, offset=0):
    """
    Return trips belonging to authenticated user.
    """

    limit = min(max(int(limit), 1), 100)
    offset = max(int(offset), 0)

    response = (
        supabase
        .table("trips")
        .select(
            TRIP_FIELDS,
            count="exact"
        )
        .eq("user_id", str(user_id))
        .order(
            "start_date",
            desc=False
        )
        .range(
            offset,
            offset + limit - 1
        )
        .execute()
    )

    return {
        "trips": response.data or [],
        "total": response.count or 0,
        "limit": limit,
        "offset": offset
    }


# =========================================================
# GET TRIP DETAILS
# =========================================================

def get_trip_details(trip_id, user_id):
    """
    Return trip details with its stops.
    """

    trip = _get_user_trip(
        trip_id,
        user_id
    )

    if not trip:
        return None

    stops_response = (
        supabase
        .table("trip_stops")
        .select(
            f"""
            {STOP_FIELDS},
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
    }


# =========================================================
# UPDATE TRIP
# =========================================================

def update_trip(
    trip_id,
    user_id,
    trip_name=None,
    start_date=None,
    end_date=None,
    description=None,
    cover_photo=None,
    status=None,
    visibility=None
):
    """
    Update a trip owned by the authenticated user.
    """

    trip = _get_user_trip(
        trip_id,
        user_id
    )

    if not trip:
        return None, "Trip not found"

    update_data = {}

    # -----------------------------------------------------
    # TRIP NAME
    # -----------------------------------------------------

    if trip_name is not None:

        trip_name = str(
            trip_name
        ).strip()

        if not trip_name:
            return None, "Trip name cannot be empty"

        if len(trip_name) > 150:
            return None, "Trip name must not exceed 150 characters"

        update_data["trip_name"] = trip_name

    # -----------------------------------------------------
    # DATES
    # -----------------------------------------------------

    final_start_date = (
        start_date
        if start_date is not None
        else trip["start_date"]
    )

    final_end_date = (
        end_date
        if end_date is not None
        else trip["end_date"]
    )

    start, end = _validate_date_range(
        final_start_date,
        final_end_date
    )

    if not start or not end:
        return None, "Invalid trip dates"

    update_data["start_date"] = start.isoformat()
    update_data["end_date"] = end.isoformat()

    # -----------------------------------------------------
    # OPTIONAL FIELDS
    # -----------------------------------------------------

    if description is not None:
        update_data["description"] = (
            str(description).strip()
            or None
        )

    if cover_photo is not None:
        update_data["cover_photo"] = (
            str(cover_photo).strip()
            or None
        )

    if status is not None:

        allowed_statuses = {
            "planning",
            "completed",
            "cancelled"
        }

        status = str(status).lower()

        if status not in allowed_statuses:
            return None, "Invalid trip status"

        update_data["status"] = status

    if visibility is not None:

        allowed_visibility = {
            "private",
            "friends",
            "public"
        }

        visibility = str(visibility).lower()

        if visibility not in allowed_visibility:
            return None, "Invalid trip visibility"

        update_data["visibility"] = visibility

    # -----------------------------------------------------
    # UPDATE
    # -----------------------------------------------------

    try:
        response = (
            supabase
            .table("trips")
            .update(update_data)
            .eq("id", str(trip_id))
            .eq("user_id", str(user_id))
            .execute()
        )

    except Exception:
        return None, "Unable to update trip"

    if not response.data:
        return None, "Unable to update trip"

    return response.data[0], None


# =========================================================
# DELETE TRIP
# =========================================================

def delete_trip(trip_id, user_id):
    """
    Delete a trip owned by the authenticated user.

    Related records should be removed by database
    ON DELETE CASCADE constraints.
    """

    trip = _get_user_trip(
        trip_id,
        user_id
    )

    if not trip:
        return False, "Trip not found"

    try:
        response = (
            supabase
            .table("trips")
            .delete()
            .eq("id", str(trip_id))
            .eq("user_id", str(user_id))
            .execute()
        )

    except Exception:
        return False, "Unable to delete trip"

    if not response.data:
        return False, "Unable to delete trip"

    return True, None


# =========================================================
# ADD STOP TO TRIP
# =========================================================

def add_trip_stop(
    trip_id,
    user_id,
    city_id,
    arrival_date,
    departure_date,
    notes=None,
    stop_order=None
):
    """
    Add a city as a stop in a user's trip.
    """

    # -----------------------------------------------------
    # VERIFY TRIP OWNERSHIP
    # -----------------------------------------------------

    trip = _get_user_trip(
        trip_id,
        user_id
    )

    if not trip:
        return None, "Trip not found"

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
    # VALIDATE STOP DATES
    # -----------------------------------------------------

    arrival, departure = _validate_date_range(
        arrival_date,
        departure_date
    )

    if not arrival or not departure:
        return None, "Invalid stop dates"

    trip_start = date.fromisoformat(
        trip["start_date"]
    )

    trip_end = date.fromisoformat(
        trip["end_date"]
    )

    if arrival < trip_start:
        return None, "Arrival date cannot be before trip start date"

    if departure > trip_end:
        return None, "Departure date cannot be after trip end date"

    # -----------------------------------------------------
    # STOP ORDER
    # -----------------------------------------------------

    if stop_order is None:

        last_stop_response = (
            supabase
            .table("trip_stops")
            .select("stop_order")
            .eq("trip_id", str(trip_id))
            .order(
                "stop_order",
                desc=True
            )
            .limit(1)
            .execute()
        )

        if last_stop_response.data:
            stop_order = (
                last_stop_response.data[0]["stop_order"]
                + 1
            )
        else:
            stop_order = 1

    else:

        try:
            stop_order = int(stop_order)
        except (TypeError, ValueError):
            return None, "Invalid stop order"

        if stop_order < 1:
            return None, "Stop order must start from 1"

    # -----------------------------------------------------
    # CREATE STOP
    # -----------------------------------------------------

    stop_data = {
        "trip_id": str(trip_id),
        "city_id": str(city_id),
        "stop_order": stop_order,
        "arrival_date": arrival.isoformat(),
        "departure_date": departure.isoformat(),
        "notes": (
            str(notes).strip()
            if notes
            else None
        )
    }

    try:

        response = (
            supabase
            .table("trip_stops")
            .insert(stop_data)
            .execute()
        )

    except Exception:
        return None, "Unable to add trip stop"

    if not response.data:
        return None, "Unable to add trip stop"

    return response.data[0], None


# =========================================================
# GET TRIP STOPS
# =========================================================

def get_trip_stops(trip_id, user_id):
    """
    Return all stops of an owned trip.
    """

    trip = _get_user_trip(
        trip_id,
        user_id
    )

    if not trip:
        return None, "Trip not found"

    response = (
        supabase
        .table("trip_stops")
        .select(
            f"""
            {STOP_FIELDS},
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
        .eq("trip_id", str(trip_id))
        .order(
            "stop_order",
            desc=False
        )
        .execute()
    )

    return response.data or [], None


# =========================================================
# UPDATE STOP
# =========================================================

def update_trip_stop(
    stop_id,
    user_id,
    arrival_date=None,
    departure_date=None,
    notes=None,
    stop_order=None
):
    """
    Update a stop belonging to the authenticated user's trip.
    """

    stop = _get_user_stop(
        stop_id,
        user_id
    )

    if not stop:
        return None, "Trip stop not found"

    trip_response = (
        supabase
        .table("trips")
        .select(
            "id, start_date, end_date"
        )
        .eq(
            "id",
            stop["trip_id"]
        )
        .maybe_single()
        .execute()
    )

    trip = trip_response.data

    if not trip:
        return None, "Trip not found"

    final_arrival = (
        arrival_date
        if arrival_date is not None
        else stop["arrival_date"]
    )

    final_departure = (
        departure_date
        if departure_date is not None
        else stop["departure_date"]
    )

    arrival, departure = _validate_date_range(
        final_arrival,
        final_departure
    )

    if not arrival or not departure:
        return None, "Invalid stop dates"

    trip_start = date.fromisoformat(
        trip["start_date"]
    )

    trip_end = date.fromisoformat(
        trip["end_date"]
    )

    if arrival < trip_start:
        return None, "Arrival date cannot be before trip start date"

    if departure > trip_end:
        return None, "Departure date cannot be after trip end date"

    update_data = {
        "arrival_date": arrival.isoformat(),
        "departure_date": departure.isoformat()
    }

    if notes is not None:
        update_data["notes"] = (
            str(notes).strip()
            or None
        )

    if stop_order is not None:

        try:
            stop_order = int(stop_order)
        except (TypeError, ValueError):
            return None, "Invalid stop order"

        if stop_order < 1:
            return None, "Stop order must start from 1"

        update_data["stop_order"] = stop_order

    try:

        response = (
            supabase
            .table("trip_stops")
            .update(update_data)
            .eq("id", str(stop_id))
            .execute()
        )

    except Exception:
        return None, "Unable to update trip stop"

    if not response.data:
        return None, "Unable to update trip stop"

    return response.data[0], None


# =========================================================
# DELETE STOP
# =========================================================

def delete_trip_stop(stop_id, user_id):
    """
    Delete a stop belonging to the authenticated user's trip.
    """

    stop = _get_user_stop(
        stop_id,
        user_id
    )

    if not stop:
        return False, "Trip stop not found"

    try:

        response = (
            supabase
            .table("trip_stops")
            .delete()
            .eq("id", str(stop_id))
            .execute()
        )

    except Exception:
        return False, "Unable to delete trip stop"

    if not response.data:
        return False, "Unable to delete trip stop"

    return True, None