# Utiliser une image Python officielle
FROM python:3.10-slim

# Définir le répertoire de travail dans le conteneur
WORKDIR /usr/src/app

# Copier le fichier des dépendances
COPY requirements.txt ./

# Installer les dépendances
RUN pip install --no-cache-dir -r requirements.txt

# Copier le reste du code de l'application
COPY ./green-lockdown/app /usr/src/app/app

# Exposer le port sur lequel l'application tourne
EXPOSE 5000

# Commande pour lancer l'application avec eventlet pour SocketIO
CMD ["python", "-m", "eventlet.wsgi", "-p", "5000", "app.main:app"]
