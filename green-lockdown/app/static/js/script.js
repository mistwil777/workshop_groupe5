// Attend que l'intégralité de la page soit chargée avant d'exécuter le code.
document.addEventListener('DOMContentLoaded', () => {

    // --- VARIABLES GLOBALES ---
    // On expose ces variables pour qu'elles soient accessibles partout, y compris dans les modules de vue.
    window.socket = io("http://127.0.0.1:5000");
    window.monSid = null;
    const gameContainer = document.getElementById('game-container');
    let maRoomState = null; // Pour conserver le dernier état de la partie

    // =================================================================================
    // --- MODULE DE GESTION AUDIO ---
    // =================================================================================
    const AudioHandler = {
        bgMusic: new Audio('/static/audio/musique_fond.mp3'),
        clickSound: new Audio('/static/audio/computer-mouse-click-02-383961.mp3'),
        victorySound: new Audio('/static/audio/fin_jeu.mp3'), // CORRECTION : Nom du fichier audio corrigé
        defeatSound: new Audio('/static/audio/game_over.mp3'),
        isMuted: false,
        userInteracted: false, 

        init: function() {
            this.bgMusic.loop = true;
            this.bgMusic.volume = 0.18;
            this.clickSound.volume = 0.7;
            this.victorySound.volume = 0.5;
            this.defeatSound.volume = 0.5;
            this.createMuteButton();
            
            // Son de clic global
            window.addEventListener('click', (e) => {
                if (!this.userInteracted) {
                    this.userInteracted = true;
                    this.playBgMusic();
                    this.updateMuteButton(); // Mettre à jour l'icône après le premier clic
                }
                if (e.target && e.target.id !== 'bg-music-btn') {
                    this.playClickSound();
                }
            }, false); // CORRECTION: Passage en phase de "bubbling" pour ne pas bloquer les autres clics
        },

        playBgMusic: function() {
            if (!this.isMuted && this.userInteracted) { 
                this.bgMusic.play().catch(() => console.log("La lecture de la musique a échoué."));
            }
        },

        playClickSound: function() {
            this.clickSound.currentTime = 0;
            this.clickSound.play().catch(()=>{});
        },

        playVictorySound: function() {
            this.bgMusic.pause();
            this.victorySound.play().catch(()=>{});
        },

        playDefeatSound: function() {
            this.bgMusic.pause();
            this.defeatSound.play().catch(()=>{});
        },

        toggleMute: function() {
            // Ne fait rien si l'utilisateur n'a pas encore interagi
            if (!this.userInteracted) return;
            this.isMuted = !this.isMuted;
            if (this.isMuted) {
                this.bgMusic.pause();
            } else {
                this.playBgMusic();
            }
            this.updateMuteButton();
        },

        createMuteButton: function() {
            let btn = document.createElement('button');
            btn.id = 'bg-music-btn';
            btn.style.cssText = `position: fixed; right: 24px; bottom: 24px; width: 48px; height: 48px; border-radius: 50%; background: radial-gradient(circle, #00e6e6 60%, #b6ff00 100%); box-shadow: 0 0 16px #00e6e6, 0 0 32px #b6ff00 inset; font-size: 1.5em; color: #003300; border: none; cursor: pointer; z-index: 1500;`;
            btn.title = 'Activer/couper la musique';
            btn.onclick = () => this.toggleMute();
            document.body.appendChild(btn);
            this.updateMuteButton();
        },

        updateMuteButton: function() {
            const btn = document.getElementById('bg-music-btn');
            if (!this.userInteracted) {
                btn.innerHTML = '▶️'; // Icône Play avant la première interaction
            } else {
                btn.innerHTML = this.isMuted ? '🔇' : '🎵';
            }
        }
    };

    // On initialise le module audio
    AudioHandler.init();


    // =================================================================================
    // --- MODULE D'EFFETS VISUELS ---
    // =================================================================================
    function lancerConfettis() {
        if (window.confetti) {
            confetti({
                particleCount: 150,
                spread: 180,
                origin: { y: 0.6 }
            });
        }
    }


    // =================================================================================
    // --- MODULE DE GESTION DES HORLOGES ---
    // =================================================================================
    const ClockManager = {
        globalStart: null,
        jeuStart: null,
        lastVue: null,
        horlogeActive: false,
        recap: { global: 0, jeu1: 0, jeu2: 0, jeu3: 0, jeu4: 0, jeu5: 0 },

        startClocks: function() {
            if (!this.horlogeActive) {
                this.globalStart = Date.now();
                this.jeuStart = Date.now();
                this.horlogeActive = true;
            }
        },

        stopClocks: function() {
            this.horlogeActive = false;
        },

        drawClock: function(canvas, seconds) {
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Cadran
            ctx.save();
            ctx.beginPath();
            ctx.arc(35, 35, 32, 0, 2 * Math.PI);
            ctx.fillStyle = '#001a0a';
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#00e6e6';
            ctx.shadowColor = '#00e6e6';
            ctx.shadowBlur = 8;
            ctx.stroke();
            ctx.restore();
            // Graduation
            for (let i = 0; i < 60; i += 5) {
                const angle = (i / 60) * 2 * Math.PI;
                const x1 = 35 + Math.cos(angle - Math.PI/2) * 28;
                const y1 = 35 + Math.sin(angle - Math.PI/2) * 28;
                const x2 = 35 + Math.cos(angle - Math.PI/2) * 32;
                const y2 = 35 + Math.sin(angle - Math.PI/2) * 32;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = '#b6ff00';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            // Aiguille minutes
            const min = Math.floor(seconds / 60) % 60;
            const minAngle = ((min + (seconds%60)/60) / 60) * 2 * Math.PI;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(35, 35);
            ctx.lineTo(35 + Math.cos(minAngle - Math.PI/2) * 20, 35 + Math.sin(minAngle - Math.PI/2) * 20);
            ctx.strokeStyle = '#b6ff00';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.restore();
            // Aiguille secondes
            const sec = seconds % 60;
            const secAngle = (sec / 60) * 2 * Math.PI;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(35, 35);
            ctx.lineTo(35 + Math.cos(secAngle - Math.PI/2) * 26, 35 + Math.sin(secAngle - Math.PI/2) * 26);
            ctx.strokeStyle = '#00e6e6';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        },

        formatTime: function(secs) {
            const m = Math.floor(secs / 60);
            const s = secs % 60;
            return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
        },

        updateClocks: function() {
            if (!this.horlogeActive || this.globalStart === null || this.jeuStart === null) {
                this.drawClock(document.getElementById('clock-global'), 0);
                this.drawClock(document.getElementById('clock-jeu'), 0);
                const dg = document.getElementById('digital-global');
                const dj = document.getElementById('digital-jeu');
                if (dg) dg.textContent = '00:00';
                if (dj) dj.textContent = '00:00';
                return;
            }
            const now = Date.now();
            const globalSecs = Math.floor((now - this.globalStart) / 1000);
            const jeuSecs = Math.floor((now - this.jeuStart) / 1000);
            this.drawClock(document.getElementById('clock-global'), globalSecs);
            this.drawClock(document.getElementById('clock-jeu'), jeuSecs);
            const dg = document.getElementById('digital-global');
            const dj = document.getElementById('digital-jeu');
            if (dg) dg.textContent = this.formatTime(globalSecs);
            if (dj) dj.textContent = this.formatTime(jeuSecs);
        },

        detectJeuChange: function(roomState) {
            if (!roomState || !roomState.vue_actuelle) return;
            const vuesJeu = ['jeu1','jeu2','jeu3','jeu4','jeu5'];
            
            if (roomState.vue_actuelle === 'jeu1' && !this.horlogeActive) {
                this.startClocks();
            }
            
            if (vuesJeu.includes(roomState.vue_actuelle) && this.lastVue && vuesJeu.includes(this.lastVue) && this.horlogeActive) {
                const now = Date.now();
                const jeuSecs = Math.floor((now - this.jeuStart) / 1000);
                if (this.lastVue) this.recap[this.lastVue] = jeuSecs;
                this.jeuStart = now;
            }
            
            if (roomState.vue_actuelle === 'success' && this.horlogeActive) {
                const now = Date.now();
                this.recap.global = Math.floor((now - this.globalStart) / 1000);
                if (this.lastVue && vuesJeu.includes(this.lastVue)) {
                    this.recap[this.lastVue] = Math.floor((now - this.jeuStart) / 1000);
                }
                this.stopClocks();
            }
            
            if (vuesJeu.includes(roomState.vue_actuelle) && this.lastVue !== roomState.vue_actuelle && this.horlogeActive) {
                this.jeuStart = Date.now();
            }
            this.lastVue = roomState.vue_actuelle;
        },

        init: function() {
            setInterval(() => this.updateClocks(), 1000);
        }
    };

    ClockManager.init();


    // =================================================================================
    // --- MOTEUR DE VUES ---
    // =================================================================================
    const views = {
        accueil: {
            render: () => `
                <div class="card">
                    <h1>Mission : Sauver la planète</h1>
                    <div class="actions vertical">
                        <label for="niveau-select" style="margin-bottom: 10px;"><b>Choisissez votre niveau :</b></label>
                        <select id="niveau-select" class="input">
                            <option value="college">Collège</option>
                            <option value="primaire">Primaire</option>
                            <option value="lycee">Lycée</option>
                        </select>
                        <button id="create-button" class="btn" style="margin-top: 15px;">Créer une partie</button>
                        <hr style="width:100%; border-color: #00ff00;">
                        <input id="token-input" class="input" placeholder="CODE (ex: ABCD)" maxlength="4" style="text-transform:uppercase">
                        <button id="join-button" class="btn">Rejoindre une partie</button>
                    </div>
                </div>`,
            attachEvents: () => {
                document.getElementById('create-button').addEventListener('click', () => {
                    const niveau = document.getElementById('niveau-select').value;
                    socket.emit('create_room', { niveau: niveau });
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
            render: () => `
                <div class="card">
                    <h1>BRIEFING DE MISSION</h1>
                    <p>Agents, votre mission est acceptée. Vous devez pirater le système en résolvant 5 énigmes pour obtenir le mot de passe final.</p>
                    <div class="actions">
                        <button id="start-enigme1-button" class="btn">Commencer l'énigme 1</button>
                    </div>
                </div>`,
            attachEvents: () => {
                document.getElementById('start-enigme1-button').addEventListener('click', () => {
                    socket.emit('changer_vue', { token: maRoomState.token, vue: 'jeu1' });
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
                lancerConfettis(); // Lancer les confettis
                document.getElementById('continue-button').addEventListener('click', () => {
                    socket.emit('changer_vue', { token: state.token, vue: 'jeu2' });
                });
            }
        },
        indice2: {
            render: (state) => `
                <div class="card">
                    <h1>Bravo, énigme 2 réussie !</h1>
                    <p>Lettre trouvée&nbsp;: <span class="badge">${state.indices_collectes[1] || ''}</span></p>
                    <div class="actions"><button class="btn" id="continue-button">Continuer</button></div>
                </div>`,
            attachEvents: (state) => {
                lancerConfettis(); // Lancer les confettis
                document.getElementById('continue-button').addEventListener('click', () => {
                    socket.emit('changer_vue', { token: state.token, vue: 'jeu3' });
                });
            }
        },
        indice3: {
            render: (state) => `
                <div class="card">
                    <h1>Bravo, énigme 3 réussie !</h1>
                    <p>Lettre trouvée&nbsp;: <span class="badge">${state.indices_collectes[2] || ''}</span></p>
                    <div class="actions"><button class="btn" id="continue-button">Continuer</button></div>
                </div>`,
            attachEvents: (state) => {
                lancerConfettis(); // Lancer les confettis
                document.getElementById('continue-button').addEventListener('click', () => {
                    socket.emit('changer_vue', { token: state.token, vue: 'jeu4' });
                });
            }
        },
        indice4: {
            render: (state) => `
                <div class="card">
                    <h1>Bravo, énigme 4 réussie !</h1>
                    <p>Lettre trouvée&nbsp;: <span class="badge">${state.indices_collectes[3] || ''}</span></p>
                    <div class="actions"><button class="btn" id="continue-button">Continuer</button></div>
                </div>`,
            attachEvents: (state) => {
                lancerConfettis(); // Lancer les confettis
                document.getElementById('continue-button').addEventListener('click', () => {
                    socket.emit('changer_vue', { token: state.token, vue: 'jeu5' });
                });
            }
        },
        indice5: {
            render: (state) => `
                <div class="card">
                    <h1>Bravo, énigme 5 réussie !</h1>
                    <p>Lettre trouvée&nbsp;: <span class="badge">${state.indices_collectes[4] || ''}</span></p>
                    <div class="actions"><button class="btn" id="continue-button">Continuer</button></div>
                </div>`,
            attachEvents: (state) => {
                lancerConfettis(); // Lancer les confettis
                document.getElementById('continue-button').addEventListener('click', () => {
                    socket.emit('changer_vue', { token: state.token, vue: 'final' });
                });
            }
        },
        final: {
             render: (state) => {
                const motDePasse = state.indices_collectes.join('');
                return `
                <div class="card">
                    <h1>Dernière Étape : Le Mot de Passe</h1>
                    <p>Entrez le mot de passe que vous avez collecté pour arrêter le système.</p>
                    <input id="password-input" class="input" placeholder="Mot de passe" maxlength="5">
                    <button id="submit-password" class="btn">Valider</button>
                </div>
            `},
            attachEvents: (state) => {
                document.getElementById('submit-password').addEventListener('click', () => {
                    const mdp = document.getElementById('password-input').value;
                    socket.emit('game_action', {
                        token: state.token,
                        game: 'final',
                        action: { type: 'submit_password', password: mdp }
                    });
                });
            }
        },
        success: {
            render: (state) => `
                <div class="card">
                    <h1>MISSION ACCOMPLIE !</h1>
                    <p class="success">Félicitations, vous avez sauvé la planète !</p>
                    <p>Temps total : ${ClockManager.formatTime(ClockManager.recap.global)}</p>
                    <div class="actions"><button class="btn" id="restart-button">Rejouer</button></div>
                </div>`,
            attachEvents: () => {
                AudioHandler.playVictorySound();
                lancerConfettis(); // Lancer les confettis pour la victoire finale
                document.getElementById('restart-button').addEventListener('click', () => window.location.reload());
            }
        },
        fail: {
            render: (state) => {
                ClockManager.stopClocks();
                AudioHandler.playDefeatSound();
                return `
                    <div class="card">
                        <h1>MISSION ÉCHOUÉE</h1>
                        <p class="small">Le système n'a pas pu être arrêté à temps.</p>
                        <div class="actions"><button class="btn" id="restart-button">Retour au salon</button></div>
                    </div>`;
            },
            attachEvents: (state) => {
                document.getElementById('restart-button').addEventListener('click', () => {
                    socket.emit('changer_vue', { token: state.token, vue: 'lobby' });
                });
            }
        },
        // CORRECTION : Vue du jeu 1 (Pendu) ajoutée pour que le jeu se lance.
        // Idéalement, ce bloc devrait être dans son propre fichier (view_jeu1.js).
        jeu1: {
            render: (state) => {
                const jeu1 = state.jeu1_state;

                // CORRECTION : Suppression de la logique de défaite côté client pour éviter les conflits.
                // On fait confiance au serveur pour gérer l'état de la partie.
                const estMonTour = monSid === jeu1.operateur_sid;
                const fausses = jeu1.lettres_proposees.filter(l => !jeu1.mot_a_deviner.includes(l));
                
                const clavierHtml = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').map(lettre => `
                    <button class="touche-clavier" data-lettre="${lettre}" ${jeu1.lettres_proposees.includes(lettre) || !estMonTour || jeu1.partie_terminee ? 'disabled' : ''}>
                        ${lettre}
                    </button>
                `).join('');
                
                let message = `Observateur - Attendez que l'opérateur joue.`;
                if(estMonTour && !jeu1.partie_terminee) message = "À vous de jouer ! Proposez une lettre.";

                return `
                    <div class="card">
                        <h1>Énigme 1 : Le Pendu</h1>
                        <p class="message">${message}</p>
                        <div class="mot">${jeu1.mot_affiche.join(' ')}</div>
                        <p>Lettres incorrectes : <span style="color: #ff5555;">${fausses.join(', ')}</span></p>
                        <div class="clavier">${clavierHtml}</div>
                    </div>`;
            },
            attachEvents: (state) => {
                document.querySelectorAll('.touche-clavier').forEach(touche => {
                    touche.addEventListener('click', () => {
                        socket.emit('game_action', { 
                            token: state.token, 
                            game: 'jeu1',
                            action: {
                                type: 'proposer_lettre',
                                lettre: touche.dataset.lettre
                            }
                        });
                    });
                });
            }
        },
        jeu2: {
            render: (state) => {
                const jeu2 = state.jeu2_state;
                // Si les cartes n'ont pas encore été générées, on affiche l'intro du jeu 2
                if (!jeu2 || !jeu2.cartes) {
                    const scenario = state.scenario_en_cours || {};
                    return `
                        <div class="card">
                            <h1>Énigme 2 : ${scenario.title || 'Jeu de Paires'}</h1>
                            <p>${scenario.scenarioText || 'Mémorisez et trouvez les paires.'}</p>
                            <div class="actions">
                                <button id="start-jeu2-button" class="btn">Commencer</button>
                            </div>
                        </div>`;
                }

                // Si les cartes existent, on affiche le plateau de jeu
                const estMonTour = monSid === jeu2.joueur_actuel_sid;
                const nomJoueurActuel = state.joueurs[jeu2.joueur_actuel_sid]?.nom || 'un joueur';
                let message = `Observateur - Attendez que ${nomJoueurActuel} joue.`;
                if(estMonTour && !jeu2.partie_terminee) message = "À vous de jouer ! Trouvez les paires.";

                const cartesHtml = jeu2.cartes.map((carte, index) => `
                    <div class="carte-paire ${carte.trouvee ? 'trouvee' : ''} ${carte.visible ? 'visible' : ''}" data-index="${index}">
                        <div class="carte-paire-interne">
                            <div class="carte-paire-face avant"></div>
                            <div class="carte-paire-face arriere">${carte.valeur}</div>
                        </div>
                    </div>
                `).join('');

                return `
                    <div class="card">
                        <h1>Énigme 2 : Jeu de Paires</h1>
                        <p class="message">${message}</p>
                        <p>Paires trouvées : ${jeu2.paires_trouvees} / ${jeu2.total_paires}</p>
                        <div class="plateau-paires">${cartesHtml}</div>
                    </div>`;
            },
            attachEvents: (state) => {
                const jeu2 = state.jeu2_state;

                // Si on est sur l'écran d'intro, on attache l'événement au bouton "Commencer"
                const startButton = document.getElementById('start-jeu2-button');
                if (startButton) {
                    startButton.addEventListener('click', () => {
                        socket.emit('game_action', {
                            token: state.token,
                            game: 'jeu2',
                            action: { type: 'start_game' }
                        });
                    });
                    return; // On ne fait rien d'autre
                }

                // Si on est sur le plateau de jeu, on attache les événements aux cartes
                if (!jeu2 || !jeu2.cartes) return; // Sécurité pour ne pas attacher d'events si le jeu n'a pas démarré
                const estMonTour = monSid === jeu2.joueur_actuel_sid;
                if (estMonTour) {
                    document.querySelectorAll('.carte-paire:not(.trouvee)').forEach(carte => {
                        carte.addEventListener('click', () => {
                            socket.emit('game_action', {
                                token: state.token,
                                game: 'jeu2',
                                action: {
                                    type: 'retourner_carte',
                                    index: parseInt(carte.dataset.index)
                                }
                            });
                        });
                    });
                }
            }
        }
    };
    
    // On expose l'objet views pour que les fichiers externes puissent s'y ajouter
    window.views = views;

    // --- FONCTION DE RENDU PRINCIPALE ---
    function renderApp(roomState) {
        maRoomState = roomState; // Sauvegarde le dernier état
        ClockManager.detectJeuChange(roomState); // Mise à jour des horloges
        const view = window.views[roomState.vue_actuelle];
        if (view) {
            gameContainer.innerHTML = view.render(roomState);
            view.attachEvents(roomState);
        } else {
            console.error("Vue inconnue:", roomState.vue_actuelle);
        }
    }
    
    // --- GESTIONNAIRES D'ÉVÉNEMENTS SOCKET.IO ---
    socket.on('connect', () => {
        monSid = socket.id;
        window.monSid = monSid; // Expose pour les modules
        console.log("Connecté au serveur avec l'ID:", monSid);
        // Affiche l'accueil dès la connexion
        gameContainer.innerHTML = views.accueil.render();
        views.accueil.attachEvents();
    });

    socket.on('room_update', (roomState) => {
        console.log("Mise à jour de la room reçue:", roomState);
        renderApp(roomState);
    });

    socket.on('error', (data) => alert(`Erreur : ${data.message}`));
});

