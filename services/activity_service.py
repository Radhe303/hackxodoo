from config import supabase


ACTIVITY_FIELDS = "id,city_id,activity_name,category,description,estimated_cost,duration_hours,rating,image_url,created_at,updated_at"



def search_activities(
    city_id=None,
    query=None,
    category=None,
    min_cost=None,
    max_cost=None,
    max_duration=None,
    limit=20,
    offset=0
):
    """
    Search and filter activities.
    """

    limit = min(
        max(int(limit), 1),
        100
    )

    offset = max(
        int(offset),
        0
    )

    db_query = (
        supabase
        .table("activities")
        .select(
            ACTIVITY_FIELDS,
            count="exact"
        )
    )

    # -----------------------------------------------------
    # CITY FILTER
    # -----------------------------------------------------

    if city_id:

        db_query = db_query.eq(
            "city_id",
            str(city_id)
        )

    # -----------------------------------------------------
    # SEARCH
    # -----------------------------------------------------

    if query:

        query = query.strip()

        if query:

            db_query = db_query.or_(
                f"activity_name.ilike.%{query}%,"
                f"description.ilike.%{query}%"
            )

    # -----------------------------------------------------
    # CATEGORY
    # -----------------------------------------------------

    if category:

        db_query = db_query.ilike(
            "category",
            category.strip()
        )

    # -----------------------------------------------------
    # COST
    # -----------------------------------------------------

    if min_cost is not None:

        db_query = db_query.gte(
            "estimated_cost",
            float(min_cost)
        )

    if max_cost is not None:

        db_query = db_query.lte(
            "estimated_cost",
            float(max_cost)
        )

    # -----------------------------------------------------
    # DURATION
    # -----------------------------------------------------

    if max_duration is not None:

        db_query = db_query.lte(
            "duration_hours",
            int(max_duration)
        )

    # -----------------------------------------------------
    # ORDER + PAGINATION
    # -----------------------------------------------------

    db_query = (
        db_query
        .order(
            "rating",
            desc=True
        )
        .range(
            offset,
            offset + limit - 1
        )
    )

    response = db_query.execute()

    return {
        "activities": response.data or [],
        "total": response.count or 0,
        "limit": limit,
        "offset": offset
    }


def get_activity(activity_id):
    """
    Fetch one activity by UUID.
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