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
        // Confettis animés
        function launchConfetti() {
            const canvas = document.getElementById('confetti-canvas');
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const ctx = canvas.getContext('2d');
            const confs = [];
            const colors = ['#b6ff00','#00e6e6','#ffe066','#ff5e5e','#fff'];
            for(let i=0;i<120;i++){
                confs.push({
                    x: Math.random()*canvas.width,
                    y: Math.random()*-canvas.height,
                    r: 6+Math.random()*10,
                    d: 2+Math.random()*2,
                    color: colors[Math.floor(Math.random()*colors.length)],
                    tilt: Math.random()*10-5,
                    tiltAngle: 0,
                    tiltAngleInc: 0.02+Math.random()*0.04
                });
            }
            function draw(){
                ctx.clearRect(0,0,canvas.width,canvas.height);
                for(const c of confs){
                    ctx.beginPath();
                    ctx.ellipse(c.x,c.y,c.r,c.r/2, c.tilt,0,2*Math.PI);
                    ctx.fillStyle = c.color;
                    ctx.globalAlpha = 0.85;
                    ctx.fill();
                }
            }
            function update(){
                for(const c of confs){
                    c.y += c.d;
                    c.x += Math.sin(c.tilt)*2;
                    c.tilt += c.tiltAngleInc;
                    if(c.y>canvas.height+20){c.y = -10; c.x=Math.random()*canvas.width;}
                }
            }
            let frame=0;
            function loop(){
                draw();
                update();
                frame++;
                if(frame<400) requestAnimationFrame(loop);
                else ctx.clearRect(0,0,canvas.width,canvas.height);
            }
            loop();
        }
        setTimeout(launchConfetti, 200);
        // Bouton restart
        const btn = document.getElementById('restart-button');
        if (btn) btn.onclick = () => window.location.reload();
    }
};
