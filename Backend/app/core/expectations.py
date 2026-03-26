from fastapi import HTTPException

def bad_request(msg):
    raise HTTPException(status_code=400, detail=msg)

def unauthorized():
    raise HTTPException(status_code=401, detail="Unauthorized")
