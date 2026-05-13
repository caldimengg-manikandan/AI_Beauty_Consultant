import requests

def test_signup():
    url = "http://localhost:8000/api/auth/signup"
    data = {
        "email": "jasminedorathyvasantharaj@gmail.com",
        "password": "testpassword123"
    }
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_signup()
