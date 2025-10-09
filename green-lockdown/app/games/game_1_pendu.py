import random


def create_state(niveau='college', mots_disponibles=None):
    """
    Retourne l'état initial pour le jeu du pendu.
    'mots_disponibles' est maintenant une LISTE de mots, fournie par main.py.
    """
    if not mots_disponibles:
        # Fallback de sécurité si la liste de mots est vide
        mots_disponibles = ['PYTHON']

    # On choisit directement un mot dans la liste fournie
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
    game_state = room['jeu1_state']
    action_type = action_data.get('type')
    
    if action_type == 'proposer_lettre':
        lettre = action_data.get('lettre', '').upper()
        
        # CORRECTION : On ne vérifie plus si c'est l'opérateur. Tout le monde peut jouer.
        if not game_state['partie_terminee'] and lettre not in game_state['lettres_proposees']:
            game_state['lettres_proposees'].append(lettre)
            
            if lettre in game_state['mot_a_deviner']:
                for i, l in enumerate(game_state['mot_a_deviner']):
                    if l == lettre:
                        game_state['mot_affiche'][i] = l
            else:
                game_state['erreurs'] += 1

            # La logique de victoire/défaite met juste à jour l'état.
            # C'est main.py qui décidera de changer de vue.
            if '_' not in game_state['mot_affiche']:
                game_state['partie_terminee'] = True
                game_state['gagne'] = True
            elif game_state['erreurs'] >= game_state['max_erreurs']:
                game_state['partie_terminee'] = True
                game_state['gagne'] = False
                game_state['defaite'] = True # On ajoute un état clair pour la défaite
    
    # CORRECTION : On ajoute la gestion du redémarrage ici.
    elif action_type == 'restart':
        # On recrée un nouvel état pour le jeu 1.
        room['jeu1_state'] = create_state()

    # CORRECTION : La fonction ne retourne plus rien.
    return None
