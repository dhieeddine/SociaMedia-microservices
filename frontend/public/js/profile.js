// ==================
// Gestion du profil utilisateur dynamique
// ==================

const USER_API = 'http://localhost:4000/api/users';
const POST_API = 'http://localhost:4000/api/posts';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Déterminer quel profil afficher
    const pathParts = window.location.pathname.split('/');
    const urlUsername = pathParts[pathParts.length - 1];

    // Si l'URL finit par /profile ou /profile/, urlUsername sera vide ou "profile"
    const targetUsername = (urlUsername && urlUsername !== 'profile') ? urlUsername : null;

    let userToDisplay = null;
    const currentUser = JSON.parse(localStorage.getItem('user'));

    try {
        if (targetUsername) {
            // Aller chercher les infos de l'utilisateur par son username
            const res = await fetch(`${USER_API}/username/${targetUsername}`);
            if (res.ok) {
                userToDisplay = await res.json();
            } else {
                console.error("Utilisateur non trouvé");
                window.location.href = '/';
                return;
            }
        } else if (currentUser) {
            // Utiliser l'utilisateur connecté
            const res = await fetch(`${USER_API}/${currentUser._id}`);
            if (res.ok) {
                userToDisplay = await res.json();
            } else {
                userToDisplay = currentUser; // Fallback
            }
        } else {
            window.location.href = '/login';
            return;
        }

        // 2. Mettre à jour l'UI avec les infos utilisateur
        updateProfileUI(userToDisplay, currentUser);

        // 3. Charger les posts de l'utilisateur
        loadUserPosts(userToDisplay._id);

    } catch (error) {
        console.error('❌ Erreur:', error);
    }
});

