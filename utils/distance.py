import math


def calculate_distance_km(
    latitude_1,
    longitude_1,
    latitude_2,
    longitude_2
):
    """
    Calculate great-circle distance between two
    latitude/longitude coordinates using the Haversine formula.

    Returns:
        float: distance in kilometers
    """

    # -----------------------------------------------------
    # Convert values to float
    # -----------------------------------------------------

    lat1 = float(latitude_1)
    lon1 = float(longitude_1)
    lat2 = float(latitude_2)
    lon2 = float(longitude_2)

    # -----------------------------------------------------
    # Validate coordinates
    # -----------------------------------------------------

    if not -90 <= lat1 <= 90:
        raise ValueError("Invalid latitude_1")

    if not -90 <= lat2 <= 90:
        raise ValueError("Invalid latitude_2")

    if not -180 <= lon1 <= 180:
        raise ValueError("Invalid longitude_1")

    if not -180 <= lon2 <= 180:
        raise ValueError("Invalid longitude_2")

    # -----------------------------------------------------
    # Earth's radius in kilometers
    # -----------------------------------------------------

    earth_radius_km = 6371.0

    # -----------------------------------------------------
    # Convert degrees to radians
    # -----------------------------------------------------

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)

    delta_lat = math.radians(
        lat2 - lat1
    )

    delta_lon = math.radians(
        lon2 - lon1
    )

    # -----------------------------------------------------
    # Haversine formula
    # -----------------------------------------------------

    a = (
        math.sin(delta_lat / 2) ** 2
        +
        math.cos(lat1_rad)
        * math.cos(lat2_rad)
        * math.sin(delta_lon / 2) ** 2
    )

    c = 2 * math.atan2(
        math.sqrt(a),
        math.sqrt(1 - a)
    )

    distance = earth_radius_km * c

    # -----------------------------------------------------
    # Round for application use
    # -----------------------------------------------------

    return round(distance, 2)