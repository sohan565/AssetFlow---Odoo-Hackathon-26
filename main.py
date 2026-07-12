from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import models
from database import engine, get_db, SessionLocal

# Tables create karna
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Default Admin create karna (Startup pe)
@app.on_event("startup")
def create_default_admin():
    db = SessionLocal()
    # Check if admin already exists
    if not db.query(models.User).filter(models.User.username == "admin").first():
        db.add(models.User(username="admin", role="Admin"))
        db.commit()
    db.close()

# 1. Dashboard Stats
@app.get("/dashboard/stats/")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(models.Asset).count()
    available = db.query(models.Asset).filter(models.Asset.status == "Available").count()
    return {"total_assets": total, "available_assets": available}

# 2. Login Logic
@app.post("/login/")
def login(username: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        # Naya user automatic create ho jayega agar pehli baar login kare
        role = "Admin" if username == "admin" else "User"
        user = models.User(username=username, role=role)
        db.add(user)
        db.commit()
        db.refresh(user)
    return {"username": user.username, "role": user.role, "user_id": user.id}

# 3. Asset Management
@app.post("/assets/")
def create_asset(name: str, tag: str, db: Session = Depends(get_db)):
    new_asset = models.Asset(name=name, tag_number=tag, status="Available")
    db.add(new_asset)
    db.commit()
    return {"message": "Success", "asset": new_asset}

@app.get("/assets/")
def get_assets(db: Session = Depends(get_db)):
    return db.query(models.Asset).all()

# 4. Status aur Assignment Update
@app.put("/assets/{tag}/update-status/")
def update_status(tag: str, new_status: str, db: Session = Depends(get_db)):
    asset = db.query(models.Asset).filter(models.Asset.tag_number == tag).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    asset.status = new_status
    db.commit()
    return {"message": "Status updated"}

@app.put("/assets/{tag}/assign/")
def assign_asset(tag: str, user_id: int, db: Session = Depends(get_db)):
    asset = db.query(models.Asset).filter(models.Asset.tag_number == tag).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    asset.assigned_user_id = user_id
    asset.status = "Allocated"
    db.commit()
    return {"message": "Asset successfully assigned", "assigned_to": user_id}