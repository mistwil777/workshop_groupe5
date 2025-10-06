# -*- coding: utf-8 -*-

# --- Importations des librairies nécessaires ---
from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room, leave_room

# --- Initialisation de l'application Flask et de SocketIO ---
app = Flask(__name__)
# Une clé secrète est nécessaire pour sécuriser les sessions et les communications
app.config['SECRET_KEY'] = 'la-cle-secrete-de-votre-equipe' 
# L'async_mode='eventlet' est recommandé pour de meilleures performances avec SocketIO
socketio = SocketIO(app, async_mode='eventlet', cors_allowed_origins="*")

# --- État du jeu ---
# C'est un dictionnaire qui va contenir toutes les informations de notre jeu.
# Il est stocké en mémoire sur le serveur.
game_state = {
    'mot_a_deviner': list("RECYCLAGE"),
    'mot_affiche': [],
    'lettres_proposees': set(),
    'erreurs': 0,
    'max_erreurs': 6,
    'partie_terminee': False,
    'message': "En attente des joueurs...",
    'joueurs': {}, # Dictionnaire pour stocker les infos des joueurs (ID: role)
    'operateur_sid': None
}

# Initialise le mot affiché avec des tirets
game_state['mot_affiche'] = ['_' for _ in game_state['mot_a_deviner']]


# --- Routes de l'application ---

# Route principale qui affiche la page du jeu
@app.route('/')
def index():
    # render_template va chercher le fichier dans le dossier /templates
    return render_template('index.html')

# --- Événements SocketIO (le coeur de la logique temps réel) ---

@socketio.on('connect')
def handle_connect():
    """
    Gère la connexion d'un nouveau client.
    """
    # request.sid est un identifiant unique pour chaque connexion client
    sid = request.sid
    
    # Le premier joueur à se connecter devient l'opérateur
    if not game_state['operateur_sid']:
        game_state['operateur_sid'] = sid
        game_state['joueurs'][sid] = 'operateur'
        game_state['message'] = "Un opérateur a rejoint. C'est à lui/elle de jouer !"
    else:
        game_state['joueurs'][sid] = 'observateur'
    
    print(f"Client connecté: {sid}, Rôle: {game_state['joueurs'][sid]}")
    
    # On envoie l'état complet du jeu à TOUS les clients connectés
    # 'broadcast=True' signifie "envoyer à tout le monde"
    emit('mise_a_jour_etat', game_state, broadcast=True)


@socketio.on('proposer_lettre')
def handle_proposer_lettre(data):
    """
    Gère la proposition d'une lettre par l'opérateur.
    """
    sid = request.sid
    # On vérifie si la partie n'est pas terminée ET si le joueur est bien l'opérateur
    if not game_state['partie_terminee'] and sid == game_state['operateur_sid']:
        lettre = data['lettre'].upper()

        # On vérifie que la lettre n'a pas déjà été jouée
        if lettre not in game_state['lettres_proposees']:
            game_state['lettres_proposees'].add(lettre)

            # Si la lettre est dans le mot
            if lettre in game_state['mot_a_deviner']:
                # On met à jour le mot affiché
                for i, l in enumerate(game_state['mot_a_deviner']):
                    if l == lettre:
                        game_state['mot_affiche'][i] = lettre
            # Si la lettre n'est pas dans le mot
            else:
                game_state['erreurs'] += 1

            # On vérifie si la partie est gagnée ou perdue
            check_game_over()
        
        # Après chaque action, on envoie le nouvel état à tout le monde
        emit('mise_a_jour_etat', game_state, broadcast=True)


def check_game_over():
    """
    Vérifie l'état de la partie (gagnée, perdue ou en cours).
    """
    # Condition de victoire : il n'y a plus de '_' dans le mot affiché
    if '_' not in game_state['mot_affiche']:
        game_state['partie_terminee'] = True
        game_state['message'] = "Gagné ! Le mot était bien RECYCLAGE. Passage à l'énigme suivante..."
    
    # Condition de défaite : le nombre max d'erreurs est atteint
    elif game_state['erreurs'] >= game_state['max_erreurs']:
        game_state['partie_terminee'] = True
        game_state['message'] = f"Perdu ! Le mot était RECYCLAGE."

@socketio.on('disconnect')
def handle_disconnect():
    """
    Gère la déconnexion d'un client.
    """
    sid = request.sid
    print(f"Client déconnecté: {sid}")
    # Si l'opérateur se déconnecte, il faudrait une logique pour en élire un nouveau (simplification pour l'instant)
    if sid in game_state['joueurs']:
        del game_state['joueurs'][sid]
        if sid == game_state['operateur_sid']:
            game_state['operateur_sid'] = None # Réinitialise l'opérateur
            print("L'opérateur s'est déconnecté.")
    
    emit('mise_a_jour_etat', game_state, broadcast=True)


# --- Point d'entrée pour lancer l'application ---
if __name__ == '__main__':
    # socketio.run est la commande pour démarrer le serveur de développement
    socketio.run(app, debug=True, port=5000)
