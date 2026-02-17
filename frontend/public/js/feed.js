// ==================
// Logic for Dynamic Feed (Posts & Stories)
// ==================

const POST_API = 'http://localhost:4000/api/posts';
const USER_API = 'http://localhost:4000/api/users';
const STORY_API = 'http://localhost:4000/api/stories';
const COMMENT_API = 'http://localhost:4000/api/comments';

let selectedPostMedia = { type: null, data: null };

async function loadFeed() {
  const postsContainer = document.getElementById('posts-feed');
  if (!postsContainer) return;

  try {
    const resPosts = await fetch(POST_API);
    const posts = await resPosts.json();

    const userCache = {};
    const postsWithUser = await Promise.all(posts.map(async post => {
      // Helper to get user from cache or API
      const getAuthor = async (userId) => {
        if (userCache[userId]) return userCache[userId];
        try {
          const resUser = await fetch(`${USER_API}/${userId}`);
          if (!resUser.ok) throw new Error();
          const user = await resUser.json();
          userCache[userId] = user;
          return user;
        } catch (e) {
          return { name: 'Utilisateur', username: 'user', avatar: null };
        }
      };

      const author = await getAuthor(post.userId);
      let sharedAuthor = null;
      if (post.sharedFrom) {
        sharedAuthor = await getAuthor(post.sharedFrom.userId);
      }

      return {
        ...post,
        author,
        sharedAuthor
      };
    }));

    if (posts.length === 0) {
      postsContainer.innerHTML = `
                <div class="text-center py-10 text-gray-500">
                    <p>Aucun post pour le moment. Soyez le premier à publier !</p>
                </div>`;
      return;
    }

    postsContainer.innerHTML = postsWithUser.map(post => {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const isLiked = post.likes && post.likes.includes(currentUser ? currentUser._id : '');
      const isShared = !!post.sharedFrom;

      return `
              <article class="post-card mb-6 bg-white dark:bg-dark-200 rounded-xl shadow-md p-4">
                <div class="flex items-center justify-between mb-4">
                  <a href="/profile/${post.author.username}" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <img src="https://ui-avatars.com/api/?name=${post.author.name}&background=random"
                      alt="${post.author.name}" class="w-10 h-10 rounded-full">
                    <div>
                      <h4 class="font-semibold text-sm">${post.author.name}</h4>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        @${post.author.username} • ${new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </a>
                  ${isShared ? '<span class="text-xs text-primary-500 font-medium">a partagé un post</span>' : ''}
                </div>

                <p class="mb-4 text-gray-800 dark:text-gray-200">${post.content}</p>

                <!-- Shared Post Content -->
                ${isShared ? `
                  <div class="mb-4 border border-gray-100 dark:border-dark-400 rounded-xl p-4 bg-gray-50 dark:bg-dark-300">
                    <div class="flex items-center gap-2 mb-3">
                       <img src="${post.sharedAuthor.avatar || `https://ui-avatars.com/api/?name=${post.sharedAuthor.name}&background=random`}" 
                            class="w-6 h-6 rounded-full object-cover">
                       <span class="text-xs font-bold">${post.sharedAuthor.name}</span>
                       <span class="text-[10px] text-gray-500">• post original</span>
                    </div>
                    <p class="text-sm mb-3">${post.sharedFrom.content || ''}</p>
                    ${post.sharedFrom.image ? `<img src="${post.sharedFrom.image}" class="rounded-lg max-h-60 w-full object-cover">` : ''}
                  </div>
                ` : `
                  ${post.image ? `
                    <div class="mb-4 -mx-4">
                      <img src="${post.image}" alt="Post image" class="w-full object-cover max-h-96">
                    </div>` : ''}
                  
                  ${post.video ? `
                    <div class="mb-4 -mx-4">
                      <video src="${post.video}" controls class="w-full object-cover max-h-96"></video>
                    </div>` : ''}
                `}

                <!-- Reaction Summary -->
                <div id="reactions-summary-${post._id}" class="mb-4 flex items-center justify-between">
                  ${renderReactionsSummary(post)}
                </div>

                <div class="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-dark-400">
                  <div class="flex gap-4">
                    <button onclick="toggleLike('${post._id}')" class="flex items-center gap-2 ${isLiked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500 transition-colors">
                      <svg class="w-5 h-5" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      <span class="text-sm">${post.likes ? post.likes.length : 0}</span>
                    </button>

                    <button onclick="toggleCommentSection('${post._id}')" class="flex items-center gap-2 text-gray-500 hover:text-primary-500 transition-colors">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      <span class="text-sm">Commenter</span>
                    </button>

                    <button onclick="sharePost('${post._id}')" class="flex items-center gap-2 text-gray-500 hover:text-green-500 transition-colors">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                      <span class="text-sm">${post.shares ? post.shares.length : 0}</span>
                    </button>
                    
                    <div class="relative group">
                      <button class="flex items-center gap-2 text-gray-500 hover:text-primary-500 transition-colors">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </button>
                      <div class="absolute bottom-full left-0 mb-2 hidden group-hover:flex bg-white dark:bg-dark-300 shadow-xl rounded-full p-2 gap-2 border border-gray-100 dark:border-dark-400 z-10 animate-fade-in-up">
                        <span onclick="addReaction('${post._id}', 'like')" class="cursor-pointer hover:scale-125 transition-transform">👍</span>
                        <span onclick="addReaction('${post._id}', 'love')" class="cursor-pointer hover:scale-125 transition-transform">❤️</span>
                        <span onclick="addReaction('${post._id}', 'haha')" class="cursor-pointer hover:scale-125 transition-transform">😂</span>
                        <span onclick="addReaction('${post._id}', 'wow')" class="cursor-pointer hover:scale-125 transition-transform">😮</span>
                        <span onclick="addReaction('${post._id}', 'sad')" class="cursor-pointer hover:scale-125 transition-transform">😢</span>
                        <span onclick="addReaction('${post._id}', 'angry')" class="cursor-pointer hover:scale-125 transition-transform">😡</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Comment Section -->
                <div class="mt-4 hidden border-t border-gray-100 dark:border-dark-400 pt-4" id="comment-section-${post._id}">
                  <div class="space-y-4 mb-4 max-h-60 overflow-y-auto scrollbar-hide" id="comments-list-${post._id}">
                    <!-- Comments will be loaded here -->
                  </div>
                  <div class="flex gap-2">
                    <img src="https://ui-avatars.com/api/?name=${currentUser ? currentUser.name : 'User'}&background=random" 
                         class="w-8 h-8 rounded-full">
                    <div class="flex-1 relative">
                      <input type="text" id="comment-input-${post._id}" placeholder="Écrire un commentaire..." 
                        class="w-full bg-gray-100 dark:bg-dark-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        onkeypress="if(event.key === 'Enter') submitComment('${post._id}')">
                      <button onclick="submitComment('${post._id}')" class="absolute right-2 top-1/2 -translate-y-1/2 text-primary-500 hover:text-primary-600 p-1">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
        `;
    }).join('');

  } catch (err) {
    console.error("Erreur chargement feed:", err);
  }
}

