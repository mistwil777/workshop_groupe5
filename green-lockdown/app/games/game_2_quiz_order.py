# app/games/game_2_quiz_order.py
import random

def create_state():
    return {
        'scenario': None,  # Sera injecté par le moteur
        'indices_reveles': [False, False, False, False],
        'code_propose': '',
        'gagne': False,
        'erreurs': [0, 0, 0, 0],  # Compteur d'erreurs par question
        'indices_aide': [False, False, False, False],  # Affichage de l'indice d'aide
        'indices_chiffres': [],  # Ajouté dynamiquement par le main
        'code_final': ''         # Ajouté dynamiquement par le main
    }

def handle_action(room, sid, action_data):
    state = room['jeu2_state']
    scenario = state['scenario']
    if not scenario:
        return
    action_type = action_data.get('type')
    if action_type == 'quiz_answer':
        force_idx = action_data.get('force_idx')
        reponse = str(action_data.get('reponse', '')).strip().lower()
        bonne_reponse = str(scenario['forces'][force_idx]['answer']).strip().lower()
        if reponse == bonne_reponse:
            state['indices_reveles'][force_idx] = True
            state['indices_aide'][force_idx] = False  # On masque l'aide si réussite
        else:
            # Incrémente le compteur d'erreurs
            state['erreurs'][force_idx] += 1
            # Si 2 erreurs, on affiche l'indice d'aide
            if state['erreurs'][force_idx] >= 2:
                state['indices_aide'][force_idx] = True
    elif action_type == 'submit_code':
        code = str(action_data.get('code', '')).strip().replace(' ', '').lower()
        secret = ''.join(state.get('indices_chiffres', []))
        state['code_propose'] = code
        if code == secret:
            state['gagne'] = True
            room['vue_actuelle'] = 'indice2'  # Ou autre vue de victoire
