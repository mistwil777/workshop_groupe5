# app/games/game_2_quiz_order.py

def create_state():
    """Crée l'état initial pour le jeu 2."""
    return {
        'scenario': None,
        'partie_commencee': False, # Ajouté pour gérer l'écran d'intro
        'indices_reveles': [],
        'indices_chiffres': [],
        'indices_aide': [],
        'erreurs_quiz': {}, # Utilise un dictionnaire pour les erreurs par index
        'code_propose': '',
        'gagne': False,
    }

def handle_action(room, sid, action):
    """Gère les actions spécifiques au jeu 2."""
    state = room['jeu2_state']
    scenario = state.get('scenario')
    if not scenario:
        return

    action_type = action.get('type')

    # --- NOUVEAU : Gère le démarrage de la partie ---
    if action_type == 'start_game' and not state.get('partie_commencee'):
        state['partie_commencee'] = True
        nb_questions = len(scenario.get('forces', []))
        state['indices_reveles'] = [False] * nb_questions
        state['indices_aide'] = [False] * nb_questions
        print(f"[Jeu 2] Partie commencée pour la room {room.get('token')}")
        return # On retourne pour envoyer le nouvel état au joueur

    # --- Gère la réponse à un quiz ---
    elif action_type == 'quiz_answer':
        force_idx = action.get('force_idx')
        reponse_joueur = str(action.get('reponse', '')).strip().lower()
        
        # Vérifie si l'index est valide
        if 0 <= force_idx < len(scenario.get('forces', [])):
            reponse_correcte = str(scenario['forces'][force_idx]['answer']).strip().lower()
            
            if reponse_joueur == reponse_correcte:
                state['indices_reveles'][force_idx] = True
                state['erreurs_quiz'][force_idx] = 0 # Réinitialise les erreurs pour cette question
            else:
                # Incrémente le compteur d'erreurs pour cette question
                current_errors = state['erreurs_quiz'].get(force_idx, 0)
                state['erreurs_quiz'][force_idx] = current_errors + 1
                # Si 2 erreurs ou plus, on affiche l'indice d'aide
                if state['erreurs_quiz'][force_idx] >= 2:
                    state['indices_aide'][force_idx] = True

    # --- Gère la soumission du code final ---
    elif action_type == 'submit_code':
        code_propose = str(action.get('code', '')).strip()
        code_correct = "".join(state.get('indices_chiffres', [])) # Le code est simplement la suite des chiffres
        
        state['code_propose'] = code_propose
        if code_propose == code_correct:
            state['gagne'] = True
            print(f"[Jeu 2] Victoire dans la room {room.get('token')}")