from __future__ import annotations

import hashlib
import json
import secrets
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

ROOT = Path(__file__).parent
DB_PATH = ROOT / "insomnia.db"

app = FastAPI(title="Insomnia Market API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@contextmanager
def db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def password_hash(value: str) -> str:
    return hashlib.sha256(("insomnia-market:" + value).encode()).hexdigest()


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def row_dict(row):
    return dict(row) if row else None


def initialize():
    schema = """
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
      artist_name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'artist', active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS releases (
      id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), title TEXT NOT NULL,
      release_type TEXT NOT NULL, genre TEXT, language TEXT, release_date TEXT,
      cover_url TEXT, status TEXT NOT NULL DEFAULT 'На модерации', rejection_reason TEXT,
      upc TEXT, isrc TEXT,
      streams INTEGER DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS finance (
      id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), period TEXT NOT NULL,
      source TEXT NOT NULL, amount REAL NOT NULL, status TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS payout_requests (
      id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), amount REAL NOT NULL,
      card_number TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Ожидает выплаты',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY, category TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL,
      published_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), subject TEXT NOT NULL,
      status TEXT DEFAULT 'Открыт', created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY, ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES users(id), text TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), channel TEXT NOT NULL,
      subject TEXT NOT NULL, body TEXT NOT NULL, read INTEGER DEFAULT 0, created_at TEXT NOT NULL
    );
    """
    with db() as con:
        con.executescript(schema)
        release_columns = {row["name"] for row in con.execute("PRAGMA table_info(releases)").fetchall()}
        if "upc" not in release_columns:
            con.execute("ALTER TABLE releases ADD COLUMN upc TEXT")
        if "isrc" not in release_columns:
            con.execute("ALTER TABLE releases ADD COLUMN isrc TEXT")
        if not con.execute("SELECT 1 FROM users LIMIT 1").fetchone():
            con.execute("INSERT INTO users(email,password,artist_name,role,created_at) VALUES(?,?,?,?,?)",
                        ("artist@insomnia.market", password_hash("insomnia"), "Luna Ray", "artist", now()))
            con.execute("INSERT INTO users(email,password,artist_name,role,created_at) VALUES(?,?,?,?,?)",
                        ("owner@insomnia.market", password_hash("admin"), "Алексей Ковалёв", "owner", now()))
            artist = con.execute("SELECT id FROM users WHERE role='artist'").fetchone()[0]
            releases = [
                (artist, "Neon Dreams", "Сингл", "Pop", "Русский", "2026-07-10", "На модерации", None, 0),
                (artist, "Midnight Echoes", "EP · 5 треков", "Electronic", "Английский", "2026-06-10", "Принят", None, 128440),
                (artist, "Cold Summer", "Сингл", "Pop", "Русский", "2026-06-02", "Черновик", "Обложка содержит мелкий текст. Загрузите версию без надписей.", 0),
            ]
            for item in releases:
                con.execute("""INSERT INTO releases(user_id,title,release_type,genre,language,release_date,status,rejection_reason,streams,created_at,updated_at)
                             VALUES(?,?,?,?,?,?,?,?,?,?,?)""", (*item, now(), now()))
            con.execute("INSERT INTO finance(user_id,period,source,amount,status,updated_at) VALUES(?,?,?,?,?,?)",
                        (artist, "Май 2026", "Все площадки", 32840, "Начислено", now()))
            con.execute("INSERT INTO tickets(user_id,subject,created_at) VALUES(?,?,?)", (artist, "Мой релиз", now()))
            ticket = con.execute("SELECT id FROM tickets LIMIT 1").fetchone()[0]
            admin = con.execute("SELECT id FROM users WHERE role='owner'").fetchone()[0]
            con.execute("INSERT INTO messages(ticket_id,sender_id,text,created_at) VALUES(?,?,?,?)",
                        (ticket, admin, "Привет, Luna! Я из команды поддержки. Чем могу помочь?", now()))


initialize()


class RegisterBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    artist_name: str = Field(min_length=2, max_length=80)


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class ReleaseBody(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    release_type: str = "Сингл"
    genre: str = "Pop"
    language: str = "Русский"
    release_date: str | None = None
    cover_url: str | None = None


class ModerationBody(BaseModel):
    status: Literal["Принят", "Черновик", "На модерации"]
    reason: str | None = None


class StatsBody(BaseModel):
    streams: int = Field(ge=0)


class ReleaseCodesBody(BaseModel):
    upc: str | None = None
    isrc: str | None = None


class FinanceBody(BaseModel):
    user_id: int
    period: str
    source: str = "Все площадки"
    amount: float
    status: str = "Начислено"


class PayoutBody(BaseModel):
    amount: float = Field(gt=0)
    card_number: str = Field(min_length=12, max_length=32)


class PayoutStatusBody(BaseModel):
    status: Literal["Ожидает выплаты", "Оплачено", "Отклонено"]


class MessageBody(BaseModel):
    text: str = Field(min_length=1, max_length=4000)


class AdminBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str
    role: Literal["admin", "moderator", "support"] = "admin"


class AccountStatusBody(BaseModel):
    active: bool


def current_user(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Требуется авторизация")
    token = authorization.removeprefix("Bearer ")
    with db() as con:
        user = con.execute("SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id WHERE token=? AND active=1", (token,)).fetchone()
    if not user:
        raise HTTPException(401, "Сессия недействительна")
    return row_dict(user)


def require_staff(user=Depends(current_user)):
    if user["role"] not in {"owner", "admin", "moderator", "support"}:
        raise HTTPException(403, "Недостаточно прав")
    return user


def notify(con, user_id: int, subject: str, body: str):
    """Stores both an in-app and email notification for the mail worker."""
    for channel in ("app", "email"):
        con.execute("INSERT INTO notifications(user_id,channel,subject,body,created_at) VALUES(?,?,?,?,?)",
                    (user_id, channel, subject, body, now()))


@app.get("/health")
def health():
    return {"status": "ok", "service": "insomnia-market"}


@app.post("/auth/register", status_code=201)
def register(body: RegisterBody):
    with db() as con:
        try:
            cur = con.execute("INSERT INTO users(email,password,artist_name,role,created_at) VALUES(?,?,?,?,?)",
                              (body.email.lower(), password_hash(body.password), body.artist_name, "artist", now()))
        except sqlite3.IntegrityError:
            raise HTTPException(409, "Пользователь уже существует")
        token = secrets.token_urlsafe(32)
        con.execute("INSERT INTO sessions(token,user_id,created_at) VALUES(?,?,?)", (token, cur.lastrowid, now()))
    return {"token": token, "user": {"id": cur.lastrowid, "email": body.email, "artist_name": body.artist_name, "role": "artist"}}


@app.post("/auth/login")
def login(body: LoginBody):
    with db() as con:
        user = con.execute("SELECT * FROM users WHERE email=? AND password=? AND active=1",
                           (body.email.lower(), password_hash(body.password))).fetchone()
        if not user:
            raise HTTPException(401, "Неверная почта или пароль")
        token = secrets.token_urlsafe(32)
        con.execute("INSERT INTO sessions(token,user_id,created_at) VALUES(?,?,?)", (token, user["id"], now()))
    safe = row_dict(user); safe.pop("password")
    return {"token": token, "user": safe}


@app.get("/releases")
def list_releases(user=Depends(current_user)):
    with db() as con:
        if user["role"] == "artist":
            rows = con.execute("SELECT * FROM releases WHERE user_id=? ORDER BY id DESC", (user["id"],)).fetchall()
        else:
            rows = con.execute("SELECT releases.*, users.artist_name FROM releases JOIN users ON users.id=releases.user_id ORDER BY releases.id DESC").fetchall()
    return [row_dict(x) for x in rows]


@app.post("/releases", status_code=201)
def create_release(body: ReleaseBody, user=Depends(current_user)):
    with db() as con:
        cur = con.execute("""INSERT INTO releases(user_id,title,release_type,genre,language,release_date,cover_url,status,created_at,updated_at)
                           VALUES(?,?,?,?,?,?,?,?,?,?)""",
                          (user["id"], body.title, body.release_type, body.genre, body.language, body.release_date,
                           body.cover_url, "На модерации", now(), now()))
        release = con.execute("SELECT * FROM releases WHERE id=?", (cur.lastrowid,)).fetchone()
    return row_dict(release)


@app.patch("/admin/releases/{release_id}/moderation")
def moderate_release(release_id: int, body: ModerationBody, staff=Depends(require_staff)):
    if body.status == "Черновик" and not body.reason:
        raise HTTPException(422, "При отклонении укажите причину")
    with db() as con:
        release = con.execute("SELECT * FROM releases WHERE id=?", (release_id,)).fetchone()
        if not release:
            raise HTTPException(404, "Релиз не найден")
        con.execute("UPDATE releases SET status=?, rejection_reason=?, updated_at=? WHERE id=?",
                    (body.status, body.reason if body.status == "Черновик" else None, now(), release_id))
        subject = f"Релиз «{release['title']}»: {body.status}"
        text = body.reason if body.status == "Черновик" else "Релиз прошёл ручную модерацию и принят."
        notify(con, release["user_id"], subject, text)
    return {"ok": True, "notification": "Созданы уведомления в кабинете и по email"}


@app.patch("/admin/releases/{release_id}/stats")
def update_stats(release_id: int, body: StatsBody, staff=Depends(require_staff)):
    with db() as con:
        result = con.execute("UPDATE releases SET streams=?,updated_at=? WHERE id=?", (body.streams, now(), release_id))
        if not result.rowcount:
            raise HTTPException(404, "Релиз не найден")
    return {"ok": True, "streams": body.streams}


@app.patch("/admin/releases/{release_id}/codes")
def update_release_codes(release_id: int, body: ReleaseCodesBody, staff=Depends(require_staff)):
    with db() as con:
        result = con.execute("UPDATE releases SET upc=?,isrc=?,updated_at=? WHERE id=?",
                             (body.upc, body.isrc, now(), release_id))
        if not result.rowcount:
            raise HTTPException(404, "Релиз не найден")
    return {"ok": True, "upc": body.upc, "isrc": body.isrc}


@app.get("/finance")
def get_finance(user=Depends(current_user)):
    with db() as con:
        rows = con.execute("SELECT * FROM finance WHERE user_id=? ORDER BY id DESC", (user["id"],)).fetchall()
        payouts = con.execute("SELECT * FROM payout_requests WHERE user_id=? ORDER BY id DESC", (user["id"],)).fetchall()
    return {"balance": sum(x["amount"] for x in rows if x["status"] == "Начислено"), "history": [row_dict(x) for x in rows], "payouts": [row_dict(x) for x in payouts]}


@app.post("/finance/payouts", status_code=201)
def request_payout(body: PayoutBody, user=Depends(current_user)):
    with db() as con:
        cur = con.execute("""INSERT INTO payout_requests(user_id,amount,card_number,status,created_at,updated_at)
                          VALUES(?,?,?,?,?,?)""",
                          (user["id"], body.amount, body.card_number, "Ожидает выплаты", now(), now()))
        staff_rows = con.execute("SELECT id FROM users WHERE role IN ('owner','admin') AND active=1").fetchall()
        for staff_row in staff_rows:
            notify(con, staff_row["id"], "Новая заявка на выплату", f"{user['artist_name']} запросил выплату {body.amount:.2f} ₽")
    return {"id": cur.lastrowid, "status": "Ожидает выплаты"}


@app.post("/admin/finance", status_code=201)
def add_finance(body: FinanceBody, staff=Depends(require_staff)):
    with db() as con:
        cur = con.execute("INSERT INTO finance(user_id,period,source,amount,status,updated_at) VALUES(?,?,?,?,?,?)",
                          (body.user_id, body.period, body.source, body.amount, body.status, now()))
        notify(con, body.user_id, "Новое начисление", f"За период {body.period} начислено {body.amount:.2f} ₽")
    return {"id": cur.lastrowid, "ok": True}


@app.get("/admin/payouts")
def admin_payouts(staff=Depends(require_staff)):
    with db() as con:
        rows = con.execute("""SELECT payout_requests.*,users.artist_name,users.email
                           FROM payout_requests JOIN users ON users.id=payout_requests.user_id
                           ORDER BY payout_requests.id DESC""").fetchall()
    return [row_dict(x) for x in rows]


@app.patch("/admin/payouts/{payout_id}")
def update_payout(payout_id: int, body: PayoutStatusBody, staff=Depends(require_staff)):
    with db() as con:
        payout = con.execute("SELECT * FROM payout_requests WHERE id=?", (payout_id,)).fetchone()
        if not payout:
            raise HTTPException(404, "Заявка не найдена")
        con.execute("UPDATE payout_requests SET status=?,updated_at=? WHERE id=?", (body.status, now(), payout_id))
        notify(con, payout["user_id"], "Статус выплаты обновлён", f"Ваша заявка на выплату: {body.status}")
    return {"ok": True, "status": body.status}


@app.get("/support/tickets")
def tickets(user=Depends(current_user)):
    with db() as con:
        if user["role"] == "artist":
            rows = con.execute("SELECT * FROM tickets WHERE user_id=? ORDER BY id DESC", (user["id"],)).fetchall()
        else:
            rows = con.execute("SELECT tickets.*,users.artist_name FROM tickets JOIN users ON users.id=tickets.user_id ORDER BY tickets.id DESC").fetchall()
    return [row_dict(x) for x in rows]


@app.get("/support/tickets/{ticket_id}/messages")
def ticket_messages(ticket_id: int, user=Depends(current_user)):
    with db() as con:
        rows = con.execute("SELECT messages.*,users.artist_name,users.role FROM messages JOIN users ON users.id=messages.sender_id WHERE ticket_id=? ORDER BY id", (ticket_id,)).fetchall()
    return [row_dict(x) for x in rows]


@app.post("/support/tickets/{ticket_id}/messages", status_code=201)
def send_message(ticket_id: int, body: MessageBody, user=Depends(current_user)):
    with db() as con:
        ticket = con.execute("SELECT * FROM tickets WHERE id=?", (ticket_id,)).fetchone()
        if not ticket:
            raise HTTPException(404, "Диалог не найден")
        if user["role"] == "artist" and ticket["user_id"] != user["id"]:
            raise HTTPException(403, "Нет доступа")
        cur = con.execute("INSERT INTO messages(ticket_id,sender_id,text,created_at) VALUES(?,?,?,?)",
                          (ticket_id, user["id"], body.text, now()))
    return {"id": cur.lastrowid, "text": body.text, "created_at": now()}


@app.get("/admin/users")
def admins(staff=Depends(require_staff)):
    with db() as con:
        rows = con.execute("SELECT id,email,artist_name,role,active,created_at FROM users WHERE role!='artist'").fetchall()
    return [row_dict(x) for x in rows]


@app.get("/admin/accounts")
def accounts(staff=Depends(require_staff)):
    with db() as con:
        rows = con.execute("""SELECT id,email,artist_name,role,active,created_at
                           FROM users WHERE role='artist' ORDER BY id DESC""").fetchall()
    return [row_dict(x) for x in rows]


@app.patch("/admin/accounts/{user_id}")
def update_account_status(user_id: int, body: AccountStatusBody, staff=Depends(require_staff)):
    with db() as con:
        result = con.execute("UPDATE users SET active=? WHERE id=? AND role='artist'", (1 if body.active else 0, user_id))
        if not result.rowcount:
            raise HTTPException(404, "Кабинет не найден")
    return {"ok": True, "active": body.active}


@app.post("/admin/users", status_code=201)
def add_admin(body: AdminBody, staff=Depends(require_staff)):
    if staff["role"] != "owner":
        raise HTTPException(403, "Только владелец может добавлять администраторов")
    with db() as con:
        try:
            cur = con.execute("INSERT INTO users(email,password,artist_name,role,created_at) VALUES(?,?,?,?,?)",
                              (body.email.lower(), password_hash(body.password), body.name, body.role, now()))
        except sqlite3.IntegrityError:
            raise HTTPException(409, "Такая почта уже используется")
    return {"id": cur.lastrowid, "ok": True}


@app.delete("/admin/users/{user_id}")
def remove_admin(user_id: int, staff=Depends(require_staff)):
    if staff["role"] != "owner":
        raise HTTPException(403, "Только владелец может удалять администраторов")
    if user_id == staff["id"]:
        raise HTTPException(400, "Нельзя удалить собственный аккаунт")
    with db() as con:
        result = con.execute("UPDATE users SET active=0 WHERE id=? AND role!='owner'", (user_id,))
        if not result.rowcount:
            raise HTTPException(404, "Администратор не найден")
    return {"ok": True}


@app.get("/notifications")
def notifications(user=Depends(current_user)):
    with db() as con:
        rows = con.execute("SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 30", (user["id"],)).fetchall()
    return [row_dict(x) for x in rows]
