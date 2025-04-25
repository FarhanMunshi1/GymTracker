FROM python:3.11

WORKDIR /app

COPY . /app

RUN apt update && apt install sqlite3

RUN mkdir db && cd db

RUN sqlite3 GymApp.db ".databases"

RUN pip install --no-cache-dir -r requirements.txt

ENV GUNICORN_CMD_ARGS="--keep-alive 0"

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
