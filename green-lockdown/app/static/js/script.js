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
                        <label for="niveau-select"><b>Choisissez votre niveau :</b></label>
                        <select id="niveau-select" class="input">
                            <option value="college">Collège</option>
                            <option value="primaire">Primaire</option>
                            <option value="lycee">Lycée</option>
                        </select>
                        <button id="create-button" class="btn">Créer une partie</button>
                        <hr style="width:100%; border-color: #00ff00;">
                        <input id="token-input" class="input" placeholder="CODE (ex: ABCD)" maxlength="4" style="text-transform:uppercase">
                        <button id="join-button" class="btn">Rejoindre une partie</button>
                    </div>
                </div>`,
            attachEvents: () => {
                document.getElementById('create-button').addEventListener('click', () => {
                    const niveau = document.getElementById('niveau-select').value;
                    socket.emit('create_room', { niveau });
                });
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
                    console.log('[DEBUG] Clic bouton énigme 1', state.token);
                    socket.emit('changer_vue', { token: state.token, vue: 'jeu1' });
                });
            }
        },
        indice1: {
            render: (state) => `
                <div class="card">
                    <h1>Bravo, énigme 1 réussie !</h1>
                    <p>Première lettre du code&nbsp;: <span class="badge">${state.indices_collectes[0]}</span></p>
                    <div class="actions"><button class="btn" id="continue-button">Continuer</button></div>
                </div>`,
            attachEvents: (state) => {
                document.getElementById('continue-button').addEventListener('click', () => {
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
        },
        indice2: {
            render: (state) => {
                const code = state.jeu2_state && state.jeu2_state.code_final ? state.jeu2_state.code_final : '';
                return `
                    <div class="card">
                        <h1>Bravo, mission accomplie !</h1>
                        <p>Tu as trouvé le code final&nbsp;: <span class="badge">${code}</span></p>
                        <p class="success">Félicitations, tu as sauvé la centrale solaire !</p>
                        <div class="actions"><button class="btn" id="continue-button">Continuer</button></div>
                    </div>
                `;
            },
            attachEvents: (state) => {
                const btn = document.getElementById('continue-button');
                if (btn) btn.addEventListener('click', () => {
                    // À terme, passer à la mission suivante. Pour l'instant, recharge la page.
                    window.location.reload();
                });
            }
        }
    };
    
    // Affichage initial de l'accueil
    gameContainer.innerHTML = views.accueil.render();
    views.accueil.attachEvents();

    socket.on('connect', () => { monSid = socket.id; });
    // Flags pour éviter d'afficher plusieurs fois le message
    let lastVictory1 = false;
    let lastVictory2 = false;
    socket.on('room_update', (roomState) => {
        maRoomState = roomState;
        monSid = socket.id;
        window.monSid = monSid;
        let view = views[roomState.vue_actuelle];
        if (!view && window.views && window.views[roomState.vue_actuelle]) {
            view = window.views[roomState.vue_actuelle];
        }
        if (view) {
            gameContainer.innerHTML = view.render(roomState);
            if (typeof view.attachEvents === 'function') {
                view.attachEvents(roomState);
            }
            // Affiche le message de félicitations après la victoire du jeu 1
            if (roomState.vue_actuelle === 'indice1' && window.showFelicitationMessage) {
                if (!lastVictory1) {
                    window.showFelicitationMessage();
                    lastVictory1 = true;
                }
            } else {
                lastVictory1 = false;
            }
            // Affiche le message de félicitations après la victoire du jeu 2 (code correct)
            if (roomState.vue_actuelle === 'indice2' && window.showFelicitationMessage) {
                if (!lastVictory2) {
                    window.showFelicitationMessage();
                    lastVictory2 = true;
                }
            } else {
                lastVictory2 = false;
            }
        }
    });
    socket.on('error', (data) => alert(`Erreur : ${data.message}`));

// Affiche un message de félicitations temporaire
function showFelicitationMessage() {
    console.log('[DEBUG] showFelicitationMessage appelée');
    const messages = [
        "Bravo ! Tu as réussi !",
        "Félicitations, mission accomplie !",
        "Super, tu as trouvé le code !",
        "Excellent travail !",
        "Tu es un as de l'évasion !"
    ];
    const message = messages[Math.floor(Math.random() * messages.length)];
    const popup = document.getElementById('felicitation-popup');
    if (!popup) {
        console.warn('[DEBUG] Élément #felicitation-popup introuvable dans le DOM');
        return;
    }
    popup.textContent = message;
    popup.classList.add('show');
    // Animation mouvement
    popup.style.top = Math.random() * 60 + 20 + '%';
    popup.style.left = Math.random() * 60 + 20 + '%';
    setTimeout(() => {
        popup.classList.remove('show');
    }, 3500);
    console.log('[DEBUG] Pop-up félicitations affichée avec message :', message);
}

// Pour déclencher ce message, appelez showFelicitationMessage() à la fin de la partie (ex: après victoire)

// Expose socket and monSid for modular views
window.socket = socket;
window.monSid = monSid;
});

