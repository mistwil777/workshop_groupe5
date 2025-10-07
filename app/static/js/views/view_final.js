// app/static/js/views/view_final.js
// Vue pour l'écran final : saisie du mot de passe
window.views = window.views || {};

window.views.final = {
    render: (state) => {
        const indices = (state.indices_collectes || []).join(' ');
        return `
            <div class="card">
                <h1>DÉSACTIVATION DU SYSTÈME</h1>
                <p>Entrez le mot de passe final pour sauver la planète :</p>
                <div class="indices">Indices collectés : <b>${indices}</b></div>
                <input id="final-password" class="input" maxlength="5" placeholder="Mot de passe (5 lettres)">
                <button id="validate-final" class="btn">Valider</button>
                <div class="code-feedback" id="final-feedback"></div>
            </div>
        `;
    },
    attachEvents: (state) => {
        const btn = document.getElementById('validate-final');
        const input = document.getElementById('final-password');
        if (btn && input) {
            btn.onclick = () => {
                const password = input.value;
                window.socket.emit('game_action', {
                    token: state.token,
                    game: 'final',
                    action: { type: 'submit_password', password }
                });
            };
            input.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') btn.click();
            });
        }
    }
};
