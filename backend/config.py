# backend/config.py

# Required fields in the transaction CSV
REQUIRED_FIELDS = [
    "order_id",
    "order_date",
    "customer_name",
    "country",
    "phone_number",
    "product_name",
    "quantity",
    "payment_mode",
    "transaction_amount"
]

# Known countries list for parsing consolidated customer_country fields
KNOWN_COUNTRIES = ["India", "Singapore", "USA", "Malaysia", "Germany"]


# Allowed payment modes
ALLOWED_PAYMENT_MODES = [
    "UPI",
    "Card",
    "Cash",
    "Net Banking",
    "Wallet",
    "Bank Transfer"
]

# Phone number validation rules by country
# The rules validate numbers after stripping symbols (spaces, dashes, parentheses, plus sign).
# It handles optional country calling codes (91 for India, 65 for Singapore, 1 for USA, 60 for Malaysia).
COUNTRY_PHONE_RULES = {
    "India": {
        # Exactly 10 digits. If a 12-digit number starts with 91, it's valid.
        "pattern": r"^(?:91)?(\d{10})$",
        "description": "exactly 10 digits (excluding optional 91 prefix)"
    },
    "Singapore": {
        # Exactly 8 digits. If a 10-digit number starts with 65, it's valid.
        "pattern": r"^(?:65)?(\d{8})$",
        "description": "exactly 8 digits (excluding optional 65 prefix)"
    },
    "USA": {
        # Exactly 10 digits. If an 11-digit number starts with 1, it's valid.
        "pattern": r"^(?:1)?(\d{10})$",
        "description": "exactly 10 digits (excluding optional 1 prefix)"
    },
    "Malaysia": {
        # 9 to 10 digits. If starts with 60 prefix followed by 9-10 digits, it's valid.
        "pattern": r"^(?:60)?(\d{9,10})$",
        "description": "9 to 10 digits (excluding optional 60 prefix)"
    }
}

# Accepted date formats for pandas parsing
ACCEPTED_DATE_FORMATS = [
    "%d-%m-%Y",
    "%Y-%m-%d",
    "%d/%m/%Y"
]
