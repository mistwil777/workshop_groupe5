// app/static/js/views/view_jeu4.js
window.views = window.views || {};

window.views.jeu4 = {
    render: (state) => {
        const jeu4 = state.jeu4_state;

        // On mélange les fragments pour en faire un puzzle
        const fragmentsMelanges = [...(jeu4.fragments || [])].sort(() => Math.random() - 0.5);

        // On génère le HTML pour chaque fragment "glissable"
        const fragmentsHtml = fragmentsMelanges.map((fragment, index) => 
            `<div class="fragment-draggable badge" draggable="true" data-text="${fragment}">${fragment}</div>`
        ).join('');

        return `
            <div class="card">
                <h1>Énigme 4 : Texte Fragmenté</h1>
                <p><b>Consigne :</b> Faites glisser les fragments dans la zone ci-dessous pour reconstituer la phrase.</p>
                
                <div class="fragments-source" style="margin: 20px 0; padding: 10px; background-color: #e0e0e0; border-radius: 8px; min-height: 50px;">
                    ${fragmentsHtml}
                </div>

                <div id="sentence-dropzone" class="fragments-destination" style="margin: 20px 0; padding: 10px; background-color: #f0f8ff; border-radius: 8px; min-height: 50px; border: 2px dashed #007bff;">
                    </div>

                <button id="validate-sentence" class="btn">Valider la phrase</button>
                <div class="code-feedback">${jeu4.gagne ? '<span class="success">Bravo ! Phrase correcte.</span>' : (jeu4.phrase_proposee && !jeu4.gagne ? '<span class="fail">Phrase incorrecte.</span>' : '')}</div>
            </div>
        `;
    },
    attachEvents: (state) => {
        const dropzone = document.getElementById('sentence-dropzone');
        const draggables = document.querySelectorAll('.fragment-draggable');
        const validateBtn = document.getElementById('validate-sentence');

        // Logique pour le glisser-déposer
        draggables.forEach(draggable => {
            draggable.addEventListener('dragstart', () => {
                draggable.classList.add('dragging');
            });
            draggable.addEventListener('dragend', () => {
                draggable.classList.remove('dragging');
            });
        });

        dropzone.addEventListener('dragover', e => {
            e.preventDefault();
            const afterElement = getDragAfterElement(dropzone, e.clientY);
            const dragging = document.querySelector('.dragging');
            if (afterElement == null) {
                dropzone.appendChild(dragging);
            } else {
                dropzone.insertBefore(dragging, afterElement);
            }
        });

        function getDragAfterElement(container, y) {
            const draggableElements = [...container.querySelectorAll('.fragment-draggable:not(.dragging)')];
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }

        // Logique pour le bouton "Valider"
        if (validateBtn) {
            validateBtn.onclick = () => {
                const fragmentsDansZone = [...dropzone.querySelectorAll('.fragment-draggable')];
                const phraseConstruite = fragmentsDansZone.map(f => f.dataset.text).join(' ');
                
                window.socket.emit('game_action', {
                    token: state.token,
                    game: 'jeu4',
                    action: { type: 'submit_sentence', sentence: phraseConstruite }
                });
            };
        }
    }
};