import json

from google import genai
from google.genai import types
from flask import current_app


# =========================================================
# CLIENT
# =========================================================

def get_gemini_client():
    """
    Create Gemini client using the API key configured
    in Flask application config.
    """

    api_key = current_app.config.get(
        "GEMINI_API_KEY"
    )

    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured"
        )

    return genai.Client(
        api_key=api_key
    )


# =========================================================
# RAW TRAVEL DATA
# =========================================================

def generate_raw_travel_data(
    city_name,
    country,
    activity_limit=10
):
    """
    Ask Gemini for raw/reference travel data.

    IMPORTANT:
    This function does NOT calculate:
        - distance
        - transport cost
        - total budget
        - hotel total
        - food total
        - itinerary total

    Those calculations remain in our backend.
    """

    client = get_gemini_client()

    prompt = f"""
You are a travel data provider for a travel planning application.

Return useful RAW travel reference data for:

City: {city_name}
Country: {country}

Return:
1. Basic city information
2. Region
3. Latitude
4. Longitude
5. Cost index estimate
6. Average hotel cost per night
7. Average food cost per day
8. Average local transport cost per day
9. Popularity score from 0 to 100
10. Up to {activity_limit} popular activities

For each activity return:
- activity name
- category
- description
- estimated cost
- duration in hours
- rating from 0 to 5
- image URL only when a reliable public URL is known

Important rules:
- Return reference/raw travel information only.
- Do NOT calculate route distance.
- Do NOT calculate trip budget.
- Do NOT calculate transport cost between cities.
- Do NOT invent exact real-time prices.
- If a value is uncertain, return a reasonable estimate or null.
- Return only JSON.
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        )
    )

    if not response.text:
        raise RuntimeError(
            "Gemini returned an empty response"
        )

    try:
        return json.loads(
            response.text
        )

    except json.JSONDecodeError as exc:
        raise RuntimeError(
            "Gemini returned invalid JSON"
        ) from exc


# =========================================================
# NORMALIZE CITY DATA
# =========================================================

def normalize_city_data(
    raw_data,
    city_name,
    country
):
    """
    Normalize Gemini city data before database insertion.
    """

    if not isinstance(raw_data, dict):
        raise ValueError(
            "Invalid Gemini city data"
        )

    region = raw_data.get(
        "region"
    )

    latitude = raw_data.get(
        "latitude"
    )

    longitude = raw_data.get(
        "longitude"
    )

    cost_index = raw_data.get(
        "cost_index",
        1.0
    )

    avg_hotel_cost = raw_data.get(
        "avg_hotel_cost",
        0
    )

    avg_food_cost = raw_data.get(
        "avg_food_cost",
        0
    )

    avg_local_transport = raw_data.get(
        "avg_local_transport",
        0
    )

    popularity_score = raw_data.get(
        "popularity_score",
        0
    )

    # -----------------------------------------------------
    # NUMERIC VALIDATION
    # -----------------------------------------------------

    if latitude is not None:
        latitude = float(latitude)

        if not -90 <= latitude <= 90:
            raise ValueError(
                "Invalid latitude"
            )

    if longitude is not None:
        longitude = float(longitude)

        if not -180 <= longitude <= 180:
            raise ValueError(
                "Invalid longitude"
            )

    cost_index = max(
        float(cost_index or 0),
        0
    )

    avg_hotel_cost = max(
        float(avg_hotel_cost or 0),
        0
    )

    avg_food_cost = max(
        float(avg_food_cost or 0),
        0
    )

    avg_local_transport = max(
        float(avg_local_transport or 0),
        0
    )

    popularity_score = int(
        popularity_score or 0
    )

    popularity_score = min(
        max(popularity_score, 0),
        100
    )

    return {
        "city_name": city_name.strip(),
        "country": country.strip(),
        "region": (
            region.strip()
            if isinstance(region, str)
            else None
        ),
        "latitude": latitude,
        "longitude": longitude,
        "cost_index": cost_index,
        "avg_hotel_cost": avg_hotel_cost,
        "avg_food_cost": avg_food_cost,
        "avg_local_transport": avg_local_transport,
        "popularity_score": popularity_score,
        "image_url": raw_data.get(
            "image_url"
        )
    }


# =========================================================
# NORMALIZE ACTIVITIES
# =========================================================

def normalize_activities(
    raw_data,
    city_id
):
    """
    Normalize raw Gemini activities so they can be
    inserted into the activities table.
    """

    if not isinstance(raw_data, dict):
        raise ValueError(
            "Invalid Gemini activity data"
        )

    activities = raw_data.get(
        "activities",
        []
    )

    if not isinstance(activities, list):
        raise ValueError(
            "Invalid activities format"
        )

    normalized = []

    for item in activities:

        if not isinstance(item, dict):
            continue

        activity_name = str(
            item.get(
                "activity_name",
                ""
            )
        ).strip()

        if not activity_name:
            continue

        category = str(
            item.get(
                "category",
                "General"
            )
        ).strip()

        description = item.get(
            "description"
        )

        estimated_cost = item.get(
            "estimated_cost",
            0
        )

        duration_hours = item.get(
            "duration_hours",
            0
        )

        rating = item.get(
            "rating",
            0
        )

        try:
            estimated_cost = max(
                float(estimated_cost or 0),
                0
            )
        except (TypeError, ValueError):
            estimated_cost = 0

        try:
            duration_hours = max(
                int(duration_hours or 0),
                0
            )
        except (TypeError, ValueError):
            duration_hours = 0

        try:
            rating = float(
                rating or 0
            )
        except (TypeError, ValueError):
            rating = 0

        rating = min(
            max(rating, 0),
            5
        )

        normalized.append({
            "city_id": str(city_id),
            "activity_name": activity_name,
            "category": category,
            "description": (
                str(description).strip()
                if description is not None
                else None
            ),
            "estimated_cost": estimated_cost,
            "duration_hours": duration_hours,
            "rating": rating,
            "image_url": item.get(
                "image_url"
            )
        })

    return normalized