# app/games/game_5_quiz.py
import json
import random

def create_state(level):
    """
    Crée l'état initial pour le jeu 5 en lisant le fichier enigmes.json
    et en choisissant les questions en fonction du niveau.
    """
    # 1. Lire le fichier de données
    with open('app/data/enigmes.json', encoding='utf-8') as f:
        data = json.load(f)

    # 2. Naviguer jusqu'aux données du jeu 5 pour le bon niveau
    game_data = data.get('jeu5_quiz_croise', {})
    level_data = game_data.get(level, game_data.get('college', {})) # "college" par défaut
    
    # 3. Récupérer la liste des questions pour ce niveau
    questions = level_data.get('questions', [])
    random.shuffle(questions) # On mélange les questions pour chaque partie

    # 4. Créer l'état du jeu avec les données choisies
    return {
        'questions': questions,
        'player_answers': {},  # Dictionnaire pour suivre les réponses : {sid: {'answered': True, 'correct': True}}
        'partie_terminee': False,
        'gagne': False,
        'joueurs': [],
        'indice': level_data.get('description', "Répondez correctement à la question.")
    }

def handle_action(room, sid, action):
    state = room['jeu5_state']
    
    # Enregistre l'ordre d'arrivée des joueurs pour leur attribuer une question
    if sid not in state['joueurs']:
        state['joueurs'].append(sid)
        
    if action.get('type') == 'submit_answer':
        # Chaque joueur répond à une question différente de la liste
        idx = state['joueurs'].index(sid) % len(state['questions'])
        q = state['questions'][idx]
        
        # On récupère l'index de l'option choisie par le joueur
        try:
            reponse_index = q['options'].index(action.get('answer', ''))
        except ValueError:
            reponse_index = -1 # Réponse invalide

        # On stocke le résultat pour ce joueur
        state['player_answers'][sid] = {
            'answered': True,
            'correct': (reponse_index == q['answer_index'])
        }

        # On vérifie si la partie est gagnée
        # La victoire est atteinte quand tous les joueurs connectés ont répondu correctement
        tous_correct = True
        # On vérifie si chaque joueur dans la room a une réponse correcte enregistrée
        for player_sid in room['joueurs']:
            if not state['player_answers'].get(player_sid, {}).get('correct'):
                tous_correct = False
                break
        
        if tous_correct:
            state['gagne'] = True
            state['partie_terminee'] = True