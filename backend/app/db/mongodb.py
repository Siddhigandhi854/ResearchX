from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import get_settings


class MongoDB:
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None


mongodb = MongoDB()


async def connect_to_mongo() -> None:
    settings = get_settings()
    mongodb.client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
    mongodb.db = mongodb.client[settings.mongodb_database]
    try:
        await mongodb.client.admin.command("ping")
        print("Successfully connected to MongoDB database:", settings.mongodb_database)
    except Exception as exc:
        print(f"MongoDB connection warning during startup: {exc}")
        print("--> NOTE: If using MongoDB Atlas, ensure your IP address is added under Network Access (0.0.0.0/0) in MongoDB Atlas Dashboard.")




async def close_mongo_connection() -> None:
    if mongodb.client is not None:
        mongodb.client.close()
        mongodb.client = None
        mongodb.db = None


def get_database() -> AsyncIOMotorDatabase:
    if mongodb.db is None:
        raise RuntimeError("MongoDB has not been initialized. Call connect_to_mongo() first.")
    return mongodb.db


async def ping_database() -> bool:
    if mongodb.client is None:
        return False
    try:
        await mongodb.client.admin.command("ping")
        return True
    except Exception:
        return False
