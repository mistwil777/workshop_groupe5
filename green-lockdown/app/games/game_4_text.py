# app/games/game_4_text.py
import json
import random

def create_state(level):
    """
    Crée l'état initial pour le jeu 4 en lisant le fichier enigmes.json
    et en choisissant une phrase au hasard en fonction du niveau.
    """
    # 1. Lire le fichier de données
    with open('app/data/enigmes.json', encoding='utf-8') as f:
        data = json.load(f)

    # 2. Naviguer jusqu'aux données du jeu 4 pour le bon niveau
    game_data = data.get('jeu4_texte_fragmente', {})
    level_data = game_data.get(level, game_data.get('college', {})) # "college" par défaut
    
    # 3. Choisir une phrase (un "item") au hasard dans la liste
    items_disponibles = level_data.get('items', [])
    item_choisi = random.choice(items_disponibles) if items_disponibles else {
        'fragments': ['ERREUR'], 'solution': 'ERREUR'
    }
    
    # 4. Créer l'état du jeu avec les données choisies au hasard
    return {
        'secret_sentence': item_choisi['solution'],
        'fragments': item_choisi['fragments'],
        'partie_terminee': False,
        'gagne': False,
        'phrase_proposee': '',
        'joueurs': [],
        'indice': level_data.get('description', 'Remettez la phrase dans l\'ordre.')
    }

def handle_action(room, sid, action):
    state = room['jeu4_state']
    if sid not in state['joueurs']:
        state['joueurs'].append(sid)
        
    if action.get('type') == 'submit_sentence':
        # On normalise la phrase proposée par le joueur (minuscules, espaces uniques)
        phrase_proposee = ' '.join(str(action.get('sentence', '')).strip().lower().split())
        
        # On normalise la phrase secrète de la même manière
        phrase_secrete = ' '.join(state['secret_sentence'].strip().lower().split())
        
        state['phrase_proposee'] = action.get('sentence', '') # On garde la proposition originale pour l'affichage
        
        # On compare les phrases normalisées
        if phrase_proposee == phrase_secrete:
            state['gagne'] = True
            state['partie_terminee'] = True
        else:
            state['gagne'] = False
            state['partie_terminee'] = False