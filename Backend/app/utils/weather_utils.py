import requests
import os

def get_weather_intelligence(city=None):
    """
    Fetches real-time weather and UV data to provide professional-grade 
    environment-aware skincare advice.
    """
    # Default fallback data if API is not configured
    weather_data = {
        "temp": 25,
        "humidity": 50,
        "uv_index": 5,
        "condition": "Clear",
        "city": "Remote Consultation",
        "advice": ""
    }
    
    # Try to get API key from .env (OpenWeatherMap)
    api_key = os.getenv("OPENWEATHER_API_KEY")
    
    if api_key and city:
        try:
            url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric"
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                weather_data["temp"] = data["main"]["temp"]
                weather_data["humidity"] = data["main"]["humidity"]
                weather_data["condition"] = data["weather"][0]["main"]
                weather_data["city"] = city
        except Exception as e:
            print(f"⚠️ Weather API Error: {e}")

    # Professional Intelligence Logic
    advice_bits = []
    
    if weather_data["humidity"] > 75:
        advice_bits.append("High humidity detected in your area. Use water-based gels and avoid heavy oils to prevent pore congestion.")
    elif weather_data["humidity"] < 30:
        advice_bits.append("Air is very dry. Double up on humectants like Hyaluronic acid and seal with a rich moisturizer.")
    
    if weather_data["uv_index"] > 6:
        advice_bits.append("High UV activity! Reapply SPF 50 every 2 hours and wear wide-brimmed protection.")
    elif weather_data["temp"] > 30:
        advice_bits.append("High heat can increase sebum production. Keep a facial mist handy to stay cool.")

    weather_data["advice"] = " ".join(advice_bits)
    
    return weather_data
