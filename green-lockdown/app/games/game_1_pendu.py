def create_state():
    """Retourne l'état initial pour le jeu du pendu."""
    mot = list("RECYCLAGE")
    return {
        'mot_a_deviner': mot,
        'mot_affiche': ['_' for _ in mot],
        'lettres_proposees': [],
        'erreurs': 0,
        'max_erreurs': 6,
        'partie_terminee': False,
        'gagne': False,
        'operateur_sid': None
    }

def handle_action(room, sid, action_data):
    game_state = room['jeu1_state']
    action_type = action_data.get('type')
    vue_change = None
    if action_type == 'proposer_lettre':
        lettre = action_data.get('lettre', '').upper()
        if not game_state['partie_terminee'] and sid == game_state['operateur_sid'] and lettre not in game_state['lettres_proposees']:
            game_state['lettres_proposees'].append(lettre)
            if lettre in game_state['mot_a_deviner']:
                for i, l in enumerate(game_state['mot_a_deviner']):
                    if l == lettre:
                        game_state['mot_affiche'][i] = l
            else:
                game_state['erreurs'] += 1
            # Vérification de victoire/défaite
            if '_' not in game_state['mot_affiche']:
                game_state['partie_terminee'] = True
                game_state['gagne'] = True
                vue_change = 'indice1'
                if 'T' not in room['indices_collectes']:
                    room['indices_collectes'].append('T')
            elif game_state['erreurs'] >= game_state['max_erreurs']:
                game_state['partie_terminee'] = True
                game_state['gagne'] = False
                vue_change = 'fail'
    return vue_change
