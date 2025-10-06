// Attend que tout le contenu de la page soit chargé avant d'exécuter le script
document.addEventListener('DOMContentLoaded', () => {

    // Connexion au serveur WebSocket
    const socket = io("http://localhost:5001");

    // --- Récupération des éléments du DOM ---
    // On stocke les éléments de la page dans des variables pour y accéder facilement
    const motContainer = document.getElementById('mot-container');
    const lettresFaussesElement = document.getElementById('lettres-fausses');
    const messageJeu = document.getElementById('message-jeu');
    const clavierContainer = document.getElementById('clavier-container');

    // Variable pour stocker mon rôle ('operateur' ou 'observateur')
    let monRole = null;

    // --- Gestion des événements SocketIO ---

    // Événement de connexion initial
    socket.on('connect', () => {
        console.log('Connecté au serveur WebSocket avec l-id :', socket.id);
    });

    // Événement principal : le serveur envoie le nouvel état du jeu
    socket.on('mise_a_jour_etat', (etatJeu) => {
        console.log("Nouvel état du jeu reçu :", etatJeu);
        
        // On détermine mon rôle en comparant mon ID (socket.id) avec l'ID de l'opérateur
        monRole = (socket.id === etatJeu.operateur_sid) ? 'operateur' : 'observateur';

        // On met à jour l'affichage de la page avec les nouvelles données
        mettreAJourAffichage(etatJeu);
    });


    // --- Fonctions d'affichage ---

    function mettreAJourAffichage(etatJeu) {
        // 1. Mettre à jour le mot affiché (ex: _ E C _ C L _ _ E)
        motContainer.textContent = etatJeu.mot_affiche.join(' ');

        // 2. Mettre à jour la liste des lettres fausses
        const fausses = Array.from(etatJeu.lettres_proposees).filter(lettre => !etatJeu.mot_a_deviner.includes(lettre));
        lettresFaussesElement.textContent = fausses.join(', ');

        // 3. Afficher le message du jeu
        messageJeu.textContent = etatJeu.message;

        // 4. Gérer l'affichage et l'état du clavier
        // Si je suis l'opérateur ET que la partie n'est pas terminée...
        if (monRole === 'operateur' && !etatJeu.partie_terminee) {
            clavierContainer.classList.remove('hidden'); // On affiche le clavier
            mettreAJourClavier(etatJeu.lettres_proposees);
        } else {
            clavierContainer.classList.add('hidden'); // Sinon, on le cache
        }
    }

    function mettreAJourClavier(lettresProposees) {
        // On génère le clavier s'il est vide
        if (clavierContainer.innerHTML === '') {
            genererClavier();
        }

        // On parcourt toutes les touches du clavier
        document.querySelectorAll('.touche-clavier').forEach(touche => {
            // Si la lettre de la touche a déjà été proposée...
            if (lettresProposees.has(touche.dataset.lettre)) {
                touche.disabled = true; // On la désactive
                touche.classList.add('utilisee');
            } else {
                touche.disabled = false;
                touche.classList.remove('utilisee');
            }
        });
    }

    function genererClavier() {
        // On nettoie le conteneur au cas où
        clavierContainer.innerHTML = '';
        // On crée une touche pour chaque lettre de l'alphabet
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').forEach(lettre => {
            const touche = document.createElement('button');
            touche.textContent = lettre;
            touche.dataset.lettre = lettre; // On stocke la lettre dans un attribut data-*
            touche.classList.add('touche-clavier');
            
            // On ajoute un écouteur d'événement sur chaque touche
            touche.addEventListener('click', () => {
                // Quand on clique, on envoie la lettre au serveur
                socket.emit('proposer_lettre', { lettre: lettre });
            });
            clavierContainer.appendChild(touche);
        });
    }
});
