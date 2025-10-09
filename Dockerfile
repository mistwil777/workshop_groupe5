# Utiliser une image Python officielle
FROM python:3.10-slim

WORKDIR /usr/src/app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code de l'application et les données
COPY ./green-lockdown/app /usr/src/app/app
COPY ./green-lockdown/app/data /usr/src/app/app/data

EXPOSE 5000

CMD ["python", "app/main.py"]
