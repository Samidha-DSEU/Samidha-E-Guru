import logging
import certifi
from pymongo import MongoClient
from pymongo.database import Database
from config import settings

logger = logging.getLogger("learn_ai_mongo")

class MongoManager:
    client: MongoClient = None
    db: Database = None

mongo_manager = MongoManager()

def get_mongo_db() -> Database:
    """Retrieves or initializes the MongoDB Atlas database connection with TLS CA bundle."""
    if mongo_manager.db is None:
        try:
            logger.info(f"Connecting to MongoDB Atlas database '{settings.MONGODB_DB_NAME}'...")
            
            # Additional TLS options for Atlas cloud cluster compatibility
            kwargs = {
                "serverSelectionTimeoutMS": 10000,
                "connectTimeoutMS": 10000,
            }
            
            if "mongodb+srv" in settings.MONGODB_URL or "mongodb.net" in settings.MONGODB_URL:
                try:
                    kwargs["tlsCAFile"] = certifi.where()
                except Exception:
                    pass

            mongo_manager.client = MongoClient(settings.MONGODB_URL, **kwargs)
            mongo_manager.db = mongo_manager.client[settings.MONGODB_DB_NAME]
            # Ensure indexes on collections
            _ensure_indexes(mongo_manager.db)
            logger.info("Successfully connected to MongoDB Atlas!")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB Atlas: {e}")
            raise e
    return mongo_manager.db

def _ensure_indexes(db: Database):
    """Creates performance indexes for document lookup, chunk queries, and workspace cache."""
    try:
        db["ai_documents"].create_index("resource_id", unique=True)
        db["ai_documents"].create_index("file_hash")
        
        db["ai_chunks"].create_index("resource_id")
        db["ai_chunks"].create_index([("resource_id", 1), ("page_number", 1)])
        
        db["ai_workspace_caches"].create_index("resource_id", unique=True)
        db["student_progress"].create_index([("user_id", 1), ("resource_id", 1)], unique=True)
    except Exception as e:
        logger.warning(f"Error initializing MongoDB indexes: {e}")
