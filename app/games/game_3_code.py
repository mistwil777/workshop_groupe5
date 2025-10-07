# app/games/game_3_code.py
# Énigme 3 : Le Code Secret Partagé
# Chaque joueur reçoit un indice différent pour un chiffre du code. La communication est essentielle.

def create_state(level):
    return {
        'secret_code': '335',
        'clues': [
            "Le 1er chiffre est le nombre de pales d'une éolienne.",  # 3
            "Le 2e chiffre est le nb de couleurs primaires.",         # 3
            "Le 3e chiffre est le nb de poubelles de tri.",           # 5
        ],
        'partie_terminee': False,
        'gagne': False,
        'code_propose': '',
        'joueurs': [],  # Pour garder l'ordre d'arrivée
        'indice': "Chaque joueur a un indice différent. Communiquez pour reconstituer le code complet à 3 chiffres."
    }

def handle_action(room, sid, action):
    state = room['jeu3_state']
    # Enregistre l'ordre d'arrivée des joueurs
    if sid not in state['joueurs']:
        state['joueurs'].append(sid)
    if action.get('type') == 'submit_code':
        code = str(action.get('code', '')).strip().lower()
        # Supprime espaces et articles pour la comparaison
        code = code.replace(' ', '').replace('le', '').replace('la', '').replace('les', '').replace("l'", '')
        secret = state['secret_code'].lower()
        secret = secret.replace(' ', '').replace('le', '').replace('la', '').replace('les', '').replace("l'", '')
        state['code_propose'] = code
        if code == secret:
            state['gagne'] = True
            state['partie_terminee'] = True
            room['vue_actuelle'] = 'indice3'
            # Ajoute la lettre R aux indices collectés
            if 'indices_collectes' in room and len(room['indices_collectes']) < 3:
                room['indices_collectes'].append('R')
        else:
            state['gagne'] = False
            state['partie_terminee'] = False
    # Pas de retour spécial, la room_update suffit
