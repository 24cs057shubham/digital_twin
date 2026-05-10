from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./digital_twin_production.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Log(Base):
    __tablename__ = "process_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime)
    level = Column(String)  # INFO, WARNING, ERROR, CRITICAL
    message = Column(String)
    meta_data = Column(JSON, nullable=True) # Snapshot of reactor state

class TelemetryHistory(Base):
    __tablename__ = "telemetry"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime)
    temperature = Column(Float)
    pressure = Column(Float)
    ph = Column(Float)
    purity = Column(Float)

def init_db():
    Base.metadata.create_all(bind=engine)
