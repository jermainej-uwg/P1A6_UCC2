(function () {
    const STORAGE_KEY = 'yag_discussion_posts_v1';
    const MAX_POSTS = 500;
    const MAX_NAME = 60;
    const MAX_TEXT = 3000;
    const POST_COOLDOWN_MS = 1200;

    function safeParse(raw) {
        try { return JSON.parse(raw); } catch (e) { return null; }
    }

    const form = document.getElementById('post-form');
    const postsList = document.getElementById('posts-list');
    const nameInput = document.getElementById('display-name');
    const textInput = document.getElementById('post-text');
    const clearBtn = document.getElementById('clear-btn');
    const yearEl = document.getElementById('year');

    if (yearEl) yearEl.textContent = new Date().getFullYear();


    if (!form || !postsList || !textInput) {
        return;
    }

    postsList.setAttribute('aria-live', 'polite');

    let lastPostTime = 0;

    function loadPosts() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = safeParse(raw);
        return Array.isArray(parsed) ? parsed : [];
    }

    function savePosts(posts) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
            return true;
        } catch (e) {
            console.warn('Could not save posts', e);
            alert('Unable to save posts locally. Storage may be full or disabled.');
            return false;
        }
    }

    function createPostElement(post) {
        const wrapper = document.createElement('article');
        wrapper.className = 'card';
        wrapper.style.marginBottom = '12px';
        wrapper.setAttribute('tabindex', '0');

        const meta = document.createElement('div');
        meta.style.display = 'flex';
        meta.style.justifyContent = 'space-between';
        meta.style.alignItems = 'baseline';
        meta.style.marginBottom = '8px';

        const author = document.createElement('strong');
        author.textContent = post.name || 'Anonymous';
        author.style.fontSize = '15px';

        const time = document.createElement('span');
        time.className = 'muted';
        time.style.fontSize = '13px';
        time.textContent = new Date(post.time).toLocaleString();

        meta.appendChild(author);
        meta.appendChild(time);

        const body = document.createElement('div');
        body.style.whiteSpace = 'pre-wrap';
        body.textContent = post.text;

        wrapper.appendChild(meta);
        wrapper.appendChild(body);

        return wrapper;
    }

    function renderAll() {
        postsList.innerHTML = '';
        const posts = loadPosts();
        if (posts.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'muted';
            empty.textContent = 'No posts yet. Be the first to share a tip or question.';
            postsList.appendChild(empty);
            return;
        }

        posts.forEach(p => postsList.appendChild(createPostElement(p)));
    }

    function addPost(name, text) {
        const now = Date.now();
        if (now - lastPostTime < POST_COOLDOWN_MS) {
            alert('Please wait a moment before posting again.');
            return;
        }
        lastPostTime = now;

        const safeName = (name || '').trim().slice(0, MAX_NAME);
        const safeText = (text || '').trim().slice(0, MAX_TEXT);
        if (!safeText) return;

        const posts = loadPosts();
        const newPost = {
            name: safeName,
            text: safeText,
            time: new Date().toISOString()
        };

        posts.unshift(newPost);

        if (posts.length > MAX_POSTS) posts.length = MAX_POSTS;

        if (!savePosts(posts)) return;

        renderAll();

        const firstPost = postsList.querySelector('article');
        if (firstPost) firstPost.focus();
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const text = textInput.value.trim();
        if (!text) {
            textInput.focus();
            return;
        }
        addPost(nameInput ? nameInput.value.trim() : '', text);
        textInput.value = '';
        textInput.focus();
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            if (!confirm('Clear all local discussion posts? This cannot be undone.')) return;
            localStorage.removeItem(STORAGE_KEY);
            renderAll();
        });
    }

    textInput.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            form.dispatchEvent(new Event('submit', { cancelable: true }));
        }
    });

    renderAll();
})();
