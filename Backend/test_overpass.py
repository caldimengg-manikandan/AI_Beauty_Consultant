import httpx
import asyncio

async def test_overpass():
    lat, lon = 13.0827, 80.2707 # Chennai
    radius = 5000
    query = f"""
    [out:json];
    (
      node["shop"~"beauty|hairdresser"](around:{radius},{lat},{lon});
      node["leisure"="spa"](around:{radius},{lat},{lon});
    );
    out;
    """
    async with httpx.AsyncClient() as client:
        resp = await client.post("https://overpass-api.de/api/interpreter", data={"data": query})
        print(len(resp.json()["elements"]))
        print(resp.json()["elements"][:2])

asyncio.run(test_overpass())
