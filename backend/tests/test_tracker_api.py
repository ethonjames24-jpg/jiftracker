import pytest


# Tracker API: health and data-shape checks for live Google Sheet integration
def test_tracker_endpoint_returns_live_payload(api_client, base_url):
    response = api_client.get(f"{base_url}/api/tracker", timeout=30)
    assert response.status_code == 200

    data = response.json()
    assert data["spreadsheet_id"] == "13npg-j5jjMzE115EOkkBdq7Rav1L5-RUPl1rza5e_v0"
    assert data["current_month"]["month_sort"] == "2026-04"
    assert data["current_month"]["month_label"] == "Apr 2026"
    assert isinstance(data["kpis"], list)
    assert len(data["kpis"]) == 8


# Tracker API: default month and KPI count expectations for Apr 2026
def test_tracker_default_month_counts_match_expected(api_client, base_url):
    response = api_client.get(f"{base_url}/api/tracker", timeout=30)
    assert response.status_code == 200

    counts = response.json()["current_month"]["counts"]
    assert counts["kpis_tracked"] == 8
    assert counts["on_track"] == 2
    assert counts["watch"] == 0
    assert counts["under_pressure"] == 6


# Tracker API: KPI ordering and status mapping checks
def test_tracker_kpi_rows_sorted_and_statuses_correct(api_client, base_url):
    response = api_client.get(f"{base_url}/api/tracker", timeout=30)
    assert response.status_code == 200

    kpis = response.json()["kpis"]
    orders = [int(float(kpi.get("display_order", 999))) for kpi in kpis]
    assert orders == sorted(orders)

    expected_statuses = {
        "Tax Revenue": "Under Pressure",
        "Non-Tax Revenue": "Under Pressure",
        "Total Revenue & Grants": "Under Pressure",
        "Primary Balance": "Under Pressure",
        "Fiscal Balance": "Under Pressure",
        "Compensation of Employees": "On Track",
        "Capital Expenditure": "Under Pressure",
        "Interest": "On Track",
    }
    actual = {kpi["kpi_label"]: kpi["status"] for kpi in kpis}
    assert actual == expected_statuses


# Tracker API: month filtering behaves and keeps expected April data
def test_tracker_month_query_param_for_april(api_client, base_url):
    response = api_client.get(f"{base_url}/api/tracker", params={"month": "2026-04"}, timeout=30)
    assert response.status_code == 200

    data = response.json()
    assert data["current_month"]["month_sort"] == "2026-04"
    assert data["current_month"]["month_label"] == "Apr 2026"
    assert len(data["kpis"]) == 8


# Tracker API: archive section contains April 2026 and Under Pressure status
def test_tracker_archive_contains_april_entry(api_client, base_url):
    response = api_client.get(f"{base_url}/api/tracker", timeout=30)
    assert response.status_code == 200

    archive = response.json()["archive"]
    april_entries = [item for item in archive if item.get("month_label") == "Apr 2026"]
    assert len(april_entries) >= 1
    assert april_entries[0].get("status") == "Under Pressure"


# Tracker API: invalid month should gracefully fall back (not fail)
def test_tracker_invalid_month_fallback(api_client, base_url):
    response = api_client.get(f"{base_url}/api/tracker", params={"month": "1900-01"}, timeout=30)
    assert response.status_code == 200

    data = response.json()
    assert data["current_month"]["month_sort"] == "2026-04"
