import json

from google import genai
from flask import current_app


def get_gemini_client():
    """
    Create Gemini client using configured API key.
    """

    return genai.Client(
        api_key=current_app.config["GEMINI_API_KEY"]
    )


def generate_travel_raw_data(prompt):
    """
    Ask Gemini for raw/reference travel information.

    This service MUST NOT perform:
        - distance calculation
        - budget calculation
        - transport cost calculation
        - itinerary total calculation
    """

    client = get_gemini_client()

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    text = response.text.strip()

    return text


def generate_json_travel_data(prompt):
    """
    Request structured JSON-like raw travel data.
    """

    client = get_gemini_client()

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config={
            "response_mime_type": "application/json"
        }
    )

    text = response.text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None