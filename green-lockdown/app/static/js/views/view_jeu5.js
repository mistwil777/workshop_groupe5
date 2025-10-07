// app/static/js/views/view_jeu5.js
// Vue pour l'énigme 5 : Quiz Croisé
window.views = window.views || {};

window.views.jeu5 = {
    render: (state) => {
        const jeu5 = state.jeu5_state;
        const joueurs = jeu5.joueurs || [];
        const monSid = window.monSid;
        let idx = joueurs.indexOf(monSid);
        if (idx === -1) idx = 0;
        const q = jeu5.questions[idx % jeu5.questions.length];
        // Statut des joueurs
        let joueursHtml = joueurs.map(sid => {
            const a = jeu5.player_answers && jeu5.player_answers[sid];
            return `<li>${sid === monSid ? '<b>Moi</b>' : 'Joueur'} : ${a && a.answered && a.correct ? '✔️' : ''}</li>`;
        }).join('');
        return `
            <div class="card">
                <h1>Énigme 5 : Quiz Croisé</h1>
                <p><b>Ta question :</b> ${q.question}</p>
                <div class="quiz-options">
                    ${q.options.map(opt => `<button class="btn quiz-option">${opt}</button>`).join(' ')}
                </div>
                <ul class="joueurs-liste">${joueursHtml}</ul>
                <div class="code-feedback">${jeu5.gagne ? '<span class="success">Bravo ! Toutes les réponses sont correctes.</span>' : ''}</div>
            </div>
        `;
    },
    attachEvents: (state) => {
        const jeu5 = state.jeu5_state;
        const joueurs = jeu5.joueurs || [];
        const monSid = window.monSid;
        let idx = joueurs.indexOf(monSid);
        if (idx === -1) idx = 0;
        const q = jeu5.questions[idx % jeu5.questions.length];
        document.querySelectorAll('.quiz-option').forEach(btn => {
            btn.onclick = () => {
                window.socket.emit('game_action', {
                    token: state.token,
                    game: 'jeu5',
                    action: { type: 'submit_answer', answer: btn.textContent }
                });
            };
        });
    }
};
