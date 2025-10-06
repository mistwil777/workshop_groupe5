document.addEventListener('DOMContentLoaded', () => {
    const socket = io("http://127.0.0.1:5000");
    const gameContainer = document.getElementById('game-container');
    let monSid = null;
    let maRoomState = null;

    // Modular view system
    window.views = window.views || {};
    const views = {
        accueil: {
            render: () => `
                <div class="card">
                    <h1>Mission : Sauver la planète</h1>
                    <div class="actions vertical">
                        <button id="create-button" class="btn">Créer une partie</button>
                        <hr style="width:100%; border-color: #00ff00;">
                        <input id="token-input" class="input" placeholder="CODE (ex: ABCD)" maxlength="4" style="text-transform:uppercase">
                        <button id="join-button" class="btn">Rejoindre une partie</button>
                    </div>
                </div>`,
            attachEvents: () => {
                document.getElementById('create-button').addEventListener('click', () => socket.emit('create_room'));
                document.getElementById('join-button').addEventListener('click', () => {
                    const token = document.getElementById('token-input').value;
                    if (token) socket.emit('join_room', { token: token });
                });
            }
        },
        lobby: {
            render: (state) => {
                const estHote = monSid === state.host_sid;
                const joueursListe = Object.values(state.joueurs).map(j => `<li>${j.nom} ${j.id === state.host_sid ? '👑' : ''}</li>`).join('');
                return `
                    <div class="card">
                        <h1>SALON DE LA PARTIE</h1>
                        <p>Partagez ce code avec vos amis :</p>
                        <div class="token-display">${state.token}</div>
                        <h3>Joueurs connectés :</h3>
                        <ul class="joueurs-liste">${joueursListe}</ul>
                        ${estHote ? '<button id="start-button" class="btn">Lancer la partie</button>' : '<p class="small">Attente du lancement par l\'hôte...</p>'}
                    </div>`;
            },
            attachEvents: (state) => {
                const startButton = document.getElementById('start-button');
                if (startButton) startButton.addEventListener('click', () => socket.emit('start_game', { token: state.token }));
            }
        },
        intro: {
            render: (state) => `
                <div class="card">
                    <h1>BRIEFING DE MISSION</h1>
                    <p>Agents, votre mission est acceptée. Vous devez pirater le système en résolvant 5 énigmes pour obtenir le mot de passe final.</p>
                    <div class="actions">
                        <button id="start-enigme1-button" class="btn">Commencer l'énigme 1</button>
                    </div>
                </div>`,
            attachEvents: (state) => {
                document.getElementById('start-enigme1-button').addEventListener('click', () => {
                    socket.emit('changer_vue', { token: state.token, vue: 'jeu1' });
                });
            }
        },
        indice1: {
            render: (state) => `
                <div class="card">
                    <h1>Indice 1 Obtenu</h1>
                    <p>Première lettre du mot de passe : <span class="badge">${state.indices_collectes[0]}</span></p>
                    <div class="actions"><button class="btn" id="next-button">Énigme suivante</button></div>
                </div>`,
            attachEvents: (state) => {
                document.getElementById('next-button').addEventListener('click', () => {
                    socket.emit('changer_vue', { token: state.token, vue: 'jeu2' });
                });
            }
        },
        fail: {
            render: () => `
                <div class="card">
                    <h1>MISSION ÉCHOUÉE</h1>
                    <p class="small">Le système n'a pas pu être arrêté à temps.</p>
                    <div class="actions"><button class="btn" id="restart-button">Recommencer</button></div>
                </div>`,
            attachEvents: () => {
                 document.getElementById('restart-button').addEventListener('click', () => window.location.reload());
            }
        }
    };
    
    // Affichage initial de l'accueil
    gameContainer.innerHTML = views.accueil.render();
    views.accueil.attachEvents();

    socket.on('connect', () => { monSid = socket.id; });
    socket.on('room_update', (roomState) => {
        maRoomState = roomState;
        let view = views[roomState.vue_actuelle];
        // If not in base views, try modular views
        if (!view && window.views && window.views[roomState.vue_actuelle]) {
            view = window.views[roomState.vue_actuelle];
        }
        if (view) {
            gameContainer.innerHTML = view.render(roomState);
            if (typeof view.attachEvents === 'function') {
                view.attachEvents(roomState);
            }
        }
    });
    socket.on('error', (data) => alert(`Erreur : ${data.message}`));

// Expose socket and monSid for modular views
window.socket = socket;
window.monSid = monSid;
});

