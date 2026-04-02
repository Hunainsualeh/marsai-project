import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/marsai_logs")

class DataBase:
    client: AsyncIOMotorClient = None

db = DataBase()

async def connect_to_mongo():
    print(f"Connecting to MongoDB at {MONGO_URL}")
    db.client = AsyncIOMotorClient(MONGO_URL)

async def close_mongo_connection():
    db.client.close()
    print("Closed connection with MongoDB")

def get_database():
    return db.client.get_database("marsai_logs")
