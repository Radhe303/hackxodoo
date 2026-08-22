from config import supabase


CITY_FIELDS = "id,city_name,country,region,latitude,longitude,cost_index,avg_hotel_cost,avg_food_cost,avg_local_transport,popularity_score,image_url,created_at,updated_at"



def search_cities(
    query=None,
    country=None,
    region=None,
    limit=20,
    offset=0
):
    """
    Search and filter cities.
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
        .table("cities")
        .select(
            CITY_FIELDS,
            count="exact"
        )
    )

    # -----------------------------------------------------
    # SEARCH
    # -----------------------------------------------------

    if query:

        query = query.strip()

        if query:

            db_query = db_query.or_(
                f"city_name.ilike.%{query}%,"
                f"country.ilike.%{query}%"
            )

    # -----------------------------------------------------
    # COUNTRY
    # -----------------------------------------------------

    if country:

        db_query = db_query.ilike(
            "country",
            country.strip()
        )

    # -----------------------------------------------------
    # REGION
    # -----------------------------------------------------

    if region:

        db_query = db_query.ilike(
            "region",
            region.strip()
        )

    # -----------------------------------------------------
    # ORDER + PAGINATION
    # -----------------------------------------------------

    db_query = (
        db_query
        .order(
            "popularity_score",
            desc=True
        )
        .range(
            offset,
            offset + limit - 1
        )
    )

    response = db_query.execute()

    return {
        "cities": response.data or [],
        "total": response.count or 0,
        "limit": limit,
        "offset": offset
    }


def get_city(city_id):
    """
    Fetch one city by UUID.
    """

    response = (
        supabase
        .table("cities")
        .select(CITY_FIELDS)
        .eq("id", str(city_id))
        .maybe_single()
        .execute()
    )

    return response.data