from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from datetime import date, datetime, timezone
from typing import Optional
import os


class CalendarNotConfiguredError(Exception):
    """Raised when Google Calendar credentials are not available."""


class CalendarEvent:
    def __init__(
        self,
        id: str,
        title: str,
        event_date: date,
        franja: str,
        campo_id: str,
    ) -> None:
        self.id = id
        self.title = title
        self.date = event_date
        self.franja = franja
        self.campo_id = campo_id

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"CalendarEvent(id={self.id!r}, title={self.title!r}, "
            f"date={self.date}, franja={self.franja!r})"
        )


class BaseCalendarService(ABC):
    @abstractmethod
    def create_event(
        self,
        tarea_id: str,
        titulo: str,
        campo_id: str,
        fecha: date,
        franja: str,
    ) -> str:
        """Create a calendar event and return the google_event_id."""

    @abstractmethod
    def delete_event(self, event_id: str) -> bool:
        """Delete a calendar event by its ID. Returns True if deleted."""

    @abstractmethod
    def list_events(self, start_date: date, end_date: date) -> list[CalendarEvent]:
        """List events within a date range (inclusive)."""


class MockCalendarService(BaseCalendarService):
    """In-memory calendar service for development and testing."""

    def __init__(self) -> None:
        # Shared in-memory store across all instances of this class
        self._store: dict[str, CalendarEvent] = {}

    def create_event(
        self,
        tarea_id: str,
        titulo: str,
        campo_id: str,
        fecha: date,
        franja: str,
    ) -> str:
        event_id = f"mock-{uuid.uuid4()}"
        event = CalendarEvent(
            id=event_id,
            title=titulo,
            event_date=fecha,
            franja=franja,
            campo_id=campo_id,
        )
        self._store[event_id] = event
        return event_id

    def delete_event(self, event_id: str) -> bool:
        if event_id in self._store:
            del self._store[event_id]
            return True
        return False

    def list_events(self, start_date: date, end_date: date) -> list[CalendarEvent]:
        return [
            ev
            for ev in self._store.values()
            if start_date <= ev.date <= end_date
        ]


# ---------------------------------------------------------------------------
# Franja → UTC time windows
# All times are in local time (naive); adjust tz as needed for production.
# ---------------------------------------------------------------------------
_FRANJA_TIMES: dict[str, tuple[str, str]] = {
    "f1_manana": ("10:30", "12:30"),
    "f2_tarde1": ("14:30", "17:30"),
    "f3_tarde2": ("17:30", "19:30"),
}


class GoogleCalendarService(BaseCalendarService):
    """Real Google Calendar API v3 adapter."""

    CREDENTIALS_FILE = "credentials.json"
    TOKEN_FILE = "token.json"
    SCOPES = ["https://www.googleapis.com/auth/calendar"]

    def __init__(self) -> None:
        from google.oauth2.credentials import Credentials
        from google_auth_oauthlib.flow import InstalledAppFlow
        from google.auth.transport.requests import Request
        from googleapiclient.discovery import build

        if not os.path.exists(self.CREDENTIALS_FILE):
            raise CalendarNotConfiguredError(
                f"Google Calendar credentials not found at '{self.CREDENTIALS_FILE}'. "
                "Please download OAuth2 credentials from Google Cloud Console."
            )

        creds: Optional[Credentials] = None
        if os.path.exists(self.TOKEN_FILE):
            creds = Credentials.from_authorized_user_file(self.TOKEN_FILE, self.SCOPES)

        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.CREDENTIALS_FILE, self.SCOPES
                )
                creds = flow.run_local_server(port=0)
            with open(self.TOKEN_FILE, "w") as token_file:
                token_file.write(creds.to_json())

        self._service = build("calendar", "v3", credentials=creds)

    def _build_event_body(
        self,
        titulo: str,
        campo_id: str,
        fecha: date,
        franja: str,
    ) -> dict:
        start_time, end_time = _FRANJA_TIMES.get(franja, ("10:30", "12:30"))
        date_str = fecha.isoformat()
        return {
            "summary": titulo,
            "description": f"Campo: {campo_id} | Franja: {franja}",
            "start": {
                "dateTime": f"{date_str}T{start_time}:00",
                "timeZone": "America/Argentina/Buenos_Aires",
            },
            "end": {
                "dateTime": f"{date_str}T{end_time}:00",
                "timeZone": "America/Argentina/Buenos_Aires",
            },
            "colorId": "1",  # Can be mapped to campo color in the future
        }

    def create_event(
        self,
        tarea_id: str,
        titulo: str,
        campo_id: str,
        fecha: date,
        franja: str,
    ) -> str:
        body = self._build_event_body(titulo, campo_id, fecha, franja)
        result = (
            self._service.events()
            .insert(calendarId="primary", body=body)
            .execute()
        )
        return result["id"]

    def delete_event(self, event_id: str) -> bool:
        try:
            self._service.events().delete(
                calendarId="primary", eventId=event_id
            ).execute()
            return True
        except Exception:
            return False

    def list_events(self, start_date: date, end_date: date) -> list[CalendarEvent]:
        time_min = datetime(
            start_date.year, start_date.month, start_date.day,
            tzinfo=timezone.utc,
        ).isoformat()
        time_max = datetime(
            end_date.year, end_date.month, end_date.day, 23, 59, 59,
            tzinfo=timezone.utc,
        ).isoformat()

        result = (
            self._service.events()
            .list(
                calendarId="primary",
                timeMin=time_min,
                timeMax=time_max,
                singleEvents=True,
                orderBy="startTime",
            )
            .execute()
        )
        events: list[CalendarEvent] = []
        for item in result.get("items", []):
            start_raw = item.get("start", {}).get("dateTime") or item.get("start", {}).get("date", "")
            try:
                ev_date = date.fromisoformat(start_raw[:10])
            except ValueError:
                continue
            description = item.get("description", "")
            campo_id = ""
            franja = ""
            for part in description.split("|"):
                part = part.strip()
                if part.startswith("Campo:"):
                    campo_id = part.replace("Campo:", "").strip()
                elif part.startswith("Franja:"):
                    franja = part.replace("Franja:", "").strip()
            events.append(
                CalendarEvent(
                    id=item["id"],
                    title=item.get("summary", ""),
                    event_date=ev_date,
                    franja=franja,
                    campo_id=campo_id,
                )
            )
        return events


# Module-level singleton for the mock service so the in-memory store is shared
_mock_service = MockCalendarService()


def get_calendar_service() -> BaseCalendarService:
    """
    Returns GoogleCalendarService when credentials.json exists,
    otherwise falls back to MockCalendarService.
    """
    if os.path.exists(GoogleCalendarService.CREDENTIALS_FILE):
        try:
            return GoogleCalendarService()
        except CalendarNotConfiguredError:
            pass
    return _mock_service
