    // =================================================================================
    // --- MODULE FEUX D'ARTIFICE ---
    // =================================================================================
    function lancerFeuxArtifice() {
        // Crée un canvas plein écran temporaire
        let canvas = document.getElementById('firework-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'firework-canvas';
            canvas.style.position = 'fixed';
            canvas.style.top = 0;
            canvas.style.left = 0;
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = 2000;
            document.body.appendChild(canvas);
        }
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const ctx = canvas.getContext('2d');
        // Simple feu d'artifice : plusieurs explosions colorées
        const colors = ['#ff4242','#ffe066','#53ff1a','#1ac6ff','#b266ff','#ff66d9'];
        let particles = [];
        function createFirework() {
            const x = Math.random() * canvas.width * 0.8 + canvas.width*0.1;
            const y = Math.random() * canvas.height * 0.3 + canvas.height*0.2;
            const color = colors[Math.floor(Math.random()*colors.length)];
            for (let i=0; i<32; i++) {
                const angle = (i/32)*2*Math.PI;
                const speed = Math.random()*3+2;
                particles.push({
                    x, y,
                    vx: Math.cos(angle)*speed,
                    vy: Math.sin(angle)*speed,
                    alpha: 1,
                    color
                });
            }
        }
        let fireworkCount = 0;
        function animate() {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            particles.forEach(p => {
                ctx.globalAlpha = p.alpha;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, 2*Math.PI);
                ctx.fillStyle = p.color;
                ctx.fill();
            });
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.96;
                p.vy *= 0.96;
                p.alpha -= 0.018;
            });
            particles = particles.filter(p => p.alpha > 0);
            if (fireworkCount < 3 && Math.random() < 0.08) { createFirework(); fireworkCount++; }
            if (particles.length > 0) {
                requestAnimationFrame(animate);
            } else {
                setTimeout(() => { if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }, 400);
            }
        }
        createFirework();
        animate();
    }
// app/static/js/script.js

