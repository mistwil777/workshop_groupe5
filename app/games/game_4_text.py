# app/games/game_4_text.py
# Énigme 4 : Le Texte Fragmenté

def create_state(level):
    return {
        'secret_sentence': "PLANETE EST VERTE",
        'fragments': [
            "...notre PLANÈTE est...",
            "...sa faune EST un trésor...",
            "...une économie VERTE..."
        ],
        'partie_terminee': False,
        'gagne': False,
        'phrase_proposee': '',
        'joueurs': [],
        'indice': "Assemble les fragments pour retrouver la phrase complète sur l'environnement."
    }

def handle_action(room, sid, action):
    state = room['jeu4_state']
    if sid not in state['joueurs']:
        state['joueurs'].append(sid)
    if action.get('type') == 'submit_sentence':
        phrase = str(action.get('sentence', '')).strip().lower()
        # Supprime espaces multiples et articles pour la comparaison
        phrase = phrase.replace('  ', ' ').replace('le ', '').replace('la ', '').replace('les ', '').replace("l'", '')
        state['phrase_proposee'] = phrase
        secret = state['secret_sentence'].strip().lower().replace('  ', ' ').replace('le ', '').replace('la ', '').replace('les ', '').replace("l'", '')
        if phrase == secret:
            state['gagne'] = True
            state['partie_terminee'] = True
            room['vue_actuelle'] = 'indice4'
            # Ajoute la lettre R aux indices collectés
            if 'indices_collectes' in room and len(room['indices_collectes']) < 4:
                room['indices_collectes'].append('R')
        else:
            state['gagne'] = False
            state['partie_terminee'] = False
