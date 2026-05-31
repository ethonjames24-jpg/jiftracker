import os
from pathlib import Path

import pytest
import requests
from dotenv import load_dotenv


# Load frontend env to get the public preview URL for end-to-end API testing
load_dotenv(Path("/app/frontend/.env"))


@pytest.fixture(scope="session")
def base_url() -> str:
    url = os.environ.get("REACT_APP_BACKEND_URL")
    if not url:
        pytest.fail("REACT_APP_BACKEND_URL is not set")
    return url.rstrip("/")


@pytest.fixture
def api_client() -> requests.Session:
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session
