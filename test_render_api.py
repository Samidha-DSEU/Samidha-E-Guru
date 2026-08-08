import requests

def main():
    print("Testing Render backend health endpoint...")
    try:
        r = requests.get("https://samidha-e-guru.onrender.com/health", timeout=10)
        print("Health status code:", r.status_code)
        print("Health response:", r.json())
    except Exception as e:
        print("Error connecting to Render backend:", e)

if __name__ == "__main__":
    main()
