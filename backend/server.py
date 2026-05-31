from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import Any, Dict, List, Optional
import uuid
from datetime import datetime, timezone
import asyncio
import csv
import io
import requests


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

SPREADSHEET_ID = "13npg-j5jjMzE115EOkkBdq7Rav1L5-RUPl1rza5e_v0"
SHEET_BASE_URL = "https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet={tab}"


def _clean_key(key: Optional[str], fallback_index: int) -> str:
    cleaned = (key or "").strip()
    return cleaned if cleaned else f"unused_{fallback_index}"


def _clean_value(value: Any) -> str:
    return str(value).strip() if value is not None else ""


def _truthy(value: Any) -> bool:
    return _clean_value(value).lower() in {"true", "1", "yes", "y", "on"}


def _to_int(value: Any, default: int = 0) -> int:
    try:
        return int(float(str(value).replace(",", "").strip()))
    except (TypeError, ValueError):
        return default


def _fetch_csv_tab(tab_name: str) -> List[Dict[str, str]]:
    url = SHEET_BASE_URL.format(sheet_id=SPREADSHEET_ID, tab=tab_name)
    response = requests.get(url, timeout=20)
    response.raise_for_status()

    reader = csv.reader(io.StringIO(response.text))
    rows = list(reader)
    if not rows:
        return []

    headers = [_clean_key(header, index) for index, header in enumerate(rows[0])]
    records: List[Dict[str, str]] = []
    for row in rows[1:]:
        padded = row + [""] * max(0, len(headers) - len(row))
        record = {
            headers[index]: _clean_value(padded[index])
            for index in range(len(headers))
            if not headers[index].startswith("unused_")
        }
        if any(record.values()):
            records.append(record)
    return records


async def fetch_sheet_tab(tab_name: str) -> List[Dict[str, str]]:
    try:
        return await asyncio.to_thread(_fetch_csv_tab, tab_name)
    except requests.HTTPError as exc:
        logger.error("Google Sheet tab fetch failed for %s: %s", tab_name, exc)
        raise HTTPException(status_code=502, detail=f"Could not read Google Sheet tab: {tab_name}") from exc
    except requests.RequestException as exc:
        logger.error("Google Sheet connection failed for %s: %s", tab_name, exc)
        raise HTTPException(status_code=502, detail="Could not connect to the Google Sheet") from exc


def _normalise_archive_row(row: Dict[str, str]) -> Dict[str, str]:
    return {
        "month_label": row.get("month_label") or row.get("Month") or row.get("month") or "",
        "month_sort": row.get("month_sort") or "",
        "tracker_state": row.get("tracker_state") or row.get("Tracker Status") or "",
        "status": row.get("status_headline") or row.get("Status") or "",
        "note": row.get("short_note") or row.get("Note") or "",
    }


def _build_tracker_payload(monthly_rows: List[Dict[str, str]], archive_rows: List[Dict[str, str]], requested_month: Optional[str]) -> Dict[str, Any]:
    valid_rows = [row for row in monthly_rows if row.get("month_sort") and row.get("kpi_label")]
    if not valid_rows:
        raise HTTPException(status_code=404, detail="No tracker rows were found in DS_MonthlyTracker")

    grouped_rows: Dict[str, List[Dict[str, str]]] = {}
    for row in valid_rows:
        group_key = row.get("month_label") or row.get("month_sort")
        grouped_rows.setdefault(group_key, []).append(row)

    month_groups = []
    for label, rows in grouped_rows.items():
        first_order_row = next((row for row in rows if _to_int(row.get("display_order")) == 1), rows[0])
        month_groups.append(
            {
                "month_label": label,
                "month_sort": first_order_row.get("month_sort") or rows[0].get("month_sort"),
                "rows": rows,
            }
        )

    month_groups = sorted(month_groups, key=lambda item: item["month_sort"])
    selected_group = next((group for group in month_groups if group["month_sort"] == requested_month), month_groups[-1])
    selected_month = selected_group["month_sort"]
    current_rows = selected_group["rows"]

    deduped: Dict[str, Dict[str, str]] = {}
    for row in current_rows:
        key = row.get("kpi_label", "").lower()
        if key and key not in deduped:
            deduped[key] = row

    kpi_rows = sorted(deduped.values(), key=lambda item: _to_int(item.get("display_order"), 999))
    first = kpi_rows[0]
    counts = {
        "kpis_tracked": max(_to_int(first.get("kpi_count"), 0), len(kpi_rows)),
        "on_track": sum(1 for row in kpi_rows if _truthy(row.get("is_on_track")) or row.get("status") == "On Track"),
        "watch": sum(1 for row in kpi_rows if _truthy(row.get("is_watch")) or row.get("status") == "Watch"),
        "under_pressure": sum(1 for row in kpi_rows if _truthy(row.get("is_under_pressure")) or row.get("status") == "Under Pressure"),
    }

    month_options = [
        {
            "month_sort": group["month_sort"],
            "month_label": group["month_label"],
        }
        for group in sorted(month_groups, key=lambda item: item["month_sort"], reverse=True)
    ]

    return {
        "spreadsheet_id": SPREADSHEET_ID,
        "last_loaded_at": datetime.now(timezone.utc).isoformat(),
        "available_months": month_options,
        "current_month": {
            "month_label": selected_group["month_label"] or first.get("month_label", selected_month),
            "month_sort": selected_month,
            "tracker_state": first.get("tracker_state", ""),
            "status_headline": first.get("status_headline", ""),
            "what_changed": first.get("what_changed", ""),
            "monthly_note": first.get("monthly_note", ""),
            "monthly_outturn_source": first.get("monthly_outturn_source", ""),
            "budget_baseline_source": first.get("budget_baseline_source", ""),
            "supporting_fiscal_context": first.get("supporting_fiscal_context", ""),
            "counts": counts,
        },
        "kpis": kpi_rows,
        "archive": [_normalise_archive_row(row) for row in archive_rows if any(row.values())],
    }


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Jamaica In Focus Budget Performance Tracker API"}


@api_router.get("/tracker")
async def get_tracker(month: Optional[str] = Query(default=None, description="Optional month_sort value, for example 2026-04")):
    monthly_rows, archive_rows = await asyncio.gather(
        fetch_sheet_tab("DS_MonthlyTracker"),
        fetch_sheet_tab("archive"),
    )
    return _build_tracker_payload(monthly_rows, archive_rows, month)

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()