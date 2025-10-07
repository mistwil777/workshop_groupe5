# app/games/game_5_quiz.py
# Énigme 5 : Quiz Croisé
import random

def create_state(level):
    # Questions exemple, à adapter selon le niveau
    questions = [
        {
            'question': "Quel est le plus grand océan ?",
            'options': ["Atlantique", "Pacifique", "Indien"],
            'answer': "Pacifique"
        },
        {
            'question': "Combien de continents sur Terre ?",
            'options': ["5", "6", "7"],
            'answer': "7"
        },
        {
            'question': "Quel gaz est le plus abondant dans l'air ?",
            'options': ["Oxygène", "Azote", "CO2"],
            'answer': "Azote"
        }
    ]
    random.shuffle(questions)
    return {
        'questions': questions,
        'player_answers': {},  # sid: {'answered': False, 'correct': False}
        'partie_terminee': False,
        'gagne': False,
        'indice': "Lis bien chaque question et réfléchis avant de répondre. Les indices sont parfois dans les options."
    }

def handle_action(room, sid, action):
    state = room['jeu5_state']
    if action.get('type') == 'submit_answer':
        idx = None
        # Attribue une question par joueur selon l'ordre d'arrivée
        if 'joueurs' not in state:
            state['joueurs'] = []
        if sid not in state['joueurs']:
            state['joueurs'].append(sid)
        idx = state['joueurs'].index(sid) % len(state['questions'])
        q = state['questions'][idx]
        reponse = action.get('answer', '')
        if sid not in state['player_answers']:
            state['player_answers'][sid] = {'answered': False, 'correct': False}
        state['player_answers'][sid]['answered'] = True
        state['player_answers'][sid]['correct'] = (reponse == q['answer'])
        # Vérifie si tous les joueurs ont répondu correctement
        if all(a['answered'] and a['correct'] for a in state['player_answers'].values()) and len(state['player_answers']) == len(state['joueurs']):
            state['gagne'] = True
            state['partie_terminee'] = True
            room['vue_actuelle'] = 'indice5'
            # Ajoute la lettre E aux indices collectés
            if 'indices_collectes' in room and len(room['indices_collectes']) < 5:
                room['indices_collectes'].append('E')
        else:
            state['gagne'] = False
            state['partie_terminee'] = False
