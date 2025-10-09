# app/games/game_3_code.py
import json
import random

def create_state(level):
    """
    Crée l'état initial pour le jeu 3 en lisant le fichier enigmes.json
    et en choisissant une énigme au hasard en fonction du niveau.
    """
    # 1. Lire le fichier de données
    with open('app/data/enigmes.json', encoding='utf-8') as f:
        data = json.load(f)

    # 2. Naviguer jusqu'aux données du jeu 3 pour le bon niveau
    game_data = data.get('jeu3_code_secret', {})
    level_data = game_data.get(level, game_data.get('college', {})) # "college" par défaut
    
    # 3. Choisir un "item" (un ensemble de questions/solution) au hasard
    items_disponibles = level_data.get('items', [])
    item_choisi = random.choice(items_disponibles) if items_disponibles else {
        'solution': '000', 'clues': ['Erreur de chargement des questions.']
    }

    # 4. Créer l'état du jeu avec les données choisies au hasard
    return {
        'secret_code': item_choisi['solution'],
        'clues': item_choisi['clues'], # La liste des questions/indices
        'partie_terminee': False,
        'gagne': False,
        'code_propose': '',
        'joueurs': [],  # Pour garder l'ordre d'arrivée des joueurs
        'indice': level_data.get('description', 'Communiquez pour trouver le code.')
    }

def handle_action(room, sid, action):
    state = room['jeu3_state']
    
    # Enregistre l'ordre d'arrivée des joueurs pour leur distribuer une question différente
    if sid not in state['joueurs']:
        state['joueurs'].append(sid)
        
    if action.get('type') == 'submit_code':
        code = str(action.get('code', '')).strip()
        secret = state['secret_code']
        state['code_propose'] = code
        if code == secret:
            state['gagne'] = True
            state['partie_terminee'] = True
    # La décision de changer de vue (vers 'indice3') est gérée par main.py