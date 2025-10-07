// Vue de félicitations après le jeu 2
window.views = window.views || {};

window.views.success_jeu2 = {
    render: (state) => {
        return `
            <canvas id="confetti-canvas" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2000;pointer-events:none;"></canvas>
            <div class="card">
                <h1>Bravo !</h1>
                <p class="success">Tu as réussi l'énigme 2 !</p>
                <button id="continue-button" class="btn">Continuer</button>
            </div>
        `;
    },
    attachEvents: () => {
        // Confettis animés (copié depuis view_success.js)
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
        // Bouton continuer
        const btn = document.getElementById('continue-button');
        if (btn) btn.onclick = () => {
            // Demande au serveur de passer à la vue suivante (indice2 ou jeu3)
            window.socket.emit('changer_vue', { token: maRoomState.token, vue: 'indice2' });
        };
    }
};
