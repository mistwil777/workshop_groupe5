// app/static/js/views/view_jeu1.js

window.views = window.views || {};

window.views.jeu1 = {
render: (state) => {
    const jeu1 = state.jeu1_state;
    const fausses = jeu1.lettres_proposees.filter(l => !jeu1.mot_a_deviner.includes(l));
    const astuces = [ /* ... (votre liste d'astuces) ... */ ];
    
    if (jeu1.defaite) {
        const astuce = astuces[Math.floor(Math.random() * astuces.length)];
        return `
            <div class="card">
                <h1>Défaite...</h1>
                <p class="fail">Le mot à deviner était : <span class="badge">${jeu1.mot_a_deviner.join('')}</span></p>
                <p class="small">Astuce pour la prochaine partie :</p>
                <div class="victoire-message" style="margin-bottom:10px;">${astuce}</div>
                <button id="restart-pendu" class="btn">Recommencer</button>
            </div>
        `;
    }

    // CORRECTION : Le clavier est maintenant actif pour tout le monde (sauf si la lettre est déjà jouée ou si la partie est finie)
    const clavierHtml = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').map(lettre => `
        <button class="touche-clavier" data-lettre="${lettre}" ${jeu1.lettres_proposees.includes(lettre) || jeu1.partie_terminee ? 'disabled' : ''}>
            ${lettre}
        </button>
    `).join('');

    // CORRECTION : Le message est le même pour tout le monde.
    let message = "Jouez ensemble ! Proposez une lettre.";
    if(jeu1.gagne) message = "Mot trouvé ! Bravo !";

    return `
        <div class="card">
            <h1>Énigme 1 : Le Pendu</h1>
            <p class="message">${message}</p>
            <div class="mot">${jeu1.mot_affiche.join(' ')}</div>
            <p>Lettres incorrectes : <span class="lettres-incorrectes">${fausses.join(', ')}</span></p>
            <div class="clavier">${clavierHtml}</div>
        </div>`;
},
    attachEvents: (state) => {
        // Gestion du bouton recommencer en cas de défaite
        const restartBtn = document.getElementById('restart-pendu');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                window.socket.emit('game_action', {
                    token: state.token,
                    game: 'jeu1',
                    action: { type: 'restart' }
                });
            });
            return;
        }
        document.querySelectorAll('.touche-clavier').forEach(touche => {
            touche.addEventListener('click', () => {
                window.socket.emit('game_action', { 
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
};
