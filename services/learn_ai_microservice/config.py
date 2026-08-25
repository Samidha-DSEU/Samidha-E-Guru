import os

class Settings:
    SERVICE_NAME: str = "samidha-learn-ai-service"
    PORT: int = int(os.getenv("PORT", "8001"))
    
    # MongoDB Atlas Connection
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "samidha_ai_db")
    
    # Groq LLM Key
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
    
    # ChatPDF API Key
    CHATPDF_API_KEY: str = os.getenv("CHATPDF_API_KEY", "")

settings = Settings()
