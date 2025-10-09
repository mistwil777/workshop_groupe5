// app/static/js/views/view_success.js
// Vue pour l'écran de victoire finale
window.views = window.views || {};

window.views.success = {
    render: (state) => {
        // Récupère les temps depuis le frontend (window)
        let globalSecs = 0, jeu1 = 0, jeu2 = 0, jeu3 = 0, jeu4 = 0, jeu5 = 0;
        if (window.__chrono_recap) {
            globalSecs = window.__chrono_recap.global || 0;
            jeu1 = window.__chrono_recap.jeu1 || 0;
            jeu2 = window.__chrono_recap.jeu2 || 0;
            jeu3 = window.__chrono_recap.jeu3 || 0;
            jeu4 = window.__chrono_recap.jeu4 || 0;
            jeu5 = window.__chrono_recap.jeu5 || 0;
        }
        function fmt(secs) {
            const m = Math.floor(secs/60); const s = secs%60;
            return (m<10?'0':'')+m+":"+(s<10?'0':'')+s;
        }
        // Ajoute le canvas confettis
        return `
            <canvas id="confetti-canvas" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2000;pointer-events:none;"></canvas>
            <div class="card">
                <h1>SYSTÈME DÉSACTIVÉ</h1>
                <p class="success">PLANÈTE SAUVÉE !</p>
                <div class="chrono-recap">
                    <h3>Récapitulatif des temps</h3>
                    <ul style="list-style:none;padding:0;text-align:left;max-width:260px;margin:0 auto 10px auto;">
                        <li><b>Temps global :</b> ${fmt(globalSecs)}</li>
                        <li><b>Jeu 1 :</b> ${fmt(jeu1)}</li>
                        <li><b>Jeu 2 :</b> ${fmt(jeu2)}</li>
                        <li><b>Jeu 3 :</b> ${fmt(jeu3)}</li>
                        <li><b>Jeu 4 :</b> ${fmt(jeu4)}</li>
                        <li><b>Jeu 5 :</b> ${fmt(jeu5)}</li>
                    </ul>
                </div>
                <button id="restart-button" class="btn">Recommencer</button>
            </div>
        `;
    },
    attachEvents: () => {
        setTimeout(() => { if (window.lancerConfettis) lancerConfettis(); }, 200);
        const btn = document.getElementById('restart-button');
        if (btn) btn.onclick = () => window.location.reload();
    }
};
