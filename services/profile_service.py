from config import supabase


USER_FIELDS = "id,full_name,email,profile_photo,language,role,is_active,email_verified,created_at,updated_at"



# =========================================================
# GET PROFILE
# =========================================================

def get_profile(user_id):
    """
    Fetch the authenticated user's profile.
    """

    response = (
        supabase
        .table("users")
        .select(USER_FIELDS)
        .eq("id", str(user_id))
        .maybe_single()
        .execute()
    )

    return response.data


# =========================================================
# UPDATE PROFILE
# =========================================================

def update_profile(
    user_id,
    full_name=None,
    profile_photo=None,
    language=None
):
    """
    Update editable profile fields.

    User cannot modify:
        email
        role
        is_active
        email_verified
    """

    update_data = {}

    # -----------------------------------------------------
    # FULL NAME
    # -----------------------------------------------------

    if full_name is not None:

        full_name = str(
            full_name
        ).strip()

        if len(full_name) < 2:
            return None, (
                "Full name must be at least 2 characters"
            )

        if len(full_name) > 100:
            return None, (
                "Full name must not exceed 100 characters"
            )

        update_data["full_name"] = full_name

    # -----------------------------------------------------
    # PROFILE PHOTO
    # -----------------------------------------------------

    if profile_photo is not None:

        profile_photo = str(
            profile_photo
        ).strip()

        if profile_photo:
            update_data["profile_photo"] = profile_photo
        else:
            update_data["profile_photo"] = None

    # -----------------------------------------------------
    # LANGUAGE
    # -----------------------------------------------------

    if language is not None:

        language = str(
            language
        ).strip()

        if not language:
            return None, "Language cannot be empty"

        if len(language) > 20:
            return None, (
                "Language must not exceed 20 characters"
            )

        update_data["language"] = language

    # -----------------------------------------------------
    # NOTHING TO UPDATE
    # -----------------------------------------------------

    if not update_data:
        return None, "No profile changes provided"

    # -----------------------------------------------------
    # UPDATE USER
    # -----------------------------------------------------

    try:

        response = (
            supabase
            .table("users")
            .update(update_data)
            .eq("id", str(user_id))
            .execute()
        )

    except Exception:
        return None, (
            "Unable to update profile"
        )

    if not response.data:
        return None, (
            "Unable to update profile"
        )

    return response.data[0], None


# =========================================================
# DELETE ACCOUNT
# =========================================================

def delete_account(user_id):
    """
    Delete the authenticated user's account.

    Related user-owned data should be removed according
    to the database foreign-key ON DELETE CASCADE rules.
    """

    response = (
        supabase
        .table("users")
        .select("id")
        .eq("id", str(user_id))
        .maybe_single()
        .execute()
    )

    if not response.data:
        return False, "User not found"

    try:

        delete_response = (
            supabase
            .table("users")
            .delete()
            .eq("id", str(user_id))
            .execute()
        )

    except Exception:
        return False, (
            "Unable to delete account"
        )

    if not delete_response.data:
        return False, (
            "Unable to delete account"
        )

    return True, None