// app/static/js/views/view_jeu2.js
window.views = window.views || {};

window.views.jeu2 = {
    render: (state) => {
        const jeu2 = state.jeu2_state;
        const scenario = jeu2.scenario;
        if (!scenario) return '<div class="card">Chargement du scénario...</div>';
        // Trouver la première question non résolue
        const nextIdx = jeu2.indices_reveles.findIndex(v => !v);
        let questionsHtml = '';
        scenario.forces.forEach((force, i) => {
            questionsHtml += `<div class="force-step" style="margin-bottom:1.5em;">
                <div class="force-symbol" style="font-size:2em;">${force.symbol}</div>`;
            if (jeu2.indices_reveles[i]) {
                // Affiche le chiffre indice généré dynamiquement
                const chiffre = (jeu2.indices_chiffres && jeu2.indices_chiffres[i]) ? jeu2.indices_chiffres[i] : '?';
                questionsHtml += `<div class="clue">Indice : <b>${chiffre}</b></div>`;
            } else if (i === nextIdx) {
                questionsHtml += `
                    <div class="quiz-question">${force.quiz}</div>
                    <input id="quiz-answer" class="input" placeholder="Votre réponse">
                    <button id="quiz-validate" class="btn">Valider</button>
                    <div id="quiz-feedback"></div>
                `;
                // Affichage de l'indice d'aide après 2 erreurs
                if (jeu2.indices_aide && jeu2.indices_aide[i] && force.help) {
                    questionsHtml += `<div class="help-hint" style="color:#ffe066;margin-top:8px;"><b>Indice :</b> ${force.help}</div>`;
                }
            }
            questionsHtml += `</div>`;
        });
        return `
            <div class="card">
                <h1>Énigme 2 : ${scenario.title}</h1>
                <p>${scenario.scenarioText}</p>
                <div class="forces-steps">${questionsHtml}</div>
                <div class="code-section">
                    <input id="final-code" class="input" maxlength="4" placeholder="Code final" ${jeu2.indices_reveles.every(v=>v)?'':'disabled'}>
                    <button id="submit-code" class="btn" ${jeu2.indices_reveles.every(v=>v)?'':'disabled'}>Valider le code</button>
                    <div class="code-feedback">${jeu2.gagne ? '<span class="success">Bravo ! Code correct.</span>' : (jeu2.code_propose && !jeu2.gagne ? '<span class="fail">Code incorrect.</span>' : '')}</div>
                </div>
            </div>
        `;
    },
    attachEvents: (state) => {
        const jeu2 = state.jeu2_state;
        const scenario = jeu2.scenario;
        if (!scenario) return;
        // Trouver la première question non résolue
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
        // Code final
        const codeBtn = document.getElementById('submit-code');
        const codeInput = document.getElementById('final-code');
        if (codeBtn && codeInput && jeu2.indices_reveles.every(v=>v)) {
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
};
