from config import supabase
from utils.distance import calculate_distance_km


TRANSPORT_FIELDS = """
    id,
    mode_name,
    cost_per_km,
    minimum_cost
"""


def _get_user_trip(trip_id, user_id):
    """
    Verify that the trip belongs to the authenticated user.
    """

    response = (
        supabase
        .table("trips")
        .select(
            "id, user_id"
        )
        .eq("id", str(trip_id))
        .eq("user_id", str(user_id))
        .maybe_single()
        .execute()
    )

    return response.data


def _get_trip_stop(stop_id, trip_id):
    """
    Get a stop belonging to the given trip,
    including its city's coordinates.
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
            cities (
                id,
                city_name,
                latitude,
                longitude
            )
            """
        )
        .eq("id", str(stop_id))
        .eq("trip_id", str(trip_id))
        .maybe_single()
        .execute()
    )

    return response.data


def _get_transport_mode(mode_id):
    """
    Get transport mode from master table.
    """

    response = (
        supabase
        .table("transport_modes")
        .select(TRANSPORT_FIELDS)
        .eq("id", str(mode_id))
        .maybe_single()
        .execute()
    )

    return response.data


def calculate_transport_cost(
    distance_km,
    cost_per_km,
    minimum_cost
):
    """
    Calculate transport cost.

    Formula:
        distance × cost_per_km

    Minimum transport cost is applied when
    calculated cost is below minimum_cost.
    """

    distance_km = float(distance_km)
    cost_per_km = float(cost_per_km)
    minimum_cost = float(minimum_cost)

    calculated_cost = (
        distance_km * cost_per_km
    )

    return round(
        max(calculated_cost, minimum_cost),
        2
    )


# =========================================================
# CREATE TRIP TRANSPORT
# =========================================================

def create_trip_transport(
    trip_id,
    user_id,
    from_stop_id,
    to_stop_id,
    transport_mode_id
):
    """
    Calculate distance between two stops and create
    a trip_transport record.
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
    # GET SOURCE STOP
    # -----------------------------------------------------

    from_stop = _get_trip_stop(
        from_stop_id,
        trip_id
    )

    if not from_stop:
        return None, "Source stop not found"

    # -----------------------------------------------------
    # GET DESTINATION STOP
    # -----------------------------------------------------

    to_stop = _get_trip_stop(
        to_stop_id,
        trip_id
    )

    if not to_stop:
        return None, "Destination stop not found"

    # -----------------------------------------------------
    # SOURCE AND DESTINATION MUST DIFFER
    # -----------------------------------------------------

    if str(from_stop["id"]) == str(to_stop["id"]):
        return None, (
            "Source and destination stops must be different"
        )

    # -----------------------------------------------------
    # GET TRANSPORT MODE
    # -----------------------------------------------------

    transport_mode = _get_transport_mode(
        transport_mode_id
    )

    if not transport_mode:
        return None, "Transport mode not found"

    # -----------------------------------------------------
    # GET COORDINATES
    # -----------------------------------------------------

    from_city = from_stop.get("cities")
    to_city = to_stop.get("cities")

    if not from_city or not to_city:
        return None, (
            "City coordinates are not available"
        )

    # -----------------------------------------------------
    # DISTANCE
    # -----------------------------------------------------

    try:

        distance_km = calculate_distance_km(
            latitude_1=from_city["latitude"],
            longitude_1=from_city["longitude"],
            latitude_2=to_city["latitude"],
            longitude_2=to_city["longitude"]
        )

    except (TypeError, ValueError):
        return None, (
            "Unable to calculate distance"
        )

    # -----------------------------------------------------
    # COST
    # -----------------------------------------------------

    estimated_cost = calculate_transport_cost(
        distance_km=distance_km,
        cost_per_km=transport_mode["cost_per_km"],
        minimum_cost=transport_mode["minimum_cost"]
    )

    # -----------------------------------------------------
    # CREATE RECORD
    # -----------------------------------------------------

    transport_data = {
        "trip_id": str(trip_id),
        "from_stop": str(from_stop_id),
        "to_stop": str(to_stop_id),
        "transport_mode_id": str(transport_mode_id),
        "distance_km": distance_km,
        "estimated_cost": estimated_cost
    }

    try:

        response = (
            supabase
            .table("trip_transport")
            .insert(transport_data)
            .execute()
        )

    except Exception:
        return None, (
            "Unable to create transport record"
        )

    if not response.data:
        return None, (
            "Unable to create transport record"
        )

    return response.data[0], None


# =========================================================
# GET TRANSPORT MODES
# =========================================================

def get_transport_modes():
    """
    Return all available transport modes.
    """

    response = (
        supabase
        .table("transport_modes")
        .select(TRANSPORT_FIELDS)
        .order(
            "mode_name",
            desc=False
        )
        .execute()
    )

    return response.data or []


# =========================================================
# GET TRIP TRANSPORT
# =========================================================

def get_trip_transport(
    trip_id,
    user_id
):
    """
    Return all transport segments of a user's trip.
    """

    trip = _get_user_trip(
        trip_id,
        user_id
    )

    if not trip:
        return None, "Trip not found"

    response = (
        supabase
        .table("trip_transport")
        .select(
            """
            id,
            trip_id,
            from_stop,
            to_stop,
            transport_mode_id,
            distance_km,
            estimated_cost,
            transport_modes (
                id,
                mode_name,
                cost_per_km,
                minimum_cost
            )
            """
        )
        .eq(
            "trip_id",
            str(trip_id)
        )
        .order(
            "distance_km",
            desc=False
        )
        .execute()
    )

    return response.data or [], None