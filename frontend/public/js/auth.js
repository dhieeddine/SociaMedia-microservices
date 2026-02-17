// ==================
// Gestion de l'authentification
// ==================

const API_URL = 'http://localhost:4000/api/users';

// Redirection automatique si déjà connecté
if (localStorage.getItem('user') && (window.location.pathname === '/login' || window.location.pathname === '/register')) {
    window.location.href = '/';
}

// ==================
// Connexion
// ==================
const loginForm = document.getElementById('login-form');
if (loginForm) {
    console.log("✅ Script auth.js : Formulaire de connexion détecté");
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("⏳ Tentative de connexion...");

        const btn = loginForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = "Connexion en cours...";

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                console.log("✅ Succès, redirection...");
                localStorage.setItem('user', JSON.stringify(data.user));

                // On utilise replace pour forcer le navigateur à sortir de la page de login
                window.location.replace('/');
            } else {
                console.error("❌ Échec connexion :", data.error);
                alert("Erreur : " + (data.error || 'Identifiants incorrects'));
                btn.disabled = false;
                btn.textContent = "Se connecter";
            }
        } catch (error) {
            console.error('❌ Erreur réseau :', error);
            alert('Impossible de contacter le serveur. Vérifiez que la Gateway (port 4000) et le User Service (port 5000) sont lancés.');
            btn.disabled = false;
            btn.textContent = "Se connecter";
        }
    });
}

// ==================
// Inscription
// ==================
const registerForm = document.getElementById('register-form');
if (registerForm) {
    console.log("✅ Script auth.js : Formulaire d'inscription détecté");
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("⏳ Tentative d'inscription...");

        const btn = registerForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = "Création du compte...";

        const name = document.getElementById('name').value;
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                console.log("✅ Inscription réussie !");
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.replace('/');
            } else {
                console.error("❌ Échec inscription :", data.error);
                alert("Erreur : " + (data.error || 'Impossible de s\'inscrire'));
                btn.disabled = false;
                btn.textContent = "Créer mon compte";
            }
        } catch (error) {
            console.error('❌ Erreur :', error);
            alert('Erreur de connexion au serveur.');
            btn.disabled = false;
            btn.textContent = "Créer mon compte";
        }
    });
}

// ==================
// Déconnexion
// ==================
function logout() {
    localStorage.removeItem('user');
    window.location.replace('/login');
}

window.logout = logout;
