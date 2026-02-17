// ==================
// Charger les données utilisateur globalement
// ==================
document.addEventListener('DOMContentLoaded', () => {
  const userStr = localStorage.getItem('user');

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      
      // Fonction pour obtenir l'avatar (personnalisé ou généré)
      const getAvatarUrl = (name, avatar) => {
        if (avatar) return avatar;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0ea5e9&color=fff`;
      };

      // Mettre à jour l'avatar dans la navbar
      const navbarAvatar = document.querySelector('a[href="/profile"] img');
      if (navbarAvatar) {
        navbarAvatar.src = getAvatarUrl(user.name, user.avatar);
        navbarAvatar.alt = user.name;
      }

      // Mettre à jour le nom dans la sidebar (si présent)
      const sidebarName = document.querySelector('.sidebar-user-name');
      if (sidebarName) {
        sidebarName.textContent = user.name;
      }

      const sidebarUsername = document.querySelector('.sidebar-user-username');
      if (sidebarUsername) {
        sidebarUsername.textContent = user.username;
      }

      // Mettre à jour l'avatar dans le feed (section créer post)
      const feedAvatars = document.querySelectorAll('.current-user-avatar');
      feedAvatars.forEach(img => {
        img.src = getAvatarUrl(user.name, user.avatar);
        img.alt = user.name;
      });

      console.log('👤 Utilisateur chargé:', user.name);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données utilisateur:', error);
    }
  }

  // Gestion de la déconnexion
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('user');
      window.location.href = '/login';
    });
  }

  // Notifications
  if (userStr) {
    const user = JSON.parse(userStr);
    checkNotifications(user._id);
    setInterval(() => checkNotifications(user._id), 30000); // Toutes les 30s
  }
});

async function checkNotifications(userId) {
  try {
    const res = await fetch(`http://localhost:4000/api/notifications/${userId}`);
    const notifs = await res.json();
    const badge = document.getElementById('notif-badge');
    if (!badge) return;

    const unread = notifs.filter(n => !n.read).length;
    if (unread > 0) {
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  } catch (err) {
    console.error("Erreur check notifs:", err);
  }
}

// ==================
// Dark Mode Toggle
// ==================
document.addEventListener('DOMContentLoaded', () => {
  const darkModeToggle = document.getElementById('darkModeToggle');

  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      const isDark = document.documentElement.classList.contains('dark');
      localStorage.setItem('darkMode', isDark);
    });
  }
});

// ==================
// Like Button Animation
// ==================
document.querySelectorAll('[data-like-btn]').forEach(btn => {
  btn.addEventListener('click', function () {
    this.classList.toggle('text-red-500');
    const heart = this.querySelector('svg');
    if (heart) {
      heart.classList.add('scale-125');
      setTimeout(() => heart.classList.remove('scale-125'), 200);
    }
  });
});

// ==================
// Auto-resize textarea
// ==================
document.querySelectorAll('textarea').forEach(textarea => {
  textarea.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
  });
});

// ==================
// Mobile Menu Toggle
// ==================
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');

if (mobileMenuBtn && mobileMenu) {
  mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
  });
}

// ==================
// Hide scrollbar for stories
// ==================
const style = document.createElement('style');
style.textContent = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;
document.head.appendChild(style);

console.log('🚀 SocialVibe loaded successfully!');
