// FishSNS Frontend Application
dayjs.locale('ja');
dayjs.extend(window.dayjs_plugin_relativeTime);

class FishSNS {
  constructor() {
    this.currentUser = null;
    this.posts = [];
    this.species = [];
    this.currentPage = 1;
    this.isLoading = false;
    this.selectedPost = null;
    this.init();
  }

  async init() {
    // Check localStorage for user
    const savedUser = localStorage.getItem('fishsns_user');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
    }
    
    // Load initial data
    await this.loadSpecies();
    await this.loadPosts();
    
    // Render the app
    this.render();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Start real-time updates (polling every 30 seconds)
    setInterval(() => this.loadPosts(false), 30000);
  }

  async loadSpecies() {
    try {
      const response = await axios.get('/api/species');
      this.species = response.data.species;
    } catch (error) {
      console.error('Failed to load species:', error);
    }
  }

  async loadPosts(showLoading = true) {
    if (this.isLoading) return;
    
    this.isLoading = true;
    if (showLoading) this.showLoadingSpinner();
    
    try {
      const response = await axios.get(`/api/posts?page=${this.currentPage}`);
      this.posts = response.data.posts;
      this.renderPosts();
    } catch (error) {
      console.error('Failed to load posts:', error);
      this.showError('投稿の読み込みに失敗しました');
    } finally {
      this.isLoading = false;
      if (showLoading) this.hideLoadingSpinner();
    }
  }

  render() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <!-- Header -->
      <header class="bg-gradient-to-r from-blue-500 to-cyan-500 text-white sticky top-0 z-50 shadow-lg">
        <div class="container mx-auto px-4 py-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <i class="fas fa-fish text-2xl"></i>
              <h1 class="text-xl font-bold">FishSNS</h1>
            </div>
            
            <nav class="flex items-center space-x-4">
              <button onclick="app.showNewPostModal()" class="bg-white text-blue-500 px-4 py-2 rounded-full font-semibold hover:bg-blue-50 transition">
                <i class="fas fa-plus mr-2"></i>投稿
              </button>
              
              ${this.currentUser ? `
                <div class="flex items-center space-x-3">
                  <img src="${this.currentUser.avatar_url}" alt="${this.currentUser.display_name}" class="w-8 h-8 rounded-full">
                  <span class="font-medium">${this.currentUser.display_name}</span>
                  <button onclick="app.logout()" class="text-white/80 hover:text-white">
                    <i class="fas fa-sign-out-alt"></i>
                  </button>
                </div>
              ` : `
                <button onclick="app.showLoginModal()" class="bg-white text-blue-500 px-4 py-2 rounded-full font-semibold hover:bg-blue-50 transition">
                  ログイン
                </button>
              `}
            </nav>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="container mx-auto px-4 py-6 max-w-4xl">
        <!-- Filter Tabs -->
        <div class="bg-white rounded-lg shadow mb-6 p-4">
          <div class="flex space-x-4 overflow-x-auto">
            <button class="px-4 py-2 rounded-full bg-blue-500 text-white font-medium whitespace-nowrap">
              <i class="fas fa-home mr-2"></i>タイムライン
            </button>
            <button onclick="app.showRankings()" class="px-4 py-2 rounded-full hover:bg-gray-100 font-medium whitespace-nowrap">
              <i class="fas fa-trophy mr-2"></i>ランキング
            </button>
            <button class="px-4 py-2 rounded-full hover:bg-gray-100 font-medium whitespace-nowrap">
              <i class="fas fa-map-marker-alt mr-2"></i>近くの釣果
            </button>
            <button class="px-4 py-2 rounded-full hover:bg-gray-100 font-medium whitespace-nowrap">
              <i class="fas fa-fish mr-2"></i>魚種別
            </button>
          </div>
        </div>

        <!-- Posts Container -->
        <div id="posts-container" class="space-y-4">
          <!-- Posts will be rendered here -->
        </div>

        <!-- Loading Spinner -->
        <div id="loading-spinner" class="hidden flex justify-center py-8">
          <div class="spinner"></div>
        </div>
      </main>

      <!-- Modals -->
      <div id="modals"></div>
    `;
  }

  renderPosts() {
    const container = document.getElementById('posts-container');
    
    if (this.posts.length === 0) {
      container.innerHTML = `
        <div class="bg-white rounded-lg shadow p-8 text-center">
          <i class="fas fa-fish text-6xl text-gray-300 mb-4"></i>
          <p class="text-gray-500">まだ投稿がありません</p>
          <p class="text-gray-400 text-sm mt-2">最初の釣果を投稿してみましょう！</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.posts.map(post => this.renderPostCard(post)).join('');
  }

  renderPostCard(post) {
    const timeAgo = dayjs(post.created_at).fromNow();
    const isLiked = this.currentUser && post.likes?.includes(this.currentUser.id);
    
    return `
      <div class="post-card bg-white rounded-lg shadow hover:shadow-lg transition-shadow" data-post-id="${post.id}">
        <!-- User Header -->
        <div class="p-4 border-b">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <img src="${post.avatar_url}" alt="${post.display_name}" class="w-10 h-10 rounded-full">
              <div>
                <div class="font-semibold">${post.display_name}</div>
                <div class="text-sm text-gray-500">@${post.username} · ${timeAgo}</div>
              </div>
            </div>
            
            ${post.location_name ? `
              <div class="text-sm text-gray-500">
                <i class="fas fa-map-marker-alt mr-1"></i>${post.location_name}
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Content -->
        <div class="p-4">
          ${post.content ? `<p class="mb-3">${post.content}</p>` : ''}
          
          <!-- Fish Catches -->
          ${post.catches && post.catches.length > 0 ? `
            <div class="space-y-2 mb-3">
              ${post.catches.map(fish => `
                <div class="flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3">
                  <div class="flex items-center space-x-3">
                    <i class="fas fa-fish text-blue-500 text-xl"></i>
                    <div>
                      <div class="font-semibold">${fish.species_name_ja || fish.species_name}</div>
                      <div class="text-sm text-gray-600">
                        ${fish.size_cm ? `${fish.size_cm}cm` : ''}
                        ${fish.weight_kg ? ` / ${fish.weight_kg}kg` : ''}
                      </div>
                    </div>
                  </div>
                  ${fish.tackle || fish.bait ? `
                    <div class="text-sm text-gray-500 text-right">
                      ${fish.tackle ? `<div><i class="fas fa-fishing-rod mr-1"></i>${fish.tackle}</div>` : ''}
                      ${fish.bait ? `<div><i class="fas fa-bug mr-1"></i>${fish.bait}</div>` : ''}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <!-- Media -->
          ${post.media && post.media.length > 0 ? `
            <div class="image-grid image-grid-${Math.min(post.media.length, 4)} mb-3">
              ${post.media.slice(0, 4).map((media, index) => `
                <div class="image-item relative overflow-hidden rounded-lg bg-gray-100">
                  ${media.media_type === 'image' ? `
                    <img src="${media.url}" alt="釣果写真" class="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform" onclick="app.showImageModal('${media.url}')">
                  ` : `
                    <video src="${media.url}" class="w-full h-full object-cover" controls></video>
                  `}
                  ${post.media.length > 4 && index === 3 ? `
                    <div class="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-2xl font-bold">
                      +${post.media.length - 4}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Weather & Tide -->
          ${post.weather || post.tide ? `
            <div class="flex space-x-4 text-sm text-gray-500 mb-3">
              ${post.weather ? `<span><i class="fas fa-cloud-sun mr-1"></i>${post.weather}</span>` : ''}
              ${post.tide ? `<span><i class="fas fa-water mr-1"></i>${post.tide}</span>` : ''}
            </div>
          ` : ''}
        </div>

        <!-- Interaction Bar -->
        <div class="px-4 py-3 border-t flex items-center justify-between">
          <div class="flex space-x-6">
            <button onclick="app.toggleLike(${post.id})" class="like-btn flex items-center space-x-1 text-gray-500 hover:text-red-500 transition ${isLiked ? 'liked' : ''}">
              <i class="${isLiked ? 'fas' : 'far'} fa-heart"></i>
              <span>${post.like_count || 0}</span>
            </button>
            
            <button onclick="app.showComments(${post.id})" class="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition">
              <i class="far fa-comment"></i>
              <span>${post.comment_count || 0}</span>
            </button>
            
            <button class="flex items-center space-x-1 text-gray-500 hover:text-green-500 transition">
              <i class="fas fa-retweet"></i>
              <span>${post.repost_count || 0}</span>
            </button>
          </div>
          
          <button class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-share-alt"></i>
          </button>
        </div>
      </div>
    `;
  }

  showLoginModal() {
    const modal = document.getElementById('modals');
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg max-w-md w-full p-6">
          <h2 class="text-2xl font-bold mb-4">ログイン / 新規登録</h2>
          
          <form onsubmit="app.handleLogin(event)">
            <div class="mb-4">
              <label class="block text-sm font-medium mb-2">ユーザー名</label>
              <input type="text" name="username" required class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="例: taro_angler">
            </div>
            
            <div class="mb-4">
              <label class="block text-sm font-medium mb-2">表示名</label>
              <input type="text" name="display_name" required class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="例: 釣り太郎">
            </div>
            
            <div class="mb-6">
              <label class="block text-sm font-medium mb-2">自己紹介（任意）</label>
              <textarea name="bio" rows="3" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="釣りが好きです！"></textarea>
            </div>
            
            <div class="flex space-x-3">
              <button type="submit" class="flex-1 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition">
                ログイン / 登録
              </button>
              <button type="button" onclick="app.closeModal()" class="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition">
                キャンセル
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  showNewPostModal() {
    if (!this.currentUser) {
      this.showLoginModal();
      return;
    }

    const modal = document.getElementById('modals');
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div class="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
          <h2 class="text-2xl font-bold mb-4">釣果を投稿</h2>
          
          <form onsubmit="app.handleNewPost(event)">
            <!-- Content -->
            <div class="mb-4">
              <label class="block text-sm font-medium mb-2">コメント</label>
              <textarea name="content" rows="3" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="今日の釣果はどうでしたか？"></textarea>
            </div>

            <!-- Location -->
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium mb-2">釣り場所</label>
                <input type="text" name="location_name" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="例: 琵琶湖">
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">釣った時間</label>
                <input type="datetime-local" name="caught_at" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
            </div>

            <!-- Weather & Tide -->
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium mb-2">天気</label>
                <select name="weather" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">選択してください</option>
                  <option value="晴れ">☀️ 晴れ</option>
                  <option value="曇り">☁️ 曇り</option>
                  <option value="雨">🌧️ 雨</option>
                  <option value="雪">❄️ 雪</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">潮（海釣りの場合）</label>
                <select name="tide" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">選択してください</option>
                  <option value="満潮">満潮</option>
                  <option value="干潮">干潮</option>
                  <option value="上げ潮">上げ潮</option>
                  <option value="下げ潮">下げ潮</option>
                </select>
              </div>
            </div>

            <!-- Fish Catches -->
            <div class="mb-4">
              <label class="block text-sm font-medium mb-2">釣果</label>
              <div id="catches-container" class="space-y-3">
                <div class="catch-entry bg-gray-50 p-3 rounded-lg">
                  <div class="grid grid-cols-2 gap-3">
                    <input type="text" name="species_name[]" placeholder="魚種名" class="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <div class="flex space-x-2">
                      <input type="number" name="size_cm[]" step="0.1" placeholder="サイズ(cm)" class="w-1/2 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <input type="number" name="weight_kg[]" step="0.01" placeholder="重さ(kg)" class="w-1/2 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-3 mt-3">
                    <input type="text" name="tackle[]" placeholder="タックル" class="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <input type="text" name="bait[]" placeholder="餌・ルアー" class="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  </div>
                </div>
              </div>
              <button type="button" onclick="app.addCatchEntry()" class="mt-3 text-blue-500 hover:text-blue-600 font-medium">
                <i class="fas fa-plus mr-1"></i>釣果を追加
              </button>
            </div>

            <!-- Media Upload -->
            <div class="mb-6">
              <label class="block text-sm font-medium mb-2">写真・動画</label>
              <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <i class="fas fa-camera text-4xl text-gray-400 mb-2"></i>
                <p class="text-gray-500 text-sm">クリックして写真を選択</p>
                <input type="file" name="media" multiple accept="image/*,video/*" class="hidden">
              </div>
            </div>

            <!-- Actions -->
            <div class="flex space-x-3">
              <button type="submit" class="flex-1 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition">
                投稿する
              </button>
              <button type="button" onclick="app.closeModal()" class="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition">
                キャンセル
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  addCatchEntry() {
    const container = document.getElementById('catches-container');
    const newEntry = document.createElement('div');
    newEntry.className = 'catch-entry bg-gray-50 p-3 rounded-lg';
    newEntry.innerHTML = `
      <div class="grid grid-cols-2 gap-3">
        <input type="text" name="species_name[]" placeholder="魚種名" class="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
        <div class="flex space-x-2">
          <input type="number" name="size_cm[]" step="0.1" placeholder="サイズ(cm)" class="w-1/2 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <input type="number" name="weight_kg[]" step="0.01" placeholder="重さ(kg)" class="w-1/2 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3 mt-3">
        <input type="text" name="tackle[]" placeholder="タックル" class="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
        <input type="text" name="bait[]" placeholder="餌・ルアー" class="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
      </div>
    `;
    container.appendChild(newEntry);
  }

  async handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    try {
      // Try to create user (will fail if exists)
      const response = await axios.post('/api/users', {
        username: formData.get('username'),
        display_name: formData.get('display_name'),
        bio: formData.get('bio'),
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.get('username')}`
      });
      
      this.currentUser = response.data;
      localStorage.setItem('fishsns_user', JSON.stringify(this.currentUser));
      this.closeModal();
      this.render();
    } catch (error) {
      // If user exists, fetch user data
      try {
        const response = await axios.get(`/api/users/${formData.get('username')}`);
        this.currentUser = response.data;
        localStorage.setItem('fishsns_user', JSON.stringify(this.currentUser));
        this.closeModal();
        this.render();
      } catch (error) {
        alert('ログインに失敗しました');
      }
    }
  }

  async handleNewPost(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    // Collect catches
    const catches = [];
    const speciesNames = formData.getAll('species_name[]');
    const sizes = formData.getAll('size_cm[]');
    const weights = formData.getAll('weight_kg[]');
    const tackles = formData.getAll('tackle[]');
    const baits = formData.getAll('bait[]');
    
    for (let i = 0; i < speciesNames.length; i++) {
      if (speciesNames[i]) {
        catches.push({
          species_name: speciesNames[i],
          size_cm: sizes[i] || null,
          weight_kg: weights[i] || null,
          tackle: tackles[i] || null,
          bait: baits[i] || null
        });
      }
    }
    
    // Create post data
    const postData = {
      user_id: this.currentUser.id,
      content: formData.get('content'),
      location_name: formData.get('location_name'),
      caught_at: formData.get('caught_at'),
      weather: formData.get('weather'),
      tide: formData.get('tide'),
      catches: catches,
      media: [] // TODO: Implement media upload
    };
    
    try {
      await axios.post('/api/posts', postData);
      this.closeModal();
      await this.loadPosts();
    } catch (error) {
      alert('投稿に失敗しました');
      console.error(error);
    }
  }

  async toggleLike(postId) {
    if (!this.currentUser) {
      this.showLoginModal();
      return;
    }
    
    const post = this.posts.find(p => p.id === postId);
    const isLiked = post.likes?.includes(this.currentUser.id);
    
    try {
      if (isLiked) {
        await axios.delete(`/api/posts/${postId}/like`, {
          data: { user_id: this.currentUser.id }
        });
      } else {
        await axios.post(`/api/posts/${postId}/like`, {
          user_id: this.currentUser.id
        });
      }
      
      await this.loadPosts(false);
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  }

  async showComments(postId) {
    // TODO: Implement comments modal
    alert('コメント機能は準備中です');
  }

  showRankings() {
    // TODO: Implement rankings view
    alert('ランキング機能は準備中です');
  }

  showImageModal(imageUrl) {
    const modal = document.getElementById('modals');
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onclick="app.closeModal()">
        <img src="${imageUrl}" class="max-w-full max-h-full object-contain">
      </div>
    `;
  }

  closeModal() {
    document.getElementById('modals').innerHTML = '';
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('fishsns_user');
    this.render();
  }

  showLoadingSpinner() {
    document.getElementById('loading-spinner').classList.remove('hidden');
  }

  hideLoadingSpinner() {
    document.getElementById('loading-spinner').classList.add('hidden');
  }

  showError(message) {
    // TODO: Implement error toast
    console.error(message);
  }

  setupEventListeners() {
    // Infinite scroll
    window.addEventListener('scroll', () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
        if (!this.isLoading && this.posts.length >= 20) {
          this.currentPage++;
          this.loadPosts();
        }
      }
    });
  }
}

// Initialize app
const app = new FishSNS();
window.app = app;