// ==================
// Gestion des notifications
// ==================

const NOTIF_API = 'http://localhost:4000/api/notifications';

document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return window.location.href = '/login';

    await loadNotifications(user._id);
});

async function loadNotifications(userId) {
    const container = document.getElementById('notifications-container');
    if (!container) return;

    try {
        const res = await fetch(`${NOTIF_API}/${userId}`);
        const notifications = await res.json();

        if (notifications.length === 0) {
            container.innerHTML = '<div class="text-center py-10 text-gray-500">Aucune notification pour le moment.</div>';
            return;
        }

        container.innerHTML = notifications.map(notif => {
            const date = new Date(notif.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            });

            const icon = getIcon(notif.type);

            return `
                <div onclick="markAsRead('${notif._id}')" 
                     class="bg-white dark:bg-dark-200 p-4 rounded-xl shadow-sm flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-dark-300 transition-colors cursor-pointer ${notif.read ? 'opacity-60' : 'border-l-4 border-primary-500'}">
                    <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-300 flex items-center justify-center text-xl">
                        ${icon}
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-medium ${notif.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}">
                            ${notif.message}
                        </p>
                        <p class="text-xs text-gray-500 mt-1">${date}</p>
                    </div>
                    ${!notif.read ? '<div class="w-2 h-2 bg-primary-500 rounded-full"></div>' : ''}
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error("Erreur chargement notifs:", err);
        container.innerHTML = '<div class="text-center py-10 text-red-500">Erreur lors du chargement des notifications.</div>';
    }
}

function getIcon(type) {
    switch (type) {
        case 'follow': return '👤';
        case 'like': return '❤️';
        case 'message': return '💬';
        default: return '🔔';
    }
}

async function markAsRead(notifId) {
    try {
        await fetch(`${NOTIF_API}/${notifId}/read`, { method: 'PUT' });
        // On ne recharge pas forcément tout, on peut juste changer l'opacité
        location.reload();
    } catch (err) {
        console.error(err);
    }
}
