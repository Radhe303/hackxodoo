import secrets
from datetime import datetime, timezone

from config import supabase


TRIP_FIELDS = "id,user_id,trip_name,description,cover_photo,start_date,end_date,status,visibility,estimated_budget"



# =========================================================
# HELPERS
# =========================================================

def _get_user_trip(trip_id, user_id):
    """
    Return trip only if it belongs to authenticated user.
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


# =========================================================
# CREATE SHARE LINK
# =========================================================

def create_share_link(
    trip_id,
    user_id,
    visibility="public",
    expires_at=None
):
    """
    Create a shareable public link for a trip.
    """

    trip = _get_user_trip(
        trip_id,
        user_id
    )

    if not trip:
        return None, "Trip not found"

    visibility = str(
        visibility or "public"
    ).lower()

    if visibility not in {
        "public",
        "friends"
    }:
        return None, "Invalid share visibility"

    # -----------------------------------------------------
    # PUBLIC SHARING
    # -----------------------------------------------------

    if visibility == "public":

        share_token = secrets.token_urlsafe(32)

        share_data = {
            "trip_id": str(trip_id),
            "share_token": share_token,
            "visibility": "public"
        }

        if expires_at:
            share_data["expires_at"] = expires_at

        try:
            response = (
                supabase
                .table("shared_trips")
                .insert(share_data)
                .execute()
            )

        except Exception:
            return None, (
                "Unable to create share link"
            )

        if not response.data:
            return None, (
                "Unable to create share link"
            )

        # Synchronize trip visibility.
        try:
            (
                supabase
                .table("trips")
                .update({
                    "visibility": "public"
                })
                .eq("id", str(trip_id))
                .eq("user_id", str(user_id))
                .execute()
            )
        except Exception:
            pass

        return response.data[0], None

    return None, (
        "Friends sharing is not implemented yet"
    )


# =========================================================
# GET SHARED TRIP
# =========================================================

def get_shared_trip(share_token):
    """
    Fetch a shared trip using public share token.

    No authentication required.
    """

    response = (
        supabase
        .table("shared_trips")
        .select(
            """
            id,
            trip_id,
            share_token,
            visibility,
            expires_at,
            created_at,
            trips (
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
                trip_stops (
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
                )
            )
            """
        )
        .eq(
            "share_token",
            share_token
        )
        .maybe_single()
        .execute()
    )

    shared_trip = response.data

    if not shared_trip:
        return None, "Shared trip not found"

    # -----------------------------------------------------
    # CHECK EXPIRY
    # -----------------------------------------------------

    expires_at = shared_trip.get(
        "expires_at"
    )

    if expires_at:

        try:
            expiry = datetime.fromisoformat(
                expires_at.replace(
                    "Z",
                    "+00:00"
                )
            )

            if expiry < datetime.now(timezone.utc):
                return None, "Share link has expired"

        except (TypeError, ValueError):
            return None, (
                "Invalid share expiration"
            )

    trip = shared_trip.get("trips")

    if not trip:
        return None, "Trip not found"

    # -----------------------------------------------------
    # READ-ONLY PUBLIC DATA
    # -----------------------------------------------------

    stops = trip.get(
        "trip_stops"
    ) or []

    stops.sort(
        key=lambda item: item.get(
            "stop_order",
            0
        )
    )

    for stop in stops:

        activities = (
            stop.get("stop_activities")
            or []
        )

        activities.sort(
            key=lambda item: (
                item.get("activity_date")
                or "9999-12-31",
                item.get("activity_time")
                or "23:59:59"
            )
        )

    trip["trip_stops"] = stops

    # Never expose owner's user_id.
    trip.pop(
        "user_id",
        None
    )

    shared_trip["trips"] = trip

    return shared_trip, None


# =========================================================
# DELETE SHARE LINK
# =========================================================

def delete_share_link(
    share_id,
    user_id
):
    """
    Delete a share link owned by authenticated user.
    """

    response = (
        supabase
        .table("shared_trips")
        .select(
            """
            id,
            trip_id,
            trips!inner (
                user_id
            )
            """
        )
        .eq("id", str(share_id))
        .eq(
            "trips.user_id",
            str(user_id)
        )
        .maybe_single()
        .execute()
    )

    share = response.data

    if not share:
        return False, "Share link not found"

    try:
        delete_response = (
            supabase
            .table("shared_trips")
            .delete()
            .eq("id", str(share_id))
            .execute()
        )

    except Exception:
        return False, (
            "Unable to delete share link"
        )

    if not delete_response.data:
        return False, (
            "Unable to delete share link"
        )

    return True, None


# =========================================================
# COPY SHARED TRIP
# =========================================================

def copy_shared_trip(
    share_token,
    user_id
):
    """
    Copy a public shared trip into the authenticated
    user's own account.

    Original trip remains unchanged.
    """

    # -----------------------------------------------------
    # GET SHARED TRIP
    # -----------------------------------------------------

    shared_response = (
        supabase
        .table("shared_trips")
        .select(
            """
            id,
            trip_id,
            share_token,
            visibility,
            expires_at
            """
        )
        .eq(
            "share_token",
            share_token
        )
        .maybe_single()
        .execute()
    )

    shared_trip = shared_response.data

    if not shared_trip:
        return None, "Shared trip not found"

    # -----------------------------------------------------
    # ONLY PUBLIC TRIPS CAN BE COPIED
    # -----------------------------------------------------

    if shared_trip["visibility"] != "public":
        return None, (
            "This trip is not publicly shareable"
        )

    # -----------------------------------------------------
    # EXPIRY
    # -----------------------------------------------------

    expires_at = shared_trip.get(
        "expires_at"
    )

    if expires_at:

        try:
            expiry = datetime.fromisoformat(
                expires_at.replace(
                    "Z",
                    "+00:00"
                )
            )

            if expiry < datetime.now(timezone.utc):
                return None, "Share link has expired"

        except (TypeError, ValueError):
            return None, (
                "Invalid share expiration"
            )

    original_trip_id = shared_trip[
        "trip_id"
    ]

    # -----------------------------------------------------
    # GET ORIGINAL TRIP
    # -----------------------------------------------------

    trip_response = (
        supabase
        .table("trips")
        .select(
            """
            id,
            trip_name,
            description,
            cover_photo,
            start_date,
            end_date
            """
        )
        .eq(
            "id",
            str(original_trip_id)
        )
        .maybe_single()
        .execute()
    )

    original_trip = trip_response.data

    if not original_trip:
        return None, "Original trip not found"

    # -----------------------------------------------------
    # GET ORIGINAL STOPS
    # -----------------------------------------------------

    stops_response = (
        supabase
        .table("trip_stops")
        .select(
            """
            id,
            city_id,
            stop_order,
            arrival_date,
            departure_date,
            notes
            """
        )
        .eq(
            "trip_id",
            str(original_trip_id)
        )
        .order(
            "stop_order",
            desc=False
        )
        .execute()
    )

    original_stops = (
        stops_response.data or []
    )

    # -----------------------------------------------------
    # CREATE NEW TRIP
    # -----------------------------------------------------

    new_trip_data = {
        "user_id": str(user_id),
        "trip_name": (
            f"Copy of {original_trip['trip_name']}"
        ),
        "description": original_trip.get(
            "description"
        ),
        "cover_photo": original_trip.get(
            "cover_photo"
        ),
        "start_date": original_trip[
            "start_date"
        ],
        "end_date": original_trip[
            "end_date"
        ],
        "status": "planning",
        "visibility": "private",
        "estimated_budget": 0
    }

    try:
        new_trip_response = (
            supabase
            .table("trips")
            .insert(new_trip_data)
            .execute()
        )

    except Exception:
        return None, "Unable to copy trip"

    if not new_trip_response.data:
        return None, "Unable to copy trip"

    new_trip = new_trip_response.data[0]

    # -----------------------------------------------------
    # COPY STOPS
    # -----------------------------------------------------

    stop_id_map = {}

    for original_stop in original_stops:

        new_stop_data = {
            "trip_id": new_trip["id"],
            "city_id": original_stop["city_id"],
            "stop_order": original_stop[
                "stop_order"
            ],
            "arrival_date": original_stop[
                "arrival_date"
            ],
            "departure_date": original_stop[
                "departure_date"
            ],
            "notes": original_stop.get(
                "notes"
            )
        }

        try:

            new_stop_response = (
                supabase
                .table("trip_stops")
                .insert(new_stop_data)
                .execute()
            )

        except Exception:

            (
                supabase
                .table("trips")
                .delete()
                .eq(
                    "id",
                    new_trip["id"]
                )
                .execute()
            )

            return None, (
                "Unable to copy trip stops"
            )

        if not new_stop_response.data:

            (
                supabase
                .table("trips")
                .delete()
                .eq(
                    "id",
                    new_trip["id"]
                )
                .execute()
            )

            return None, (
                "Unable to copy trip stops"
            )

        new_stop = new_stop_response.data[0]

        stop_id_map[
            str(original_stop["id"])
        ] = new_stop["id"]

    # -----------------------------------------------------
    # GET ORIGINAL ACTIVITIES
    # -----------------------------------------------------

    original_stop_ids = [
        stop["id"]
        for stop in original_stops
    ]

    original_activities = []

    if original_stop_ids:

        activities_response = (
            supabase
            .table("stop_activities")
            .select(
                """
                id,
                stop_id,
                activity_id,
                activity_date,
                activity_time,
                custom_cost
                """
            )
            .in_(
                "stop_id",
                original_stop_ids
            )
            .execute()
        )

        original_activities = (
            activities_response.data or []
        )

    # -----------------------------------------------------
    # COPY ACTIVITIES
    # -----------------------------------------------------

    for original_activity in original_activities:

        new_stop_id = stop_id_map.get(
            str(original_activity["stop_id"])
        )

        if not new_stop_id:
            continue

        new_activity_data = {
            "stop_id": new_stop_id,
            "activity_id": original_activity[
                "activity_id"
            ],
            "activity_date": original_activity[
                "activity_date"
            ],
            "activity_time": original_activity.get(
                "activity_time"
            ),
            "custom_cost": original_activity.get(
                "custom_cost"
            )
        }

        try:

            activity_response = (
                supabase
                .table("stop_activities")
                .insert(new_activity_data)
                .execute()
            )

        except Exception:

            (
                supabase
                .table("trips")
                .delete()
                .eq(
                    "id",
                    new_trip["id"]
                )
                .execute()
            )

            return None, (
                "Unable to copy trip activities"
            )

        if not activity_response.data:

            (
                supabase
                .table("trips")
                .delete()
                .eq(
                    "id",
                    new_trip["id"]
                )
                .execute()
            )

            return None, (
                "Unable to copy trip activities"
            )

    # -----------------------------------------------------
    # FINAL RESULT
    # -----------------------------------------------------

    return {
        "trip": new_trip,
        "copied_stops": len(
            original_stops
        ),
        "copied_activities": len(
            original_activities
        )
    }, None
# =========================================================
# CREATE FRIENDS SHARE
# =========================================================

def create_friends_share(
    trip_id,
    user_id,
    friend_user_ids,
    expires_at=None
):
    """
    Create a friends-only share link and assign
    specific users who are allowed to view it.
    """

    trip = _get_user_trip(
        trip_id,
        user_id
    )

    if not trip:
        return None, "Trip not found"

    if not isinstance(friend_user_ids, list):
        return None, "Friend user IDs must be a list"

    if not friend_user_ids:
        return None, "At least one friend is required"

    # Remove duplicate IDs and owner ID.
    friend_user_ids = list({
        str(friend_id)
        for friend_id in friend_user_ids
        if str(friend_id) != str(user_id)
    })

    if not friend_user_ids:
        return None, "At least one friend is required"

    # -----------------------------------------------------
    # VERIFY USERS EXIST
    # -----------------------------------------------------

    users_response = (
        supabase
        .table("users")
        .select("id")
        .in_("id", friend_user_ids)
        .execute()
    )

    existing_user_ids = {
        str(user["id"])
        for user in (users_response.data or [])
    }

    invalid_users = [
        user_id
        for user_id in friend_user_ids
        if user_id not in existing_user_ids
    ]

    if invalid_users:
        return None, "One or more users do not exist"

    # -----------------------------------------------------
    # CREATE SHARE RECORD
    # -----------------------------------------------------

    share_token = secrets.token_urlsafe(32)

    share_data = {
        "trip_id": str(trip_id),
        "share_token": share_token,
        "visibility": "friends"
    }

    if expires_at:
        share_data["expires_at"] = expires_at

    try:

        response = (
            supabase
            .table("shared_trips")
            .insert(share_data)
            .execute()
        )

    except Exception:
        return None, "Unable to create friends share"

    if not response.data:
        return None, "Unable to create friends share"

    shared_trip = response.data[0]

    # -----------------------------------------------------
    # ASSIGN FRIENDS
    # -----------------------------------------------------

    friend_rows = [
        {
            "shared_trip_id": shared_trip["id"],
            "user_id": friend_id
        }
        for friend_id in friend_user_ids
    ]

    try:

        friend_response = (
            supabase
            .table("shared_trip_users")
            .insert(friend_rows)
            .execute()
        )

    except Exception:

        supabase.table("shared_trips").delete().eq(
            "id",
            shared_trip["id"]
        ).execute()

        return None, (
            "Unable to assign friends to shared trip"
        )

    if not friend_response.data:

        supabase.table("shared_trips").delete().eq(
            "id",
            shared_trip["id"]
        ).execute()

        return None, (
            "Unable to assign friends to shared trip"
        )

    # -----------------------------------------------------
    # UPDATE TRIP VISIBILITY
    # -----------------------------------------------------

    try:

        (
            supabase
            .table("trips")
            .update({
                "visibility": "friends"
            })
            .eq("id", str(trip_id))
            .eq("user_id", str(user_id))
            .execute()
        )

    except Exception:
        pass

    return {
        "shared_trip": shared_trip,
        "shared_with": friend_user_ids
    }, None


# =========================================================
# CHECK FRIEND ACCESS
# =========================================================

def _has_friend_access(
    shared_trip_id,
    user_id
):
    """
    Check whether authenticated user is allowed
    to view a friends-only shared trip.
    """

    response = (
        supabase
        .table("shared_trip_users")
        .select("id")
        .eq(
            "shared_trip_id",
            str(shared_trip_id)
        )
        .eq(
            "user_id",
            str(user_id)
        )
        .maybe_single()
        .execute()
    )

    return bool(response.data)


# =========================================================
# GET FRIENDS SHARED TRIP
# =========================================================

def get_friends_shared_trip(
    share_token,
    user_id
):
    """
    Get a friends-only shared trip for an authenticated
    and authorized user.
    """

    response = (
        supabase
        .table("shared_trips")
        .select(
            """
            id,
            trip_id,
            share_token,
            visibility,
            expires_at,
            created_at,
            trips (
                id,
                trip_name,
                description,
                cover_photo,
                start_date,
                end_date,
                status,
                visibility,
                estimated_budget,
                trip_stops (
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
                )
            )
            """
        )
        .eq(
            "share_token",
            share_token
        )
        .eq(
            "visibility",
            "friends"
        )
        .maybe_single()
        .execute()
    )

    shared_trip = response.data

    if not shared_trip:
        return None, "Shared trip not found"

    # -----------------------------------------------------
    # CHECK ACCESS
    # -----------------------------------------------------

    has_access = _has_friend_access(
        shared_trip["id"],
        user_id
    )

    if not has_access:
        return None, "Access denied"

    # -----------------------------------------------------
    # CHECK EXPIRY
    # -----------------------------------------------------

    expires_at = shared_trip.get(
        "expires_at"
    )

    if expires_at:

        try:

            expiry = datetime.fromisoformat(
                expires_at.replace(
                    "Z",
                    "+00:00"
                )
            )

            if expiry < datetime.now(timezone.utc):
                return None, "Share link has expired"

        except (TypeError, ValueError):
            return None, "Invalid share expiration"

    trip = shared_trip.get("trips")

    if not trip:
        return None, "Trip not found"

    stops = trip.get(
        "trip_stops"
    ) or []

    stops.sort(
        key=lambda item: item.get(
            "stop_order",
            0
        )
    )

    for stop in stops:

        activities = (
            stop.get("stop_activities")
            or []
        )

        activities.sort(
            key=lambda item: (
                item.get("activity_date")
                or "9999-12-31",
                item.get("activity_time")
                or "23:59:59"
            )
        )

    trip["trip_stops"] = stops

    shared_trip["trips"] = trip

    return shared_trip, None