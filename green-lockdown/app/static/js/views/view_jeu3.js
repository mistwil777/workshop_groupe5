// app/static/js/views/view_jeu3.js
// Vue pour l'énigme 3 : Code Secret Partagé
window.views = window.views || {};

window.views.jeu3 = {
    render: (state) => {
        const jeu3 = state.jeu3_state;
        const joueurs = jeu3.joueurs || [];
        const monSid = window.monSid;
        let idx = joueurs.indexOf(monSid);
        if (idx === -1) idx = 0; // fallback
        let cluesHtml = '';
        if (joueurs.length <= 1) {
            // Mode solo : affiche tous les indices
            cluesHtml = '<ul style="margin-bottom:1em;">' + jeu3.clues.map((clue, i) => `<li><b>Indice ${i+1} :</b> <span class="badge">${clue}</span></li>`).join('') + '</ul>';
        } else {
            // Multi-joueur : un indice par joueur
            cluesHtml = `<p><b>Indice pour toi :</b> <span class="badge">${jeu3.clues[idx % jeu3.clues.length]}</span></p>`;
        }
        return `
            <div class="card">
                <h1>Énigme 3 : Code Secret Partagé</h1>
                <p style="margin-bottom:1em;"><b>Consigne :</b> <br>${joueurs.length <= 1 ? "Tu joues seul : utilise tous les indices pour trouver le code complet à 3 chiffres." : "Chaque joueur reçoit un indice pour un chiffre du code. <br><b>Discutez entre vous</b> pour reconstituer le code complet à 3 chiffres."}<br> </span></p>
                ${cluesHtml}
                <input id="code-input" class="input" maxlength="3" placeholder="Code à 3 chiffres">
                <button id="validate-code" class="btn">Valider</button>
                <div class="code-feedback">${jeu3.gagne ? '<span class="success">Bravo ! Code correct.</span>' : (jeu3.code_propose && !jeu3.gagne ? '<span class="fail">Code incorrect.</span>' : '')}</div>
            </div>
        `;
    },
    attachEvents: (state) => {
        // Force le focus sur le champ texte après chaque rendu
        setTimeout(() => {
            const codeInput = document.getElementById('code-input');
            if (codeInput) codeInput.focus();
        }, 80);
        const validateBtn = document.getElementById('validate-code');
        const codeInput = document.getElementById('code-input');
        if (validateBtn && codeInput) {
            validateBtn.onclick = () => {
                let code = codeInput.value.trim().toLowerCase();
                code = code.replace(/\s+/g, '');
                code = code.replace(/\b(le|la|les|l')/g, '');
                window.socket.emit('game_action', {
                    token: state.token,
                    game: 'jeu3',
                    action: { type: 'submit_code', code }
                });
            };
            codeInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') validateBtn.click();
            });
        }
    }
};
