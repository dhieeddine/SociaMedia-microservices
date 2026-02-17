// ==================
// Gestion des Amis et Messages
// ==================

const GATEWAY_URL = 'http://localhost:4000';

// Fonction pour suivre/ne plus suivre un utilisateur
async function toggleFollow(targetUserId, btnElement) {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) return alert("Veuillez vous connecter !");

    const isFollowing = btnElement.classList.contains('following');
    const endpoint = isFollowing ? 'unfollow' : 'follow';

    try {
        const res = await fetch(`${GATEWAY_URL}/api/users/${targetUserId}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser._id })
        });

        if (res.ok) {
            // Update UI immediately
            if (isFollowing) {
                btnElement.textContent = 'Suivre';
                btnElement.classList.remove('following', 'text-gray-500');
                btnElement.classList.add('text-primary-500');
            } else {
                btnElement.textContent = 'Suivi';
                btnElement.classList.add('following', 'text-gray-500');
                btnElement.classList.remove('text-primary-500');
            }
        } else {
            const data = await res.json();
            alert(data.error);
        }
    } catch (err) {
        console.error(err);
    }
}

// Charger la liste des utilisateurs pour suggestions (Feed)
async function loadSuggestions() {
    const suggestionsBox = document.getElementById('suggestions-box');
    if (!suggestionsBox) return;

    try {
        const res = await fetch(`${GATEWAY_URL}/api/users`);
        const users = await res.json();
        const currentUser = JSON.parse(localStorage.getItem('user'));

        // Filtrer pour ne pas afficher soi-même ou ceux qu'on suit déjà
        const suggestions = users.filter(u => u._id !== currentUser._id && !u.followers.includes(currentUser._id));

        const html = suggestions.slice(0, 5).map(user => `
            <div class="flex items-center justify-between py-3 border-b border-gray-100 dark:border-dark-400 last:border-0">
              <div class="flex items-center gap-3">
                <img src="https://ui-avatars.com/api/?name=${user.name}&background=random" alt="${user.name}" class="w-10 h-10 rounded-full">
                <div>
                  <h4 class="font-semibold text-sm">${user.name}</h4>
                  <p class="text-xs text-gray-500">@${user.username}</p>
                </div>
              </div>
              <button onclick="followUser('${user._id}')" class="text-primary-500 hover:text-primary-600 text-sm font-semibold">Suivre</button>
            </div>
        `).join('');

        suggestionsBox.innerHTML = html;

    } catch (err) {
        console.error("Erreur chargement suggestions", err);
    }
}

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
    loadSuggestions();
});