function updateProfileUI(user, currentUser) {
    const nameEl = document.getElementById('profile-name');
    const usernameEl = document.getElementById('profile-username');
    const avatarEl = document.getElementById('profile-avatar');
    const coverEl = document.getElementById('profile-cover');
    const bioEl = document.getElementById('profile-bio');
    const followersEl = document.getElementById('count-followers');
    const followingEl = document.getElementById('count-following');
    const editBtn = document.getElementById('edit-profile-btn');
    const followBtn = document.getElementById('follow-btn');
    const changeAvatarBtn = document.getElementById('change-avatar-btn');
    const changeCoverBtn = document.getElementById('change-cover-btn');

    if (nameEl) nameEl.textContent = user.name;
    if (usernameEl) usernameEl.textContent = `@${user.username}`;
    if (bioEl) bioEl.textContent = user.bio || "🚀 Passionné de tech & développement web";
    if (avatarEl) {
        avatarEl.src = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0ea5e9&color=fff&size=128`;
    }
    if (coverEl && user.coverImage) {
        coverEl.style.backgroundImage = `url(${user.coverImage})`;
        coverEl.classList.remove('bg-gradient-to-r', 'from-primary-400', 'via-primary-500', 'to-purple-500');
    }

    if (followersEl) {
        followersEl.textContent = user.followers ? user.followers.length : 0;
        followersEl.parentElement.onclick = () => showUsersList(user._id, 'followers');
    }
    if (followingEl) {
        followingEl.textContent = user.following ? user.following.length : 0;
        followingEl.parentElement.onclick = () => showUsersList(user._id, 'following');
    }

    // Gérer l'affichage des boutons (Modifier vs Suivre)
    const isOwnProfile = currentUser && user._id === currentUser._id;

    if (isOwnProfile) {
        if (editBtn) {
            editBtn.classList.remove('hidden');
            editBtn.onclick = () => openEditModal(user);
        }
        if (followBtn) followBtn.classList.add('hidden');

        // Activer les boutons de changement d'image
        if (changeAvatarBtn) {
            changeAvatarBtn.classList.remove('hidden');
            changeAvatarBtn.onclick = () => document.getElementById('avatar-input').click();
        }
        if (changeCoverBtn) {
            changeCoverBtn.classList.remove('hidden');
            changeCoverBtn.onclick = () => document.getElementById('cover-input').click();
        }

        // Setup image upload handlers
        setupImageUploadHandlers(user);
    } else {
        if (editBtn) editBtn.classList.add('hidden');
        if (changeAvatarBtn) changeAvatarBtn.classList.add('hidden');
        if (changeCoverBtn) changeCoverBtn.classList.add('hidden');
        if (followBtn) {
            followBtn.classList.remove('hidden');
            // Vérifier si on suit déjà
            const isFollowing = user.followers && user.followers.includes(currentUser ? currentUser._id : '');
            followBtn.textContent = isFollowing ? 'Suivi' : 'Suivre';
            followBtn.className = isFollowing ? 'btn-secondary px-6' : 'btn-primary px-6';

            followBtn.onclick = () => toggleFollow(user, isFollowing);
        }
    }
}

function setupImageUploadHandlers(user) {
    const avatarInput = document.getElementById('avatar-input');
    const coverInput = document.getElementById('cover-input');

    if (avatarInput) {
        avatarInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                await uploadImage(file, 'avatar', user);
            }
        };
    }

    if (coverInput) {
        coverInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                await uploadImage(file, 'coverImage', user);
            }
        };
    }
}

async function uploadImage(file, type, user) {
    // Vérifier la taille du fichier (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('L\'image est trop grande. Maximum 5MB.');
        return;
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image.');
        return;
    }

    try {
        // Convertir en base64
        const base64 = await fileToBase64(file);

        // Envoyer au serveur
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const updateData = {};
        updateData[type] = base64;

        const res = await fetch(`${USER_API}/${currentUser._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });

        if (res.ok) {
            const updatedUser = await res.json();
            // Mettre à jour le localStorage si c'est l'avatar
            if (type === 'avatar') {
                const userData = JSON.parse(localStorage.getItem('user'));
                localStorage.setItem('user', JSON.stringify({ ...userData, avatar: updatedUser.avatar }));
            }
            location.reload();
        } else {
            const errorData = await res.json().catch(() => ({}));
            console.error('Erreur serveur:', res.status, errorData);
            alert('Erreur lors de la mise à jour de l\'image: ' + (errorData.error || res.statusText));
        }
    } catch (err) {
        console.error('Erreur upload:', err);
        alert('Erreur lors de l\'upload de l\'image');
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function openEditModal(user) {
    const modal = document.getElementById('edit-profile-modal');
    const nameInput = document.getElementById('edit-name');
    const bioInput = document.getElementById('edit-bio');

    if (nameInput) nameInput.value = user.name;
    if (bioInput) bioInput.value = user.bio || "";

    if (modal) modal.classList.remove('hidden');
}

// Global setup for modal listeners
document.addEventListener('DOMContentLoaded', () => {
    const editModal = document.getElementById('edit-profile-modal');
    const closeEditBtn = document.getElementById('close-edit-modal');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const editForm = document.getElementById('edit-profile-form');

    const closeEditModal = () => editModal && editModal.classList.add('hidden');

    if (closeEditBtn) closeEditBtn.onclick = closeEditModal;
    if (cancelEditBtn) cancelEditBtn.onclick = closeEditModal;

    const usersModal = document.getElementById('users-modal');
    const closeUsersBtn = document.getElementById('close-users-modal');
    if (closeUsersBtn) closeUsersBtn.onclick = () => usersModal && usersModal.classList.add('hidden');

    if (editForm) {
        editForm.onsubmit = async (e) => {
            e.preventDefault();
            const currentUser = JSON.parse(localStorage.getItem('user'));
            const newName = document.getElementById('edit-name').value;
            const newBio = document.getElementById('edit-bio').value;

            try {
                const res = await fetch(`${USER_API}/${currentUser._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newName, bio: newBio })
                });

                if (res.ok) {
                    const updatedUser = await res.json();
                    const userData = JSON.parse(localStorage.getItem('user'));
                    localStorage.setItem('user', JSON.stringify({ ...userData, name: updatedUser.name }));
                    location.reload();
                } else {
                    alert("Erreur lors de la mise à jour");
                }
            } catch (err) {
                console.error(err);
            }
        };
    }
});

async function showUsersList(userId, type) {
    const modal = document.getElementById('users-modal');
    const title = document.getElementById('users-modal-title');
    const list = document.getElementById('users-list');

    if (!modal || !list) return;

    title.textContent = type === 'followers' ? 'Abonnés' : 'Abonnements';
    list.innerHTML = '<div class="text-center py-4 text-gray-400">Chargement...</div>';
    modal.classList.remove('hidden');

    try {
        const res = await fetch(`${USER_API}/${userId}/${type}`);
        const users = await res.json();

        if (users.length === 0) {
            list.innerHTML = `<div class="text-center py-4 text-gray-500">Aucun ${type === 'followers' ? 'abonné' : 'abonnement'}.</div>`;
            return;
        }

        list.innerHTML = users.map(user => `
            <div class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-dark-300 rounded-xl transition-colors cursor-pointer" onclick="window.location.href='/profile/${user.username}'">
                <div class="flex items-center gap-3">
                    <img src="${user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0ea5e9&color=fff`}" 
                         alt="${user.name}" class="w-10 h-10 rounded-full object-cover">
                    <div>
                        <h4 class="font-bold text-sm text-gray-900 dark:text-white">${user.name}</h4>
                        <p class="text-xs text-gray-500">@${user.username}</p>
                    </div>
                </div>
                <button class="text-primary-500 text-sm font-semibold hover:underline">Voir</button>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
        list.innerHTML = '<div class="text-center py-4 text-red-500 text-sm">Erreur lors du chargement.</div>';
    }
}

async function loadUserPosts(userId) {
    const grid = document.getElementById('profile-posts-grid');
    const countPostsEl = document.getElementById('count-posts');
    if (!grid) return;

    try {
        const res = await fetch(`${POST_API}/user/${userId}`);
        const posts = await res.json();

        if (countPostsEl) countPostsEl.textContent = posts.length;

        if (posts.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500">Aucune publication.</div>';
            return;
        }

        grid.innerHTML = posts.map(post => {
            const mediaSrc = post.image || post.video || '';
            const isVideo = !!post.video;

            return `
                <div class="relative group aspect-square overflow-hidden rounded-xl cursor-pointer bg-gray-100 dark:bg-dark-300">
                    ${mediaSrc ? (isVideo ?
                    `<video src="${mediaSrc}" class="w-full h-full object-cover"></video>` :
                    `<img src="${mediaSrc}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300">`
                ) : `
                        <div class="flex items-center justify-center h-full p-4 text-center text-xs text-gray-500 italic">
                            ${post.content ? post.content.substring(0, 50) + (post.content.length > 50 ? '...' : '') : 'Post sans média'}
                        </div>
                    `}
                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                        <div class="flex items-center gap-1">
                            <svg class="w-5 h-5 shadow-sm" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                            <span class="font-bold">${post.likes ? post.likes.length : 0}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (e) {
        console.error("Erreur posts profil:", e);
    }
}

async function toggleFollow(targetUser, isFollowing) {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) return alert("Connectez-vous pour suivre des utilisateurs");

    const endpoint = isFollowing ? 'unfollow' : 'follow';
    try {
        const res = await fetch(`${USER_API}/${targetUser._id}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser._id })
        });

        if (res.ok) {
            location.reload();
        }
    } catch (e) {
        console.error(e);
    }
}
