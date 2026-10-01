from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


ADMIN_EMAILS = {e.strip().lower() for e in os.environ.get('ADMIN_EMAILS', '').split(',') if e.strip()}


def is_admin(email: Optional[str]) -> bool:
    return bool(email) and email.strip().lower() in ADMIN_EMAILS


# ---------- Models ----------
class UserCreate(BaseModel):
    name: str
    email: EmailStr


class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    created_at: str = Field(default_factory=now_iso)


class Participant(BaseModel):
    name: str
    email: EmailStr


class TrainingCreate(BaseModel):
    title: str
    date: str  # ISO datetime string
    location: str
    distance_km: float
    capacity: int
    description: Optional[str] = ""
    pace: Optional[str] = ""
    organizer_name: Optional[str] = ""
    organizer_email: Optional[str] = ""
    use_permanentka: bool = True


class Training(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    date: str
    location: str
    distance_km: float
    capacity: int
    description: str = ""
    pace: str = ""
    organizer_name: str = ""
    organizer_email: str = ""
    use_permanentka: bool = True
    participants: List[Participant] = []
    created_at: str = Field(default_factory=now_iso)


class JoinBody(BaseModel):
    name: str
    email: EmailStr


class ResetPermanentkaBody(BaseModel):
    admin_email: EmailStr
    email: EmailStr


# ---------- User routes ----------
@api_router.post("/users", response_model=User)
async def upsert_user(input: UserCreate):
    existing = await db.users.find_one({"email": input.email}, {"_id": 0})
    if existing:
        if existing.get("name") != input.name:
            await db.users.update_one({"email": input.email}, {"$set": {"name": input.name}})
            existing["name"] = input.name
        return User(**existing)
    user = User(**input.model_dump())
    await db.users.insert_one(user.model_dump())
    return user


@api_router.get("/users/{email}", response_model=User)
async def get_user(email: str):
    doc = await db.users.find_one({"email": email}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Používateľ nenájdený")
    return User(**doc)


# ---------- Training routes ----------
@api_router.post("/trainings", response_model=Training)
async def create_training(input: TrainingCreate):
    if not is_admin(input.organizer_email):
        raise HTTPException(status_code=403, detail="Len organizátor môže vytvárať tréningy")
    training = Training(**input.model_dump())
    await db.trainings.insert_one(training.model_dump())
    return training


@api_router.get("/trainings", response_model=List[Training])
async def list_trainings():
    docs = await db.trainings.find({}, {"_id": 0}).sort("date", 1).to_list(1000)
    return [Training(**d) for d in docs]


@api_router.get("/trainings/{training_id}", response_model=Training)
async def get_training(training_id: str):
    doc = await db.trainings.find_one({"id": training_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Tréning nenájdený")
    return Training(**doc)


@api_router.post("/trainings/{training_id}/join", response_model=Training)
async def join_training(training_id: str, body: JoinBody):
    doc = await db.trainings.find_one({"id": training_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Tréning nenájdený")
    training = Training(**doc)
    if any(p.email == body.email for p in training.participants):
        return training
    if len(training.participants) >= training.capacity:
        raise HTTPException(status_code=400, detail="Tréning je plný")
    training.participants.append(Participant(name=body.name, email=body.email))
    await db.trainings.update_one(
        {"id": training_id},
        {"$set": {"participants": [p.model_dump() for p in training.participants]}},
    )
    return training


@api_router.post("/trainings/{training_id}/leave", response_model=Training)
async def leave_training(training_id: str, body: JoinBody):
    doc = await db.trainings.find_one({"id": training_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Tréning nenájdený")
    training = Training(**doc)
    training.participants = [p for p in training.participants if p.email != body.email]
    await db.trainings.update_one(
        {"id": training_id},
        {"$set": {"participants": [p.model_dump() for p in training.participants]}},
    )
    return training


# ---------- Dashboard ----------
@api_router.get("/users/{email}/dashboard")
async def user_dashboard(email: str):
    docs = await db.trainings.find({"participants.email": email}, {"_id": 0}).to_list(1000)
    trainings = [Training(**d) for d in docs]
    now = datetime.now(timezone.utc)

    def parse(dt: str):
        try:
            d = datetime.fromisoformat(dt.replace("Z", "+00:00"))
            if d.tzinfo is None:
                d = d.replace(tzinfo=timezone.utc)
            return d
        except Exception:
            return now

    upcoming, past = [], []
    total_km = 0.0
    permanentka_count = 0
    for t in trainings:
        if parse(t.date) >= now:
            upcoming.append(t)
        else:
            past.append(t)
            total_km += t.distance_km
            if t.use_permanentka:
                permanentka_count += 1
    upcoming.sort(key=lambda t: t.date)
    past.sort(key=lambda t: t.date, reverse=True)
    reset = await db.permanentka_resets.find_one({"email": email}, {"_id": 0})
    baseline = reset["baseline"] if reset else 0
    permanentka_count = max(0, permanentka_count - baseline)
    return {
        "attended_count": len(past),
        "permanentka_count": permanentka_count,
        "upcoming_count": len(upcoming),
        "total_km": round(total_km, 1),
        "upcoming": [t.model_dump() for t in upcoming],
        "past": [t.model_dump() for t in past],
    }


@api_router.get("/")
async def root():
    return {"message": "RunPulse API"}


@api_router.get("/config")
async def get_config():
    return {"admin_emails": sorted(ADMIN_EMAILS)}


@api_router.get("/admin/report")
async def admin_report(admin_email: str):
    if not is_admin(admin_email):
        raise HTTPException(status_code=403, detail="Prístup len pre organizátora")
    docs = await db.trainings.find({}, {"_id": 0}).sort("date", 1).to_list(1000)
    trainings = [Training(**d) for d in docs]
    now = datetime.now(timezone.utc)

    def parse(dt: str):
        try:
            d = datetime.fromisoformat(dt.replace("Z", "+00:00"))
            if d.tzinfo is None:
                d = d.replace(tzinfo=timezone.utc)
            return d
        except Exception:
            return now

    # attended count per email = number of PAST trainings they participated in
    attended = {}
    registered_total = {}
    permanentka = {}
    names = {}
    for t in trainings:
        past = parse(t.date) < now
        for p in t.participants:
            registered_total[p.email] = registered_total.get(p.email, 0) + 1
            names[p.email] = p.name
            if past:
                attended[p.email] = attended.get(p.email, 0) + 1
                if t.use_permanentka:
                    permanentka[p.email] = permanentka.get(p.email, 0) + 1

    runners = []
    resets = {r["email"]: r["baseline"] for r in await db.permanentka_resets.find({}, {"_id": 0}).to_list(1000)}
    for email in sorted(registered_total.keys(), key=lambda e: attended.get(e, 0), reverse=True):
        perm = max(0, permanentka.get(email, 0) - resets.get(email, 0))
        stamps = 0 if perm == 0 else ((perm - 1) % 10) + 1
        runners.append({
            "name": names.get(email, email),
            "email": email,
            "attended_count": attended.get(email, 0),
            "registered_count": registered_total.get(email, 0),
            "permanentka_count": perm,
            "permanentka_stamps": stamps,
            "permanentka_remaining": 10 - stamps,
            "completed_cards": perm // 10,
        })

    result = []
    for t in trainings:
        result.append({
            "id": t.id,
            "title": t.title,
            "date": t.date,
            "location": t.location,
            "distance_km": t.distance_km,
            "capacity": t.capacity,
            "is_past": parse(t.date) < now,
            "participants": [
                {
                    "name": p.name,
                    "email": p.email,
                    "attended_count": attended.get(p.email, 0),
                    "registered_count": registered_total.get(p.email, 0),
                }
                for p in t.participants
            ],
        })
    return {"trainings": result, "runners": runners}


@api_router.post("/admin/reset-permanentka")
async def reset_permanentka(body: ResetPermanentkaBody):
    if not is_admin(body.admin_email):
        raise HTTPException(status_code=403, detail="Prístup len pre organizátora")
    now = datetime.now(timezone.utc)

    def parse(dt: str):
        try:
            d = datetime.fromisoformat(dt.replace("Z", "+00:00"))
            if d.tzinfo is None:
                d = d.replace(tzinfo=timezone.utc)
            return d
        except Exception:
            return now

    docs = await db.trainings.find({"participants.email": body.email}, {"_id": 0}).to_list(1000)
    raw = 0
    for d in docs:
        t = Training(**d)
        if parse(t.date) < now and t.use_permanentka:
            raw += 1
    await db.permanentka_resets.update_one(
        {"email": body.email},
        {"$set": {"email": body.email, "baseline": raw, "reset_at": now.isoformat()}},
        upsert=True,
    )
    return {"email": body.email, "permanentka_count": 0, "baseline": raw}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