async function sharePost(postId) {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) return alert("Veuillez vous connecter pour partager");

  const comment = prompt("Voulez-vous ajouter un commentaire à ce partage ?");
  if (comment === null) return; // Annulé

  try {
    const res = await fetch(`${POST_API}/${postId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user._id, content: comment })
    });

    if (res.ok) {
      alert("Post partagé avec succès !");
      loadFeed();
    } else {
      alert("Erreur lors du partage");
    }
  } catch (err) {
    console.error(err);
  }
}


// ==================
// Comment Logic
// ==================

async function toggleCommentSection(postId) {
  const section = document.getElementById(`comment-section-${postId}`);
  if (section.classList.contains('hidden')) {
    section.classList.remove('hidden');
    loadComments(postId);
  } else {
    section.classList.add('hidden');
  }
}

async function loadComments(postId) {
  const list = document.getElementById(`comments-list-${postId}`);
  list.innerHTML = '<p class="text-xs text-center text-gray-500">Chargement des commentaires...</p>';

  try {
    const res = await fetch(`${COMMENT_API}/post/${postId}`);
    const comments = await res.json();

    if (comments.length === 0) {
      list.innerHTML = '<p class="text-xs text-center text-gray-500">Aucun commentaire.</p>';
      return;
    }

    list.innerHTML = comments.map(comment => `
      <div class="flex gap-2 group">
        <img src="https://ui-avatars.com/api/?name=${comment.username}&background=random" class="w-8 h-8 rounded-full">
        <div class="flex-1 bg-gray-50 dark:bg-dark-300 rounded-2xl px-3 py-2 text-sm">
          <p class="font-semibold text-xs">${comment.username}</p>
          <p class="text-gray-800 dark:text-gray-200">${comment.content}</p>
        </div>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = '<p class="text-xs text-center text-red-500">Erreur lors du chargement.</p>';
  }
}

async function submitComment(postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  const content = input.value.trim();
  if (!content) return;

  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) return alert("Veuillez vous connecter pour commenter");

  try {
    const res = await fetch(COMMENT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId,
        userId: user._id,
        username: user.username,
        content
      })
    });

    if (res.ok) {
      input.value = '';
      loadComments(postId);
    } else {
      alert("Erreur lors de l'envoi du commentaire");
    }
  } catch (err) {
    console.error(err);
  }
}

