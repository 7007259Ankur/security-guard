from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.calendar_event import CalendarEvent
from app.models.audit_log import AuditLog
from app.schemas.calendar_event import (
    CalendarEventCreate,
    CalendarEventUpdate,
    CalendarEventRead,
)
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/events", response_model=List[CalendarEventRead])
def list_events(
    start_date: Optional[datetime] = Query(None, description="Filter events starting after this date"),
    end_date: Optional[datetime] = Query(None, description="Filter events ending before this date"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(CalendarEvent).filter(CalendarEvent.user_id == current_user.id)
    if start_date:
        query = query.filter(CalendarEvent.start_time >= start_date)
    if end_date:
        query = query.filter(CalendarEvent.end_time <= end_date)
    events = query.order_by(CalendarEvent.start_time.asc()).all()
    return events


@router.post("/events", response_model=CalendarEventRead, status_code=status.HTTP_201_CREATED)
def create_event(
    event_in: CalendarEventCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = CalendarEvent(
        user_id=current_user.id,
        title=event_in.title,
        description=event_in.description,
        start_time=event_in.start_time,
        end_time=event_in.end_time,
        location=event_in.location,
        event_type=event_in.event_type or "general",
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    client_ip = request.client.host if request.client else "unknown"
    log = AuditLog(
        user_id=current_user.id,
        action="CALENDAR_EVENT_CREATED",
        details=f"Scheduled event '{event.title}'",
        ip_address=client_ip,
    )
    db.add(log)
    db.commit()

    return event


@router.get("/events/{id}", response_model=CalendarEventRead)
def get_event(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = db.query(CalendarEvent).filter(
        CalendarEvent.id == id, CalendarEvent.user_id == current_user.id
    ).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found or access denied",
        )
    return event


@router.put("/events/{id}", response_model=CalendarEventRead)
def update_event(
    id: str,
    event_in: CalendarEventUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = db.query(CalendarEvent).filter(
        CalendarEvent.id == id, CalendarEvent.user_id == current_user.id
    ).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found or access denied",
        )

    update_data = event_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(event, field, val)

    db.add(event)
    db.commit()
    db.refresh(event)

    client_ip = request.client.host if request.client else "unknown"
    log = AuditLog(
        user_id=current_user.id,
        action="CALENDAR_EVENT_UPDATED",
        details=f"Updated event '{event.title}'",
        ip_address=client_ip,
    )
    db.add(log)
    db.commit()

    return event


@router.delete("/events/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = db.query(CalendarEvent).filter(
        CalendarEvent.id == id, CalendarEvent.user_id == current_user.id
    ).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found or access denied",
        )

    title = event.title
    db.delete(event)
    db.commit()

    client_ip = request.client.host if request.client else "unknown"
    log = AuditLog(
        user_id=current_user.id,
        action="CALENDAR_EVENT_DELETED",
        details=f"Deleted event '{title}'",
        ip_address=client_ip,
    )
    db.add(log)
    db.commit()

    return None
