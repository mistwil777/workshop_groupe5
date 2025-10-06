// app/static/js/views/view_jeu4.js
// Vue pour l'énigme 4 : Texte Fragmenté
window.views = window.views || {};

window.views.jeu4 = {
    render: (state) => {
        const jeu4 = state.jeu4_state;
        const joueurs = jeu4.joueurs || [];
        const monSid = window.monSid;
        let idx = joueurs.indexOf(monSid);
        if (idx === -1) idx = 0;
        const fragment = jeu4.fragments[idx % jeu4.fragments.length];
        return `
            <div class="card">
                <h1>Énigme 4 : Texte Fragmenté</h1>
                <p><b>Fragment pour toi :</b> <span class="badge">${fragment}</span></p>
                <input id="sentence-input" class="input" placeholder="Phrase complète">
                <button id="validate-sentence" class="btn">Valider</button>
                <div class="code-feedback">${jeu4.gagne ? '<span class="success">Bravo ! Phrase correcte.</span>' : (jeu4.phrase_proposee && !jeu4.gagne ? '<span class="fail">Phrase incorrecte.</span>' : '')}</div>
            </div>
        `;
    },
    attachEvents: (state) => {
        const validateBtn = document.getElementById('validate-sentence');
        const input = document.getElementById('sentence-input');
        if (input) input.focus();
        if (validateBtn && input) {
            validateBtn.onclick = () => {
                let sentence = input.value.trim().toLowerCase();
                // Supprime les espaces multiples et articles pour la validation
                sentence = sentence.replace(/\s+/g, ' ');
                sentence = sentence.replace(/\b(le|la|les|l')/g, '');
                window.socket.emit('game_action', {
                    token: state.token,
                    game: 'jeu4',
                    action: { type: 'submit_sentence', sentence }
                });
            };
            input.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') validateBtn.click();
            });
        }
    }
};
