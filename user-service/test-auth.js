// Script de test pour les endpoints d'authentification
const testRegister = async () => {
    console.log('🧪 Test 1: Inscription d\'un nouvel utilisateur...');

    const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Test User',
            username: '@testuser',
            email: 'test@example.com',
            password: 'password123'
        })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
    console.log('');

    return data;
};

const testLogin = async () => {
    console.log('🧪 Test 2: Connexion avec les identifiants créés...');

    const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
        })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
    console.log('');
};

const testWrongPassword = async () => {
    console.log('🧪 Test 3: Connexion avec un mauvais mot de passe...');

    const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'test@example.com',
            password: 'wrongpassword'
        })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
    console.log('');
};

const testDuplicateEmail = async () => {
    console.log('🧪 Test 4: Inscription avec un email déjà utilisé...');

    const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Another User',
            username: '@anotheruser',
            email: 'test@example.com', // Email déjà utilisé
            password: 'password456'
        })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
    console.log('');
};

// Exécuter tous les tests
(async () => {
    try {
        await testRegister();
        await testLogin();
        await testWrongPassword();
        await testDuplicateEmail();

        console.log('✅ Tous les tests sont terminés!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
})();
