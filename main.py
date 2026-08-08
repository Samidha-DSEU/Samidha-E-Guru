import os
import sys
import uvicorn

# Automatically add backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend"))

if __name__ == "__main__":
    print("\n" + "=" * 65)
    print("🚀 STARTING SAMIDHA E-GURU PRODUCTION BACKEND SERVER")
    print("📍 Local URL : http://localhost:8000")
    print("📚 API Docs  : http://localhost:8000/docs")
    print("=" * 65 + "\n")
    
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