// Handle New Post Creation & Media
async function setupPostCreation() {
  const btnPublish = document.getElementById('btn-publish');
  const textarea = document.getElementById('post-content');
  const btnImage = document.getElementById('btn-post-image');
  const btnVideo = document.getElementById('btn-post-video');
  const inputImage = document.getElementById('post-image-input');
  const inputVideo = document.getElementById('post-video-input');
  const previewBox = document.getElementById('post-media-preview');
  const previewImg = document.getElementById('preview-img');
  const previewVid = document.getElementById('preview-video');
  const btnRemove = document.getElementById('remove-media');

  if (!btnPublish) return;

  // Trigger inputs
  btnImage.onclick = () => inputImage.click();
  btnVideo.onclick = () => inputVideo.click();

  // Handle Image Select
  inputImage.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        selectedPostMedia = { type: 'image', data: evt.target.result };
        previewImg.src = evt.target.result;
        previewImg.classList.remove('hidden');
        previewVid.classList.add('hidden');
        previewBox.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Video Select
  inputVideo.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        selectedPostMedia = { type: 'video', data: evt.target.result };
        previewVid.src = evt.target.result;
        previewVid.classList.remove('hidden');
        previewImg.classList.add('hidden');
        previewBox.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove media
  btnRemove.onclick = () => {
    selectedPostMedia = { type: null, data: null };
    previewBox.classList.add('hidden');
    inputImage.value = '';
    inputVideo.value = '';
  };

  // Publish
  btnPublish.onclick = async () => {
    const content = textarea.value.trim();
    if (!content && !selectedPostMedia.data) return alert("Le post ne peut pas être vide");

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return alert("Veuillez vous connecter");

    const payload = {
      userId: user._id,
      content: content
    };
    if (selectedPostMedia.type === 'image') payload.image = selectedPostMedia.data;
    if (selectedPostMedia.type === 'video') payload.video = selectedPostMedia.data;

    try {
      const res = await fetch(POST_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        textarea.value = '';
        btnRemove.click(); // Clear media
        loadFeed();
      } else {
        alert("Erreur lors de la publication");
      }
    } catch (e) {
      console.error(e);
    }
  };
}

// Load Stories
async function loadStories() {
  const storiesContainer = document.getElementById('stories-box');
  if (!storiesContainer) return;

  try {
    const res = await fetch(STORY_API);
    const groupedStories = await res.json();

    const storiesWithUser = await Promise.all(groupedStories.map(async group => {
      try {
        const resUser = await fetch(`${USER_API}/${group._id}`);
        const user = await resUser.json();
        return { user, stories: group.stories };
      } catch (e) { return null; }
    }));

    const validStories = storiesWithUser.filter(s => s !== null);

    let html = `
            <div class="flex-shrink-0 flex flex-col items-center cursor-pointer" onclick="document.getElementById('story-upload').click()">
                <div class="relative">
                    <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-dark-300 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-dark-400 hover:border-primary-500 transition-colors">
                        <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                    </div>
                </div>
                <span class="text-xs mt-2 text-gray-600 dark:text-gray-400">Ajouter</span>
            </div>
        `;

    html += validStories.map(item => `
            <div onclick="openStoryGroup('${item.user.username}', '${item.user.name}', '${encodeURIComponent(JSON.stringify(item.stories))}')" class="flex-shrink-0 flex flex-col items-center cursor-pointer group">
                <div class="p-0.5 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 group-hover:scale-105 transition-transform">
                    <img src="https://ui-avatars.com/api/?name=${item.user.name}&background=random" 
                         alt="${item.user.name}" 
                         class="w-16 h-16 rounded-full border-2 border-white dark:border-dark-200">
                </div>
                <span class="text-xs mt-2 text-gray-600 dark:text-gray-400 truncate w-16 text-center group-hover:text-primary-500 transition-colors">${item.user.username}</span>
            </div>
        `).join('');

    storiesContainer.innerHTML = html;
  } catch (err) {
    console.error("Erreur stories:", err);
  }
}

async function toggleLike(postId) {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) return alert("Veuillez vous connecter");

  try {
    const res = await fetch(`${POST_API}/${postId}/like`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user._id })
    });
    if (res.ok) loadFeed();
  } catch (e) { console.error(e); }
}

