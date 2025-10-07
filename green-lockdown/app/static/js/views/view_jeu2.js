// app/static/js/views/view_jeu2.js
window.views = window.views || {};

window.views.jeu2 = {
    render: (state) => {
        const jeu2 = state.jeu2_state;
        const scenario = jeu2.scenario;
        if (!scenario) return '<div class="card">Chargement du scénario...</div>';

        // --- Écran d'introduction si le jeu n'a pas commencé ---
        if (!jeu2.partie_commencee) {
            return `
                <div class="card">
                    <h1>Énigme 2 : ${scenario.title}</h1>
                    <p>${scenario.scenarioText}</p>
                    <div class="actions">
                        <button id="start-jeu2-button" class="btn">Commencer</button>
                    </div>
                </div>
            `;
        }

        // --- Affichage du jeu une fois commencé ---
        const nextIdx = jeu2.indices_reveles.findIndex(v => !v);
        let questionsHtml = '';

        scenario.forces.forEach((force, i) => {
            questionsHtml += `<div class="force-step" style="margin-bottom:1.5em;">
                <div class="force-symbol" style="font-size:2em;">${force.symbol}</div>`;
            
            if (jeu2.indices_reveles[i]) {
                const chiffre = (jeu2.indices_chiffres && jeu2.indices_chiffres[i]) ? jeu2.indices_chiffres[i] : '?';
                questionsHtml += `<div class="clue">Indice Obtenu : <b>${chiffre}</b></div>`;
            } else if (i === nextIdx) {
                questionsHtml += `
                    <div class="quiz-question">${force.quiz}</div>
                    <input id="quiz-answer" class="input" placeholder="Votre réponse">
                    <button id="quiz-validate" class="btn">Valider</button>
                    <div id="quiz-feedback"></div>
                `;
                if (jeu2.indices_aide && jeu2.indices_aide[i] && force.help) {
                    questionsHtml += `<div class="help-hint" style="color:#ffe066;margin-top:8px;"><b>Indice :</b> ${force.help}</div>`;
                }
            } else {
                questionsHtml += `<div class="small"><em>Énigme à résoudre...</em></div>`;
            }
            questionsHtml += `</div>`;
        });

        const tousIndicesTrouves = jeu2.indices_reveles.every(v => v);
        const codeFinalAttendu = (jeu2.indices_chiffres || []).join('');

        return `
            <div class="card">
                <h1>Énigme 2 : ${scenario.title}</h1>
                <p><strong>Objectif :</strong> Répondez aux questions pour trouver les 4 chiffres du code secret.</p>
                <hr>
                <div class="forces-steps">${questionsHtml}</div>
                <hr>
                <div class="code-section">
                    <p class="small">Une fois les 4 chiffres trouvés, entrez le code dans l'ordre de leur apparition.</p>
                    <input id="final-code" class="input" maxlength="${scenario.forces.length}" placeholder="Code final attendu : ${codeFinalAttendu}" ${tousIndicesTrouves ? '' : 'disabled'}>
                    <button id="submit-code" class="btn" ${tousIndicesTrouves ? '' : 'disabled'}>Valider le code</button>
                    <div class="code-feedback">${jeu2.gagne ? '<span class="correct">Bravo ! Code correct.</span>' : (jeu2.code_propose && !jeu2.gagne ? '<span class="wrong">Code incorrect.</span>' : '')}</div>
                </div>
            </div>
        `;
    },
    attachEvents: (state) => {
        const jeu2 = state.jeu2_state;
        const scenario = jeu2.scenario;
        if (!scenario) return;

        // --- Attache l'événement au bouton "Commencer" ---
        const startButton = document.getElementById('start-jeu2-button');
        if (startButton) {
            startButton.onclick = () => {
                window.socket.emit('game_action', {
                    token: state.token,
                    game: 'jeu2',
                    action: { type: 'start_game' }
                });
            };
            return;
        }

        // --- Attache les événements pour la question active ---
        const nextIdx = jeu2.indices_reveles.findIndex(v => !v);
        if (nextIdx !== -1) {
            const validateBtn = document.getElementById('quiz-validate');
            const answerInput = document.getElementById('quiz-answer');
            if (validateBtn && answerInput) {
                validateBtn.onclick = () => {
                    const reponse = answerInput.value;
                    window.socket.emit('game_action', {
                        token: state.token,
                        game: 'jeu2',
                        action: { type: 'quiz_answer', force_idx: nextIdx, reponse }
                    });
                };
                answerInput.addEventListener('keyup', (e) => {
                    if (e.key === 'Enter') validateBtn.click();
                });
            }
        }

        // --- Attache les événements pour le code final ---
        const codeBtn = document.getElementById('submit-code');
        const codeInput = document.getElementById('final-code');
        if (codeBtn && codeInput && jeu2.indices_reveles.every(v => v)) {
            codeBtn.onclick = () => {
                const code = codeInput.value;
                window.socket.emit('game_action', {
                    token: state.token,
                    game: 'jeu2',
                    action: { type: 'submit_code', code }
                });
            };
            codeInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') codeBtn.click();
            });
        }
    }
}
