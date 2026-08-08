import os
import sys
import subprocess

# Path to virtual environment python interpreter
VENV_PYTHON = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend", "venv", "Scripts", "python.exe")

# Automatically switch to virtualenv python if invoked via global python
if os.path.exists(VENV_PYTHON) and sys.executable.lower() != VENV_PYTHON.lower():
    result = subprocess.run([VENV_PYTHON] + sys.argv)
    sys.exit(result.returncode)

# Ensure backend folder is in Python search path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend"))

import uvicorn

if __name__ == "__main__":
    print("\n" + "=" * 65)
    print("STARTING SAMIDHA E-GURU PRODUCTION BACKEND SERVER")
    print("Local URL : http://localhost:8000")
    print("API Docs  : http://localhost:8000/docs")
    print("=" * 65 + "\n")
    
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
