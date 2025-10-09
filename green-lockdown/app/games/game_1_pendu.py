# app/games/game_1_pendu.py

import random

def create_state(niveau='college', mots_disponibles=None):
    """
    Retourne l'état initial pour le jeu du pendu.
    'mots_disponibles' est maintenant une LISTE de mots, pas l'objet entier.
    """
    if not mots_disponibles:
        # Fallback de sécurité si la liste de mots est vide
        mots_disponibles = ['PYTHON']

    # CORRECTION : On choisit directement un mot dans la liste fournie
    mot_choisi = random.choice(mots_disponibles).upper()
    
    mot = list(mot_choisi)
    return {
        'mot_a_deviner': mot,
        'mot_affiche': ['_' for _ in mot],
        'lettres_proposees': [],
        'erreurs': 0,
        'max_erreurs': 6,
        'partie_terminee': False,
        'gagne': False,
        'defaite': False,
        'operateur_sid': None,
        'indice': f"Le mot commence par '{mot[0]}' et contient {len(mot)} lettres."
    }

def handle_action(room, sid, action_data):
    """Gère une action pour le jeu du pendu et MODIFIE l'état de la room."""
    game_state = room['jeu1_state']
    action_type = action_data.get('type')
    
    if action_type == 'proposer_lettre':
        lettre = action_data.get('lettre', '').upper()
        
        if not game_state['partie_terminee'] and lettre not in game_state['lettres_proposees']:
            game_state['lettres_proposees'].append(lettre)
            
            if lettre in game_state['mot_a_deviner']:
                for i, l in enumerate(game_state['mot_a_deviner']):
                    if l == lettre:
                        game_state['mot_affiche'][i] = l
            else:
                game_state['erreurs'] += 1

            if '_' not in game_state['mot_affiche']:
                game_state['partie_terminee'] = True
                game_state['gagne'] = True
            elif game_state['erreurs'] >= game_state['max_erreurs']:
                game_state['partie_terminee'] = True
                game_state['gagne'] = False
                game_state['defaite'] = True
    
    elif action_type == 'restart':
        niveau = room.get('niveau', 'college')
        # CORRECTION : On récupère la bonne structure de données pour le pendu
        pendu_data = room.get('pendu_mots_data', {})
        pendu_niveau_data = pendu_data.get(niveau, pendu_data.get('college', {}))
        mots_pour_pendu = pendu_niveau_data.get('mots', ['DEFAULT'])
        
        # On recrée un nouvel état pour le jeu 1
        room['jeu1_state'] = create_state(niveau, mots_pour_pendu)

    return None