# app.py
from flask import Flask, render_template

# Initialise l'application Flask
app = Flask(__name__)

# L'unique rôle de cette route est de servir la page d'accueil de l'escape game.
# Cette page contiendra les liens vers les différents jeux.
@app.route('/')
def home():
    """Sert la page d'accueil principale du jeu."""
    return render_template('index.html')

# Le reste de la logique (API, etc.) a été supprimé car
# chaque jeu est maintenant autonome.

if __name__ == '__main__':
    # Lance le serveur web. Le joueur commencera son aventure en visitant http://127.0.0.1:5000
    app.run(debug=True)