// Attend que l'intégralité de la page soit chargée.
document.addEventListener('DOMContentLoaded', () => {

    // --- VARIABLES GLOBALES ---
    window.socket = io("http://127.0.0.1:5000");
    window.monSid = null;
    const gameContainer = document.getElementById('game-container');
    let maRoomState = null;

    // CORRECTION : On s'assure que l'objet global 'views' existe, sans l'écraser.
    // Chaque fichier (script.js, view_jeu1.js, etc.) ajoutera ses propres vues à cet objet.
    window.views = window.views || {};

    // =================================================================================
    // --- MODULE DE GESTION AUDIO ---
    // (Cette partie ne change pas)
    // =================================================================================
    const AudioHandler = {
        bgMusic: new Audio('/static/audio/musique_fond.mp3'),
        clickSound: new Audio('/static/audio/computer-mouse-click-02-383961.mp3'),
        victorySound: new Audio('/static/audio/fin_partie.mp3'),
        defeatSound: new Audio('/static/audio/game_over.mp3'),
        victoryInterSound: new Audio('/static/audio/fin_jeu.mp3'),
        isMuted: false,
        userInteracted: false, 

        init: function() {
            this.bgMusic.loop = true;
            this.bgMusic.volume = 0.18;
            this.clickSound.volume = 0.7;
            this.victorySound.volume = 0.3;
            this.victoryInterSound.volume = 0.3;
            this.defeatSound.volume = 0.5;
            this.createMuteButton();
            
            window.addEventListener('click', (e) => {
                if (!this.userInteracted) {
                    this.userInteracted = true;
                    this.playBgMusic();
                    this.updateMuteButton();
                }
                if (e.target && e.target.id !== 'bg-music-btn') {
                    this.playClickSound();
                }
            }, false);
        },
        playBgMusic: function() { if (!this.isMuted && this.userInteracted) { this.bgMusic.play().catch(() => {}); } },
        playClickSound: function() { this.clickSound.currentTime = 0; this.clickSound.play().catch(()=>{}); },
        playVictorySound: function() { this.bgMusic.pause(); this.victorySound.play().catch(()=>{}); },
        playVictoryInterSound: function() { this.bgMusic.pause(); this.victoryInterSound.play().catch(()=>{}); },
        playDefeatSound: function() { this.bgMusic.pause(); this.defeatSound.play().catch(()=>{}); },
        toggleMute: function() {
            if (!this.userInteracted) return;
            this.isMuted = !this.isMuted;
            if (this.isMuted) { this.bgMusic.pause(); } else { this.playBgMusic(); }
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
            if (!this.userInteracted) { btn.innerHTML = '▶️'; } else { btn.innerHTML = this.isMuted ? '🔇' : '🎵'; }
        }
    };
    AudioHandler.init();
    window.AudioHandler = AudioHandler;

    // =================================================================================
    // --- MODULE D'EFFETS VISUELS ---
    // (Cette partie ne change pas)
    // =================================================================================
    function lancerConfettis() {
        // Crée un canvas plein écran temporaire
        let canvas = document.getElementById('confetti-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'confetti-canvas';
            canvas.style.position = 'fixed';
            canvas.style.top = 0;
            canvas.style.left = 0;
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = 2000;
            document.body.appendChild(canvas);
        }
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const ctx = canvas.getContext('2d');
        const confs = [];
        const colors = ['#b6ff00','#00e6e6','#ffe066','#ff5e5e','#fff'];
        for(let i=0;i<120;i++){
            confs.push({
                x: Math.random()*canvas.width,
                y: Math.random()*-canvas.height,
                r: 6+Math.random()*10,
                d: 2+Math.random()*2,
                color: colors[Math.floor(Math.random()*colors.length)],
                tilt: Math.random()*10-5,
                tiltAngle: 0,
                tiltAngleInc: 0.02+Math.random()*0.04
            });
        }
        function draw(){
            ctx.clearRect(0,0,canvas.width,canvas.height);
            for(const c of confs){
                ctx.beginPath();
                ctx.ellipse(c.x,c.y,c.r,c.r/2, c.tilt,0,2*Math.PI);
                ctx.fillStyle = c.color;
                ctx.globalAlpha = 0.85;
                ctx.fill();
            }
        }
        function update(){
            for(const c of confs){
                c.y += c.d;
                c.x += Math.sin(c.tilt)*2;
                c.tilt += c.tiltAngleInc;
                if(c.y>canvas.height+20){c.y = -10; c.x=Math.random()*canvas.width;}
            }
        }
        let frame=0;
        function loop(){
            draw();
            update();
            frame++;
            if(frame<400) requestAnimationFrame(loop);
            else ctx.clearRect(0,0,canvas.width,canvas.height);
        }
        loop();
        setTimeout(() => { if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }, 9000);
    }

    // =================================================================================
    // --- MODULE DE GESTION DES HORLOGES ---
    // (Cette partie ne change pas)
    // =================================================================================
    const ClockManager = {
        globalStart: null, jeuStart: null, lastVue: null, horlogeActive: false,
        recap: { global: 0, jeu1: 0, jeu2: 0, jeu3: 0, jeu4: 0, jeu5: 0 },
        startClocks: function() { if (!this.horlogeActive) { this.globalStart = Date.now(); this.jeuStart = Date.now(); this.horlogeActive = true; } },
        stopClocks: function() { this.horlogeActive = false; },
        drawClock: function(canvas, seconds) {
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save(); ctx.beginPath(); ctx.arc(35, 35, 32, 0, 2 * Math.PI); ctx.fillStyle = '#001a0a'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#00e6e6'; ctx.shadowColor = '#00e6e6'; ctx.shadowBlur = 8; ctx.stroke(); ctx.restore();
            for (let i = 0; i < 60; i += 5) { const angle = (i / 60) * 2 * Math.PI; const x1 = 35 + Math.cos(angle - Math.PI/2) * 28; const y1 = 35 + Math.sin(angle - Math.PI/2) * 28; const x2 = 35 + Math.cos(angle - Math.PI/2) * 32; const y2 = 35 + Math.sin(angle - Math.PI/2) * 32; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = '#b6ff00'; ctx.lineWidth = 2; ctx.stroke(); }
            const min = Math.floor(seconds / 60) % 60; const minAngle = ((min + (seconds%60)/60) / 60) * 2 * Math.PI; ctx.save(); ctx.beginPath(); ctx.moveTo(35, 35); ctx.lineTo(35 + Math.cos(minAngle - Math.PI/2) * 20, 35 + Math.sin(minAngle - Math.PI/2) * 20); ctx.strokeStyle = '#b6ff00'; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
            const sec = seconds % 60; const secAngle = (sec / 60) * 2 * Math.PI; ctx.save(); ctx.beginPath(); ctx.moveTo(35, 35); ctx.lineTo(35 + Math.cos(secAngle - Math.PI/2) * 26, 35 + Math.sin(secAngle - Math.PI/2) * 26); ctx.strokeStyle = '#00e6e6'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
        },
        formatTime: function(secs) { const m = Math.floor(secs / 60); const s = secs % 60; return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; },
        updateClocks: function() {
            if (!this.horlogeActive || this.globalStart === null || this.jeuStart === null) {
                this.drawClock(document.getElementById('clock-global'), 0); this.drawClock(document.getElementById('clock-jeu'), 0); const dg = document.getElementById('digital-global'); const dj = document.getElementById('digital-jeu');
                if (dg) dg.textContent = '00:00'; if (dj) dj.textContent = '00:00'; return;
            }
            const now = Date.now(); const globalSecs = Math.floor((now - this.globalStart) / 1000); const jeuSecs = Math.floor((now - this.jeuStart) / 1000);
            this.drawClock(document.getElementById('clock-global'), globalSecs); this.drawClock(document.getElementById('clock-jeu'), jeuSecs); const dg = document.getElementById('digital-global'); const dj = document.getElementById('digital-jeu');
            if (dg) dg.textContent = this.formatTime(globalSecs); if (dj) dj.textContent = this.formatTime(jeuSecs);
        },
        detectJeuChange: function(roomState) {
            if (!roomState || !roomState.vue_actuelle) return;
            const vuesJeu = ['jeu1','jeu2','jeu3','jeu4','jeu5'];
            if (roomState.vue_actuelle === 'jeu1' && !this.horlogeActive) { this.startClocks(); }
            if (vuesJeu.includes(roomState.vue_actuelle) && this.lastVue && vuesJeu.includes(this.lastVue) && this.horlogeActive) { const now = Date.now(); const jeuSecs = Math.floor((now - this.jeuStart) / 1000); if (this.lastVue) this.recap[this.lastVue] = jeuSecs; this.jeuStart = now; }
            if (roomState.vue_actuelle === 'success' && this.horlogeActive) { const now = Date.now(); this.recap.global = Math.floor((now - this.globalStart) / 1000); if (this.lastVue && vuesJeu.includes(this.lastVue)) { this.recap[this.lastVue] = Math.floor((now - this.jeuStart) / 1000); } this.stopClocks(); }
            if (vuesJeu.includes(roomState.vue_actuelle) && this.lastVue !== roomState.vue_actuelle && this.horlogeActive) { this.jeuStart = Date.now(); }
            this.lastVue = roomState.vue_actuelle;
        },
        init: function() { setInterval(() => this.updateClocks(), 1000); }
    };
    ClockManager.init();

    // =================================================================================
    // --- MOTEUR DE VUES ---
    // CORRECTION : On ajoute chaque vue à l'objet global `window.views`
    // =================================================================================
    Object.assign(window.views, {
        accueil: {
            render: () => `
                <div class="card">
                    <h1>Mission : Sauver la planète</h1>
                    <div class="actions vertical">
                        <label for="niveau-select" style="margin-bottom: 10px;"><b>Choisissez votre niveau :</b></label>
                        <select id="niveau-select" class="input"><option value="college">Collège</option><option value="primaire">Primaire</option><option value="lycee">Lycée</option></select>
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
                        <p>Partagez ce code : <span class="token-display">${state.token}</span></p>
                        <h3>Joueurs connectés :</h3>
                        <ul class="joueurs-liste">${joueursListe}</ul>
                        ${estHote ? '<button id="start-button" class="btn">Lancer la partie</button>' : '<p class="small">Attente de l\'hôte...</p>'}
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
                    <p>Agents, votre mission est acceptée. Vous devez pirater le système en résolvant 5 énigmes.</p>
                    <div class="actions"><button id="start-enigme1-button" class="btn">Commencer l'énigme 1</button></div>
                </div>`,
            attachEvents: () => {
                document.getElementById('start-enigme1-button').addEventListener('click', () => {
                    socket.emit('changer_vue', { token: maRoomState.token, vue: 'jeu1' });
                });
            }
        },
// NOUVEAU BLOC CENTRALISÉ POUR TOUS LES ÉCRANS D'INDICE
        indice1: {
            render: (state) => `<div class="card"><h1>Bravo, énigme 1 réussie !</h1><p>Lettre du code&nbsp;: <span class="badge">${state.indices_collectes[0] || ''}</span></p><div class="actions"><button class="btn" id="continue-button">Continuer</button></div></div>`,
            attachEvents: (state) => {
                document.getElementById('continue-button').addEventListener('click', () => socket.emit('changer_vue', { token: state.token, vue: 'jeu2' }));
                setTimeout(() => { lancerFeuxArtifice(); if (window.AudioHandler) AudioHandler.playVictoryInterSound(); }, 50);
            }
        },
        indice2: {
            render: (state) => `<div class="card"><h1>Bravo, énigme 2 réussie !</h1><p>Lettre trouvée&nbsp;: <span class="badge">${state.indices_collectes[1] || ''}</span></p><div class="actions"><button class="btn" id="continue-button">Continuer</button></div></div>`,
            attachEvents: (state) => {
                document.getElementById('continue-button').addEventListener('click', () => socket.emit('changer_vue', { token: state.token, vue: 'jeu3' }));
                setTimeout(() => { lancerFeuxArtifice(); if (window.AudioHandler) AudioHandler.playVictoryInterSound(); }, 50);
            }
        },
        indice3: {
            render: (state) => `<div class="card"><h1>Bravo, énigme 3 réussie !</h1><p>Lettre trouvée&nbsp;: <span class="badge">${state.indices_collectes[2] || ''}</span></p><div class="actions"><button class="btn" id="continue-button">Continuer</button></div></div>`,
            attachEvents: (state) => {
                document.getElementById('continue-button').addEventListener('click', () => socket.emit('changer_vue', { token: state.token, vue: 'jeu4' }));
                setTimeout(() => { lancerFeuxArtifice(); if (window.AudioHandler) AudioHandler.playVictoryInterSound(); }, 50);
            }
        },
        indice4: {
            render: (state) => `<div class="card"><h1>Bravo, énigme 4 réussie !</h1><p>Lettre trouvée&nbsp;: <span class="badge">${state.indices_collectes[3] || ''}</span></p><div class="actions"><button class="btn" id="continue-button">Continuer</button></div></div>`,
            attachEvents: (state) => {
                document.getElementById('continue-button').addEventListener('click', () => socket.emit('changer_vue', { token: state.token, vue: 'jeu5' }));
                setTimeout(() => { lancerFeuxArtifice(); if (window.AudioHandler) AudioHandler.playVictoryInterSound(); }, 50);
            }
        },
        indice5: {
            render: (state) => `<div class="card"><h1>Bravo, énigme 5 réussie !</h1><p>Lettre trouvée&nbsp;: <span class="badge">${state.indices_collectes[4] || ''}</span></p><div class="actions"><button class="btn" id="continue-button">Continuer</button></div></div>`,
            attachEvents: (state) => {
                document.getElementById('continue-button').addEventListener('click', () => socket.emit('changer_vue', { token: state.token, vue: 'final' }));
                setTimeout(() => { lancerFeuxArtifice(); if (window.AudioHandler) AudioHandler.playVictoryInterSound(); }, 50);
            }
        },
        final: { render: () => `<div class="card"><h1>Dernière Étape : Le Mot de Passe</h1><p>Entrez le mot de passe que vous avez collecté.</p><input id="password-input" class="input" placeholder="Mot de passe" maxlength="5"><button id="submit-password" class="btn">Valider</button></div>`, attachEvents: (state) => { document.getElementById('submit-password').addEventListener('click', () => { const mdp = document.getElementById('password-input').value; socket.emit('game_action', { token: state.token, game: 'final', action: { type: 'submit_password', password: mdp } }); }); }},
        success: { render: () => `<div class="card"><h1>MISSION ACCOMPLIE !</h1><p class="correct">Félicitations, vous avez sauvé la planète !</p><p>Temps total : ${ClockManager.formatTime(ClockManager.recap.global)}</p><div class="actions"><button class="btn" id="restart-button">Rejouer</button></div></div>`, attachEvents: () => { AudioHandler.playVictorySound(); lancerConfettis(); document.getElementById('restart-button').addEventListener('click', () => window.location.reload()); }},
        fail: { render: () => { ClockManager.stopClocks(); AudioHandler.playDefeatSound(); return `<div class="card"><h1>MISSION ÉCHOUÉE</h1><p class="small">Le système n'a pas pu être arrêté à temps.</p><div class="actions"><button class="btn" id="restart-button">Retour au salon</button></div></div>`; }, attachEvents: (state) => { document.getElementById('restart-button').addEventListener('click', () => socket.emit('changer_vue', { token: state.token, vue: 'lobby' })); }},
    });

    // --- FONCTION DE RENDU PRINCIPALE ---
    function renderApp(roomState) {
        maRoomState = roomState;
        ClockManager.detectJeuChange(roomState);
        const view = window.views[roomState.vue_actuelle];
        if (view && typeof view.render === 'function') { // Sécurité supplémentaire
            gameContainer.innerHTML = view.render(roomState);
            if (typeof view.attachEvents === 'function') {
                view.attachEvents(roomState);
            }
        } else {
            console.error("Vue inconnue ou invalide:", roomState.vue_actuelle, view);
            gameContainer.innerHTML = `<div class="card"><p class="wrong">Erreur : La vue "${roomState.vue_actuelle}" n'a pas pu être chargée.</p></div>`;
        }
    }
    
    // --- GESTIONNAIRES D'ÉVÉNEMENTS SOCKET.IO ---
    socket.on('connect', () => {
        monSid = socket.id;
        window.monSid = monSid;
        console.log("Connecté au serveur avec l'ID:", monSid);
        renderApp({ vue_actuelle: 'accueil', joueurs: {} }); // Affiche l'accueil
    });

    socket.on('room_update', (roomState) => {
        console.log("Mise à jour de la room reçue:", roomState);
        renderApp(roomState);
    });

    socket.on('error', (data) => alert(`Erreur : ${data.message}`));
});
