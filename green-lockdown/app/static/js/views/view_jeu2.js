// app/static/js/views/view_jeu2.js
window.views = window.views || {};

window.views.jeu2 = {
    render: (state) => {
        const jeu2 = state.jeu2_state;
        const scenario = jeu2.scenario;
        if (!scenario) return '<div class="card">Chargement du scénario...</div>';
        let cardsHtml = scenario.forces.map((force, i) => `
            <div class="force-card" data-force="${i}">
                <div class="force-symbol">${force.symbol}</div>
                <div class="clue">${jeu2.indices_reveles[i] ? force.clueText : ''}</div>
            </div>
        `).join('');
        return `
            <div class="card">
                <h1>Énigme 2 : ${scenario.title}</h1>
                <p>${scenario.scenarioText}</p>
                <div class="forces-row">${cardsHtml}</div>
                <div id="quiz-modal" class="modal" style="display:none;">
                    <div class="modal-content">
                        <span class="close">&times;</span>
                        <div id="quiz-question"></div>
                        <input id="quiz-answer" class="input" placeholder="Votre réponse">
                        <button id="quiz-validate" class="btn">Valider</button>
                        <div id="quiz-feedback"></div>
                    </div>
                </div>
                <div class="code-section">
                    <input id="final-code" class="input" maxlength="4" placeholder="Code final">
                    <button id="submit-code" class="btn">Valider le code</button>
                    <div class="code-feedback">${jeu2.gagne ? '<span class="success">Bravo ! Code correct.</span>' : (jeu2.code_propose && !jeu2.gagne ? '<span class="fail">Code incorrect.</span>' : '')}</div>
                </div>
            </div>
        `;
    },
    attachEvents: (state) => {
        const jeu2 = state.jeu2_state;
        const scenario = jeu2.scenario;
        if (!scenario) return;
        // Modal logic
        const modal = document.getElementById('quiz-modal');
        const closeBtn = modal.querySelector('.close');
        let currentForce = null;
        document.querySelectorAll('.force-card').forEach(card => {
            card.addEventListener('click', () => {
                const idx = parseInt(card.dataset.force);
                if (jeu2.indices_reveles[idx]) return;
                currentForce = idx;
                document.getElementById('quiz-question').textContent = scenario.forces[idx].quiz;
                document.getElementById('quiz-answer').value = '';
                document.getElementById('quiz-feedback').textContent = '';
                modal.style.display = 'block';
            });
        });
        closeBtn.onclick = () => { modal.style.display = 'none'; };
        window.onclick = (event) => { if (event.target === modal) modal.style.display = 'none'; };
        document.getElementById('quiz-validate').onclick = () => {
            const reponse = document.getElementById('quiz-answer').value;
            window.socket.emit('game_action', {
                token: state.token,
                game: 'jeu2',
                action: { type: 'quiz_answer', force_idx: currentForce, reponse }
            });
            modal.style.display = 'none';
        };
        document.getElementById('submit-code').onclick = () => {
            const code = document.getElementById('final-code').value;
            window.socket.emit('game_action', {
                token: state.token,
                game: 'jeu2',
                action: { type: 'submit_code', code }
            });
        };
    }
};
