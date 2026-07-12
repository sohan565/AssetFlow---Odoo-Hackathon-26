from models.asset import AssetModel

# State Machine Transition Rules
VALID_TRANSITIONS = {
    "Available":         ["Allocated", "Reserved", "Under Maintenance", "Retired", "Disposed"],
    "Allocated":         ["Available", "Under Maintenance", "Lost"],
    "Reserved":          ["Available", "Allocated"],
    "Under Maintenance": ["Available", "Retired", "Disposed"],
    "Lost":              ["Available", "Disposed"],
    "Retired":           ["Disposed"],
    "Disposed":          [],  # Terminal state
}

class AssetLifecycleService:
    @staticmethod
    def transition_asset_state(conn, asset_id: int, new_state: str, 
                               changed_by: int = None, reason: str = ""):
        """
        Orchestrates and validates asset state changes.
        Throws a ValueError if the transition is illegal under state machine rules.
        """
        asset = AssetModel.get_asset(conn, asset_id)
        if not asset:
            raise ValueError("Asset does not exist.")

        current_state = asset["current_state"]
        
        # If it's already in the target state, do nothing
        if current_state == new_state:
            return

        # Check if the transition is valid
        allowed_targets = VALID_TRANSITIONS.get(current_state, [])
        if new_state not in allowed_targets:
            raise ValueError(
                f"Illegal state transition. Cannot move asset from state '{current_state}' to '{new_state}'."
            )

        # Apply update and write transition log
        AssetModel.update_asset_state(conn, asset_id, new_state, changed_by, reason)