function renderReactionsSummary(post) {
  if (!post.reactions || post.reactions.length === 0) return '<div></div>';

  const currentUser = JSON.parse(localStorage.getItem('user'));
  const currentUserId = currentUser ? currentUser._id : null;

  const counts = {};
  post.reactions.forEach(r => counts[r.type] = (counts[r.type] || 0) + 1);

  const emojiMap = { like: '👍', love: '❤️', haha: '😂', wow: '😮', sad: '😢', angry: '😡' };

  let html = '<div class="flex items-center gap-2 px-1">';

  // Emojis summary
  html += '<div class="flex -space-x-1">';
  Object.keys(counts).forEach(type => {
    html += `<span class="flex items-center justify-center w-5 h-5 rounded-full bg-white dark:bg-dark-300 shadow-sm border border-gray-100 dark:border-dark-400 text-[10px] z-10">${emojiMap[type]}</span>`;
  });
  html += '</div>';

  // Text summary
  const total = post.reactions.length;
  const userReaction = post.reactions.find(r => r.userId === currentUserId);

  let reactors = post.reactions
    .filter(r => r.userId !== currentUserId)
    .slice(-2)
    .map(r => r.username || 'Quelqu\'un');

  if (userReaction) {
    reactors.unshift('Vous');
  } else {
    // If user didn't react, take one more from the list if available
    reactors = post.reactions.slice(-3).map(r => r.username || 'Quelqu\'un');
  }

  let text = '';
  if (total === 1) {
    text = `<b>${reactors[0]}</b>`;
  } else if (total === 2) {
    text = `<b>${reactors[0]}</b> et <b>${reactors[1]}</b>`;
  } else {
    text = `<b>${reactors[0]}</b>, <b>${reactors[1]}</b> et ${total - 2} autres`;
  }

  html += `<span class="text-xs text-gray-500 dark:text-gray-400">${text}</span>`;
  html += '</div>';

  return html;
}

async function addReaction(postId, type) {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) return alert("Veuillez vous connecter");

  try {
    const res = await fetch(`${POST_API}/${postId}/react`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user._id, username: user.username, type })
    });
    if (res.ok) {
      const updatedPost = await res.json();
      const summaryDiv = document.getElementById(`reactions-summary-${postId}`);
      if (summaryDiv) {
        summaryDiv.innerHTML = renderReactionsSummary(updatedPost);
      }
    }
  } catch (e) { console.error(e); }
}

// Story Viewer Logic
let currentStoryGroup = [];
let currentStoryIndex = 0;

function openStoryGroup(username, name, storiesJson) {
  currentStoryGroup = JSON.parse(decodeURIComponent(storiesJson));
  currentStoryIndex = 0;
  openStory(username, name, currentStoryGroup[0].image);
}

function openStory(username, name, image) {
  const modal = document.getElementById('story-modal');
  const avatar = document.getElementById('story-avatar');
  const userDisplay = document.getElementById('story-username');
  const storyImage = document.getElementById('story-image');
  const progressBar = document.getElementById('story-progress');

  progressBar.style.width = '0%';
  avatar.src = `https://ui-avatars.com/api/?name=${name}&background=random`;
  userDisplay.textContent = name;
  storyImage.src = image;

  modal.classList.remove('hidden');
  setTimeout(() => progressBar.style.width = '100%', 100);

  if (window.currentStoryTimeout) clearTimeout(window.currentStoryTimeout);
  window.currentStoryTimeout = setTimeout(() => nextStory(username, name), 5000);

  modal.onclick = (e) => {
    if (e.target.closest('.left-0.w-1\\/3')) prevStory(username, name);
    else if (e.target.closest('.right-0.w-1\\/3')) nextStory(username, name);
  };
}

function nextStory(username, name) {
  if (currentStoryIndex < currentStoryGroup.length - 1) {
    currentStoryIndex++;
    openStory(username, name, currentStoryGroup[currentStoryIndex].image);
  } else {
    closeStory();
  }
}

function prevStory(username, name) {
  if (currentStoryIndex > 0) {
    currentStoryIndex--;
    openStory(username, name, currentStoryGroup[currentStoryIndex].image);
  }
}

function closeStory() {
  const modal = document.getElementById('story-modal');
  modal.classList.add('hidden');
  clearTimeout(window.currentStoryTimeout);
  document.getElementById('story-progress').style.width = '0%';
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  // Set current user avatar
  const user = JSON.parse(localStorage.getItem('user'));
  if (user) {
    const avatarImg = document.getElementById('current-user-avatar');
    if (avatarImg) avatarImg.src = `https://ui-avatars.com/api/?name=${user.name}&background=random`;
  }

  loadFeed();
  setupPostCreation();
  loadStories();

  // Close story modal
  const closeBtn = document.getElementById('close-story');
  if (closeBtn) closeBtn.onclick = closeStory;

  // Handle Story Upload
  const storyUpload = document.getElementById('story-upload');
  if (storyUpload) {
    storyUpload.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return alert("Veuillez vous connecter");
        try {
          const res = await fetch(STORY_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user._id, image: evt.target.result })
          });
          if (res.ok) {
            alert("Story publiée !");
            loadStories();
          }
        } catch (e) { console.error(e); }
      };
      reader.readAsDataURL(file);
    };
  }
});
