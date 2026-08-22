from collections import defaultdict
from datetime import date, timedelta

from config import supabase


# =========================================================
# FIELD DEFINITIONS
# =========================================================

STOP_FIELDS = "id,trip_id,city_id,stop_order,arrival_date,departure_date,notes"
ACTIVITY_FIELDS = "id,city_id,activity_name,category,description,estimated_cost,duration_hours,rating,image_url"


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
        .select("id,user_id,trip_name,description,cover_photo,start_date,end_date,status,visibility,estimated_budget")
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
        .select("id,trip_id,city_id,stop_order,arrival_date,departure_date,notes,trips!inner(id,user_id),cities(id,city_name,country,region,latitude,longitude,image_url)")
        .eq("id", str(stop_id))
        .eq("trips.user_id", str(user_id))
        .maybe_single()
        .execute()
    )


    return response.data


def _get_activity(activity_id):
    """
    Get an activity from the master activities table.
    """

    response = (
        supabase
        .table("activities")
        .select(ACTIVITY_FIELDS)
        .eq("id", str(activity_id))
        .maybe_single()
        .execute()
    )

    return response.data


def _parse_date(value):
    """
    Convert ISO date string to date object.
    """

    if isinstance(value, date):
        return value

    return date.fromisoformat(str(value))


def _generate_trip_dates(start_date, end_date):
    """
    Generate every date between trip start and end,
    inclusive.
    """

    start = _parse_date(start_date)
    end = _parse_date(end_date)

    current = start
    dates = []

    while current <= end:
        dates.append(current.isoformat())
        current += timedelta(days=1)

    return dates


def _sort_activities(activities):
    """
    Sort activities by date and time.

    Activities without a time are placed after
    timed activities on the same day.
    """

    def sort_key(item):
        activity_date = item.get("activity_date") or "9999-12-31"
        activity_time = item.get("activity_time") or "23:59:59"

        return (
            activity_date,
            activity_time
        )

    return sorted(
        activities,
        key=sort_key
    )


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

    stop = _get_user_stop(
        stop_id,
        user_id
    )

    if not stop:
        return None, "Trip stop not found"

    activity = _get_activity(
        activity_id
    )

    if not activity:
        return None, "Activity not found"

    # Activity must belong to the same city as the stop.
    if str(activity["city_id"]) != str(stop["city_id"]):
        return None, (
            "Activity does not belong to the selected city"
        )

    # Default activity date = stop arrival date.
    if not activity_date:
        activity_date = stop["arrival_date"]

    # Activity date must be inside stop dates.
    try:
        activity_date_obj = _parse_date(activity_date)
        arrival_date_obj = _parse_date(stop["arrival_date"])
        departure_date_obj = _parse_date(stop["departure_date"])
    except (TypeError, ValueError):
        return None, "Invalid activity date"

    if (
        activity_date_obj < arrival_date_obj
        or activity_date_obj > departure_date_obj
    ):
        return None, (
            "Activity date must be within the stop dates"
        )

    # Custom cost validation.
    if custom_cost is not None:
        try:
            custom_cost = float(custom_cost)
        except (TypeError, ValueError):
            return None, "Invalid custom cost"

        if custom_cost < 0:
            return None, (
                "Custom cost cannot be negative"
            )

    # Prevent exact duplicate assignment.
    existing_response = (
        supabase
        .table("stop_activities")
        .select("id")
        .eq("stop_id", str(stop_id))
        .eq("activity_id", str(activity_id))
        .eq("activity_date", activity_date_obj.isoformat())
        .maybe_single()
        .execute()
    )

    if existing_response.data:
        return None, (
            "Activity is already added to this stop"
        )

    stop_activity_data = {
        "stop_id": str(stop_id),
        "activity_id": str(activity_id),
        "activity_date": activity_date_obj.isoformat()
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
            """
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
            """
        )
        .eq("stop_id", str(stop_id))
        .order("activity_date", desc=False)
        .order("activity_time", desc=False)
        .execute()
    )

    activities = _sort_activities(
        response.data or []
    )

    return {
        "stop": stop,
        "activities": activities
    }, None


# =========================================================
# GET COMPLETE TRIP ITINERARY
# =========================================================

