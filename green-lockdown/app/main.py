import eventlet
eventlet.monkey_patch()

from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room

import random
import string
from games import game_1_pendu

app = Flask(__name__)
app.config['SECRET_KEY'] = 'workshop_secret_key_2025'
socketio = SocketIO(app, async_mode='eventlet', cors_allowed_origins="*")

# --- Base de données en mémoire pour les parties ---
rooms = {}

# --- Fonctions de création des états de jeu ---


def create_game_state():
    """Crée un nouvel objet d'état complet pour une partie."""
    return {
        'vue_actuelle': 'lobby',
        'joueurs': {},
        'host_sid': None,
        'token': None,
        'indices_collectes': [],
        # --- On prépare l'état pour chaque énigme ---
        'jeu1_state': game_1_pendu.create_state()
        # 'jeu2_state': game_2_xxx.create_state(), # À ajouter plus tard
    }

def generate_token():
    """Génère un token de room unique de 4 lettres."""
    while True:
        token = ''.join(random.choices(string.ascii_uppercase, k=4))
        if token not in rooms:
            return token

# --- Route principale de l'application ---
@app.route('/')
def index():
    return render_template('index.html')

# --- Gestion des Salons (Rooms) ---

@socketio.on('create_room')
def handle_create_room():
    sid = request.sid
    token = generate_token()
    rooms[token] = create_game_state()
    room = rooms[token]
    
    room['token'] = token
    room['host_sid'] = sid
    room['joueurs'][sid] = {'id': sid, 'nom': 'Hôte'}
    
    join_room(token)
    print(f"Room créée: {token} par {sid}")
    emit('room_update', room)

@socketio.on('join_room')
def handle_join_room(data):
    sid = request.sid
    token = data.get('token', '').upper()
    if token in rooms:
        room = rooms[token]
        num_joueur = len(room['joueurs']) + 1
        room['joueurs'][sid] = {'id': sid, 'nom': f'Joueur {num_joueur}'}
        join_room(token)
        print(f"{sid} a rejoint la room {token}")
        emit('room_update', room, to=token)
    else:
        emit('error', {'message': 'Cette partie n\'existe pas.'})
@socketio.on('changer_vue')
def handle_changer_vue(data):
    """Gère la navigation entre les écrans non interactifs."""
    token = data.get('token')
    nouvelle_vue = data.get('vue')
    if token in rooms:
        room = rooms[token]
        # Logique pour assigner l'opérateur quand on entre dans le jeu 1
        if nouvelle_vue == 'jeu1':
            if not room['jeu1_state']['operateur_sid'] and room['joueurs']:
                room['jeu1_state']['operateur_sid'] = list(room['joueurs'].keys())[0]
        emit('room_update', room, to=token)

@socketio.on('start_game')
def handle_start_game(data):
    """Gère le lancement de la partie par l'hôte."""
    sid = request.sid
    token = data.get('token')
    if token in rooms and sid == rooms[token]['host_sid']:
        room = rooms[token]
        room['vue_actuelle'] = 'intro'
        print(f"La partie {token} est lancée par l'hôte.")
        emit('room_update', room, to=token)


# --- Gestion générique des actions de jeu (modulaire) ---

# --- Gestion générique des actions de jeu (modulaire) ---
@socketio.on('game_action')
def handle_game_action(data):
    sid = request.sid
    token = data.get('token')
    game = data.get('game')
    action = data.get('action')
    if token in rooms:
        room = rooms[token]
        vue_change = None
        if game == 'jeu1':
            vue_change = game_1_pendu.handle_action(room, sid, action)
        elif game == 'jeu2':
            from games import game_2_quiz_order
            vue_change = game_2_quiz_order.handle_action(room, sid, action)
        if vue_change:
            room['vue_actuelle'] = vue_change
        emit('room_update', room, to=token)

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000)

