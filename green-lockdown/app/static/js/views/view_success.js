// app/static/js/views/view_success.js
// Vue pour l'écran de victoire finale
window.views = window.views || {};

// Vue de succès paramétrable : victoire de jeu OU victoire finale
window.views.success = {
    render: (state) => {
        // Détermine le type de succès : finale ou intermédiaire
        const isFinal = state && state.final_state && state.final_state.gagne;
        let title = isFinal ? 'SYSTÈME DÉSACTIVÉ' : 'Bravo !';
        let message = isFinal ? 'PLANÈTE SAUVÉE !' : (state && state.success_message ? state.success_message : "Tu as réussi l'énigme !");
        let recapHtml = '';
        if (isFinal) {
            // Récapitulatif des temps
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
            recapHtml = `<div class="chrono-recap">
                <h3>Récapitulatif des temps</h3>
                <ul style="list-style:none;padding:0;text-align:left;max-width:260px;margin:0 auto 10px auto;">
                    <li><b>Temps global :</b> ${fmt(globalSecs)}</li>
                    <li><b>Jeu 1 :</b> ${fmt(jeu1)}</li>
                    <li><b>Jeu 2 :</b> ${fmt(jeu2)}</li>
                    <li><b>Jeu 3 :</b> ${fmt(jeu3)}</li>
                    <li><b>Jeu 4 :</b> ${fmt(jeu4)}</li>
                    <li><b>Jeu 5 :</b> ${fmt(jeu5)}</li>
                </ul>
            </div>`;
        }
        // Animation : confettis (finale) ou artifices (intermédiaire)
        let animCanvas = isFinal
            ? '<canvas id="confetti-canvas" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2000;pointer-events:none;"></canvas>'
            : '<canvas id="artifices-canvas" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2000;pointer-events:none;"></canvas>';
        // Bouton
        let btn = isFinal
            ? '<button id="restart-button" class="btn">Recommencer</button>'
            : '<button id="continue-button" class="btn">Continuer</button>';
        return `
            ${animCanvas}
            <div class="card">
                <h1>${title}</h1>
                <p class="success">${message}</p>
                ${recapHtml}
                ${btn}
            </div>
        `;
    },
    attachEvents: (state) => {
        const isFinal = state && state.final_state && state.final_state.gagne;
        // Son
        if (window.AudioHandler) {
            try {
                let audio = new Audio(isFinal ? '/static/audio/fin_partie.mp3' : '/static/audio/fin_jeu.mp3');
                audio.volume = 0.5;
                audio.play().catch(()=>{});
            } catch(e) {}
        }
        // Animation
        if (isFinal) {
            if (typeof lancerConfettis === 'function') {
                lancerConfettis();
            } else {
                // fallback confettis locale
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
            }
            // Bouton restart
            const btn = document.getElementById('restart-button');
            if (btn) btn.onclick = () => window.location.reload();
        } else {
            // Artifices (animation simplifiée)
            function launchArtifices() {
                const canvas = document.getElementById('artifices-canvas');
                if (!canvas) return;
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                const ctx = canvas.getContext('2d');
                const colors = ['#b6ff00','#00e6e6','#ffe066','#ff5e5e','#fff'];
                let particles = [];
                for(let i=0;i<8;i++){
                    let angle = (i/8)*2*Math.PI;
                    for(let j=0;j<30;j++){
                        particles.push({
                            x: canvas.width/2,
                            y: canvas.height-30,
                            vx: Math.cos(angle)*(2+Math.random()*3)*(0.7+0.6*Math.random()),
                            vy: -Math.sin(angle)*(2+Math.random()*3)*(0.7+0.6*Math.random()),
                            color: colors[Math.floor(Math.random()*colors.length)],
                            life: 60+Math.random()*30
                        });
                    }
                }
                function draw(){
                    ctx.clearRect(0,0,canvas.width,canvas.height);
                    for(const p of particles){
                        ctx.beginPath();
                        ctx.arc(p.x,p.y,3,0,2*Math.PI);
                        ctx.fillStyle = p.color;
                        ctx.globalAlpha = Math.max(0,p.life/90);
                        ctx.fill();
                    }
                }
                function update(){
                    for(const p of particles){
                        p.x += p.vx;
                        p.y += p.vy;
                        p.vy += 0.08; // gravité
                        p.life--;
                    }
                    particles = particles.filter(p=>p.life>0);
                }
                let frame=0;
                function loop(){
                    draw();
                    update();
                    frame++;
                    if(frame<90) requestAnimationFrame(loop);
                    else ctx.clearRect(0,0,canvas.width,canvas.height);
                }
                loop();
            }
            setTimeout(launchArtifices, 200);
            // Bouton continuer
            const btn = document.getElementById('continue-button');
            if (btn) btn.onclick = () => {
                if (state && typeof state.success_next_vue === 'string') {
                    window.socket.emit('changer_vue', { token: maRoomState.token, vue: state.success_next_vue });
                } else {
                    window.location.reload();
                }
            };
        }
    }
};
