FROM python:3.11

WORKDIR /app

VOLUME ["/app/db"]

COPY . /app

RUN apt update && apt install sqlite3

RUN pip install --no-cache-dir -r requirements.txt

ENV GUNICORN_CMD_ARGS="--keep-alive 0"

EXPOSE 8001

CMD ["/bin/sh", "-c", "uvicorn main:app --host 0.0.0.0 --port 8001"]