def get_trip_itinerary(trip_id, user_id):
    """
    Get complete itinerary of an owned trip.
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
        .order("stop_order", desc=False)
        .execute()
    )

    stops = response.data or []

    for stop in stops:
        stop["stop_activities"] = _sort_activities(
            stop.get("stop_activities") or []
        )

    return {
        "trip": trip,
        "stops": stops
    }, None


# =========================================================
# DAY-WISE ITINERARY
# =========================================================

def get_day_wise_itinerary(trip_id, user_id):
    """
    Return the entire trip grouped by calendar day.

    Every trip date is included, even when no activity
    has been assigned to that day.
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
        .order("stop_order", desc=False)
        .execute()
    )

    stops = response.data or []

    # -----------------------------------------------------
    # CREATE DAY MAP
    # -----------------------------------------------------

    day_map = {}

    trip_dates = _generate_trip_dates(
        trip["start_date"],
        trip["end_date"]
    )

    for index, current_date in enumerate(trip_dates, start=1):

        day_map[current_date] = {
            "day": index,
            "date": current_date,
            "cities": [],
            "activities": []
        }

    # -----------------------------------------------------
    # ASSIGN STOPS TO DATES
    # -----------------------------------------------------

    for stop in stops:

        city = stop.get("cities")

        arrival_date = _parse_date(
            stop["arrival_date"]
        )

        departure_date = _parse_date(
            stop["departure_date"]
        )

        current_date = arrival_date

        while current_date <= departure_date:

            date_key = current_date.isoformat()

            if date_key in day_map:

                if city:
                    city_entry = {
                        "stop_id": stop["id"],
                        "city": city,
                        "arrival_date": stop["arrival_date"],
                        "departure_date": stop["departure_date"]
                    }

                    # Avoid adding identical stop repeatedly.
                    if not any(
                        item["stop_id"] == stop["id"]
                        for item in day_map[date_key]["cities"]
                    ):
                        day_map[date_key]["cities"].append(
                            city_entry
                        )

            current_date += timedelta(days=1)

    # -----------------------------------------------------
    # ASSIGN ACTIVITIES TO DAYS
    # -----------------------------------------------------

    for stop in stops:

        city = stop.get("cities")

        for itinerary_activity in (
            stop.get("stop_activities") or []
        ):

            activity_date = (
                itinerary_activity.get("activity_date")
            )

            if not activity_date:
                continue

            if activity_date not in day_map:
                continue

            activity = (
                itinerary_activity.get("activities")
            )

            activity_entry = {
                "id": itinerary_activity["id"],
                "stop_id": itinerary_activity["stop_id"],
                "activity_id": itinerary_activity["activity_id"],
                "activity_date": activity_date,
                "activity_time": itinerary_activity.get(
                    "activity_time"
                ),
                "custom_cost": itinerary_activity.get(
                    "custom_cost"
                ),
                "city": city,
                "activity": activity
            }

            day_map[activity_date]["activities"].append(
                activity_entry
            )

    # -----------------------------------------------------
    # SORT ACTIVITIES
    # -----------------------------------------------------

    for day_data in day_map.values():
        day_data["activities"] = _sort_activities(
            day_data["activities"]
        )

    return {
        "trip": trip,
        "days": list(day_map.values())
    }, None


# =========================================================
# CALENDAR VIEW
# =========================================================

def get_calendar_view(trip_id, user_id):
    """
    Return calendar-friendly events.

    Each activity becomes one calendar event.
    """

    day_result, error = get_day_wise_itinerary(
        trip_id,
        user_id
    )

    if error:
        return None, error

    events = []

    for day in day_result["days"]:

        for activity_entry in day["activities"]:

            activity = activity_entry.get(
                "activity"
            )

            city = activity_entry.get(
                "city"
            )

            events.append({
                "id": activity_entry["id"],
                "date": activity_entry["activity_date"],
                "time": activity_entry["activity_time"],
                "title": (
                    activity["activity_name"]
                    if activity
                    else "Activity"
                ),
                "category": (
                    activity["category"]
                    if activity
                    else None
                ),
                "duration_hours": (
                    activity["duration_hours"]
                    if activity
                    else None
                ),
                "cost": (
                    activity_entry["custom_cost"]
                    if activity_entry["custom_cost"]
                    is not None
                    else (
                        activity["estimated_cost"]
                        if activity
                        else 0
                    )
                ),
                "city": city
            })

    events.sort(
        key=lambda event: (
            event["date"],
            event["time"] or "23:59:59"
        )
    )

    return {
        "trip": day_result["trip"],
        "events": events
    }, None


# =========================================================
# TIMELINE VIEW
# =========================================================

def get_timeline_view(trip_id, user_id):
    """
    Return chronological timeline for the complete trip.
    """

    day_result, error = get_day_wise_itinerary(
        trip_id,
        user_id
    )

    if error:
        return None, error

    timeline = []

    for day in day_result["days"]:

        for activity_entry in day["activities"]:

            activity = activity_entry.get(
                "activity"
            )

            city = activity_entry.get(
                "city"
            )

            timeline.append({
                "id": activity_entry["id"],
                "day": day["day"],
                "date": activity_entry["date"],
                "time": activity_entry["activity_time"],
                "city": city,
                "activity": activity,
                "cost": (
                    activity_entry["custom_cost"]
                    if activity_entry["custom_cost"]
                    is not None
                    else (
                        activity["estimated_cost"]
                        if activity
                        else 0
                    )
                )
            })

    timeline.sort(
        key=lambda item: (
            item["date"],
            item["time"] or "23:59:59"
        )
    )

    return {
        "trip": day_result["trip"],
        "timeline": timeline
    }, None


# =========================================================
# UPDATE ITINERARY ACTIVITY
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

    current_response = (
        supabase
        .table("stop_activities")
        .select(
            """
            id,
            stop_id,
            activity_id,
            activity_date,
            activity_time,
            custom_cost,
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
        .eq("id", str(stop_activity_id))
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

    final_date = (
        activity_date
        if activity_date is not None
        else current["activity_date"]
    )

    try:
        final_date_obj = _parse_date(final_date)
        arrival_date_obj = _parse_date(
            stop["arrival_date"]
        )
        departure_date_obj = _parse_date(
            stop["departure_date"]
        )
    except (TypeError, ValueError):
        return None, "Invalid activity date"

    if (
        final_date_obj < arrival_date_obj
        or final_date_obj > departure_date_obj
    ):
        return None, (
            "Activity date must be within the stop dates"
        )

    update_data = {
        "activity_date": final_date_obj.isoformat()
    }

    if activity_time is not None:
        update_data["activity_time"] = activity_time

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

    try:
        response = (
            supabase
            .table("stop_activities")
            .update(update_data)
            .eq("id", str(stop_activity_id))
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
# REMOVE ACTIVITY
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
        .eq("id", str(stop_activity_id))
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
            .eq("id", str(stop_activity_id))
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