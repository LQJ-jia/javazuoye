const { createApp } = Vue;

const STORAGE_KEY = 'luqin-space-items-v2';
const ADMIN_HASH = '6d8ccd8a4b742c4f08259229706a98f383d49393c084059da93b8ec42184517b';

function toDateTimeLocalValue(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const buffer = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function getSupabaseConfig() {
  const cfg = window.SUPABASE_CONFIG || {};
  const normalizedUrl = String(cfg.url || '')
    .replace(/\/rest\/v1\/?$/, '')
    .replace(/\/$/, '');

  return {
    enabled: !!(normalizedUrl && cfg.anonKey && cfg.bucket),
    url: normalizedUrl,
    anonKey: cfg.anonKey || '',
    bucket: cfg.bucket || 'space-images'
  };
}

createApp({
  data() {
    return {
      page: 'home',
      role: '',
      showAdminLogin: false,
      auth: {
        username: '',
        password: '',
        error: ''
      },
      activeTab: 'homework',
      tabs: [
        { key: 'homework', name: '平时作业', title: '平时作业展示', icon: '作' },
        { key: 'award', name: '获奖证明', title: '获奖证明展示', icon: '奖' }
      ],
      items: [],
      showEditor: false,
      previewItem: null,
      form: {
        id: null,
        title: '',
        description: '',
        itemTime: toDateTimeLocalValue(new Date()),
        imageFile: null,
        imageDataUrl: ''
      },
      useCloud: false,
      supabase: getSupabaseConfig(),
      statusText: '准备就绪',
      particles: [],
      particleAnimation: 0,
      particleResizeHandler: null
    };
  },
  computed: {
    isAdmin() {
      return this.role === 'admin';
    },
    currentTab() {
      return this.tabs.find((tab) => tab.key === this.activeTab) || this.tabs[0];
    },
    requestHeaders() {
      if (!this.supabase.enabled) return {};
      return {
        apikey: this.supabase.anonKey,
        Authorization: `Bearer ${this.supabase.anonKey}`
      };
    }
  },
  watch: {
    page() {
      this.$nextTick(() => {
        if (this.page === 'home' || this.page === 'login') {
          this.startParticles();
        } else {
          this.stopParticles();
        }
      });
    }
  },
  mounted() {
    this.$nextTick(() => this.startParticles());
  },
  beforeUnmount() {
    this.stopParticles();
  },
  methods: {
    blankForm() {
      return {
        id: null,
        title: '',
        description: '',
        itemTime: toDateTimeLocalValue(new Date()),
        imageFile: null,
        imageDataUrl: ''
      };
    },
    enterSpace() {
      this.page = 'login';
      this.showAdminLogin = false;
      this.auth = { username: '', password: '', error: '' };
    },
    async enterAsGuest() {
      this.role = 'guest';
      this.page = 'space';
      await this.detectModeAndLoad();
    },
    async adminLogin() {
      this.auth.error = '';
      const digest = await sha256Hex(`${this.auth.username}:${this.auth.password}`);
      if (digest !== ADMIN_HASH) {
        this.auth.error = '账号或密码错误';
        this.auth.password = '';
        return;
      }

      this.role = 'admin';
      this.page = 'space';
      this.auth = { username: '', password: '', error: '' };
      await this.detectModeAndLoad();
    },
    async detectModeAndLoad() {
      this.statusText = '正在初始化...';
      this.useCloud = this.supabase.enabled && await this.tryCloudHealth();
      await this.loadItems();
      this.statusText = this.useCloud ? '当前为云端模式：所有人都可见' : '当前为本地演示模式';
    },
    async tryCloudHealth() {
      try {
        const url = `${this.supabase.url}/rest/v1/space_items?select=id&limit=1`;
        const response = await fetch(url, { headers: this.requestHeaders });
        return response.ok;
      } catch {
        return false;
      }
    },
    async switchTab(key) {
      this.activeTab = key;
      this.closeEditor();
      await this.loadItems();
    },
    openCreateForm() {
      if (!this.isAdmin) {
        this.statusText = '访客仅可观看';
        return;
      }
      this.form = this.blankForm();
      this.showEditor = true;
      this.statusText = this.useCloud ? '当前为云端模式：所有人都可见' : '当前为本地演示模式';
      this.$nextTick(() => {
        if (this.$refs.fileInput) this.$refs.fileInput.value = '';
      });
    },
    closeEditor() {
      this.showEditor = false;
      this.form = this.blankForm();
      if (this.$refs.fileInput) this.$refs.fileInput.value = '';
    },
    editItem(item) {
      if (!this.isAdmin) {
        this.statusText = '访客仅可观看';
        return;
      }
      this.form = {
        id: item.id,
        title: item.title,
        description: item.description || '',
        itemTime: toDateTimeLocalValue(item.createdAt || item.updatedAt || new Date()),
        imageFile: null,
        imageDataUrl: item.imagePath || ''
      };
      this.showEditor = true;
      this.statusText = '正在修改内容';
      this.$nextTick(() => {
        if (this.$refs.fileInput) this.$refs.fileInput.value = '';
      });
    },
    async pickImage(event) {
      const [file] = event.target.files;
      this.form.imageFile = file || null;
      if (!file) {
        this.form.imageDataUrl = '';
        return;
      }

      this.statusText = `正在处理图片：${file.name}`;
      try {
        this.form.imageDataUrl = await this.fileToCompressedDataUrl(file);
        if (!this.form.title) {
          const dot = file.name.lastIndexOf('.');
          this.form.title = dot > 0 ? file.name.slice(0, dot) : file.name;
        }
        this.statusText = `已选择图片：${file.name}`;
      } catch {
        this.form.imageFile = null;
        this.form.imageDataUrl = '';
        this.statusText = '图片处理失败，请换一张图片再试';
      }
    },
    fileToDataUrl(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('图片读取失败'));
        reader.readAsDataURL(file);
      });
    },
    async fileToCompressedDataUrl(file) {
      const sourceDataUrl = await this.fileToDataUrl(file);
      const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('图片解码失败'));
        img.src = sourceDataUrl;
      });

      const maxSide = 1600;
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(image, 0, 0, width, height);
      return canvas.toDataURL('image/jpeg', 0.82);
    },
    dataUrlToBlob(dataUrl) {
      const parts = dataUrl.split(',');
      const mime = parts[0].match(/:(.*?);/)[1];
      const binary = atob(parts[1]);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      return new Blob([bytes], { type: mime });
    },
    async loadItems() {
      if (this.useCloud) {
        await this.loadItemsFromCloud();
      } else {
        this.loadItemsFromLocal();
      }
    },
    async loadItemsFromCloud() {
      try {
        const query = new URLSearchParams({
          select: 'id,category,title,description,image_path,created_at,updated_at',
          category: `eq.${this.activeTab}`,
          order: 'created_at.desc'
        });
        const url = `${this.supabase.url}/rest/v1/space_items?${query.toString()}`;
        const response = await fetch(url, { headers: this.requestHeaders });
        if (!response.ok) throw new Error(await response.text());
        const rows = await response.json();
        this.items = rows.map((row) => ({
          id: row.id,
          category: row.category,
          title: row.title,
          description: row.description || '',
          imagePath: row.image_path || '',
          createdAt: row.created_at || '',
          updatedAt: row.updated_at || ''
        }));
        this.statusText = '内容已加载（云端）';
      } catch {
        this.useCloud = false;
        this.loadItemsFromLocal();
        this.statusText = '云端连接失败，已切换到本地模式';
      }
    },
    loadItemsFromLocal() {
      const allItems = this.readLocalItems();
      this.items = allItems
        .filter((item) => item.category === this.activeTab)
        .sort((a, b) => String(b.createdAt || b.updatedAt).localeCompare(String(a.createdAt || a.updatedAt)));
      this.statusText = '内容已加载（本地浏览器）';
    },
    readLocalItems() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    },
    writeLocalItems(items) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        return true;
      } catch {
        return false;
      }
    },
    async saveItem() {
      if (!this.isAdmin) {
        this.statusText = '访客仅可观看';
        return;
      }
      if (!this.form.title && this.form.imageFile) {
        const dot = this.form.imageFile.name.lastIndexOf('.');
        this.form.title = dot > 0 ? this.form.imageFile.name.slice(0, dot) : this.form.imageFile.name;
      }
      if (!this.form.title) {
        this.statusText = '请先填写标题，或先选择图片';
        return;
      }

      if (this.useCloud) {
        await this.saveItemByCloud();
      } else {
        await this.saveItemByLocal();
      }
    },
    async uploadImageToCloud() {
      if (!this.form.imageDataUrl || !this.form.imageFile) return '';
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;
      const objectPath = `${this.activeTab}/${fileName}`;
      const uploadUrl = `${this.supabase.url}/storage/v1/object/${this.supabase.bucket}/${objectPath}`;
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          ...this.requestHeaders,
          'Content-Type': 'image/jpeg',
          'x-upsert': 'true'
        },
        body: this.dataUrlToBlob(this.form.imageDataUrl)
      });
      if (!response.ok) throw new Error(await response.text());
      return `${this.supabase.url}/storage/v1/object/public/${this.supabase.bucket}/${objectPath}`;
    },
    async saveItemByCloud() {
      this.statusText = this.form.id ? '正在保存修改...' : '正在添加...';
      try {
        const now = new Date().toISOString();
        const itemTime = this.toIsoFromDateTimeLocal(this.form.itemTime) || now;
        const existing = this.items.find((item) => item.id === this.form.id);
        let imagePath = this.form.id ? (existing?.imagePath || '') : '';
        if (this.form.imageFile) {
          imagePath = await this.uploadImageToCloud();
        }

        const payload = {
          category: this.activeTab,
          title: this.form.title,
          description: this.form.description,
          image_path: imagePath,
          created_at: itemTime,
          updated_at: now
        };

        const isEdit = !!this.form.id;
        const url = isEdit
          ? `${this.supabase.url}/rest/v1/space_items?id=eq.${this.form.id}`
          : `${this.supabase.url}/rest/v1/space_items`;
        const response = await fetch(url, {
          method: isEdit ? 'PATCH' : 'POST',
          headers: {
            ...this.requestHeaders,
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
          },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(await response.text());

        await this.loadItemsFromCloud();
        this.closeEditor();
      } catch {
        this.statusText = '云端保存失败，请检查 Supabase 配置与策略';
      }
    },
    async saveItemByLocal() {
      const allItems = this.readLocalItems();
      const now = new Date().toISOString();
      const itemTime = this.toIsoFromDateTimeLocal(this.form.itemTime) || now;

      if (this.form.id) {
        const target = allItems.find((x) => x.id === this.form.id);
        if (target) {
          target.title = this.form.title;
          target.description = this.form.description;
          target.category = this.activeTab;
          target.createdAt = itemTime;
          target.updatedAt = now;
          if (this.form.imageDataUrl) target.imagePath = this.form.imageDataUrl;
        }
      } else {
        allItems.push({
          id: Date.now(),
          category: this.activeTab,
          title: this.form.title,
          description: this.form.description,
          imagePath: this.form.imageDataUrl || '',
          createdAt: itemTime,
          updatedAt: now
        });
      }

      if (!this.writeLocalItems(allItems)) {
        this.statusText = '保存失败：图片过大，请换更小的图片或删除旧内容后重试';
        return;
      }
      this.loadItemsFromLocal();
      this.closeEditor();
    },
    async deleteItem(id) {
      if (!this.isAdmin) {
        this.statusText = '访客仅可观看';
        return;
      }
      if (!confirm('确定删除这条内容吗？')) return;
      if (this.useCloud) {
        await this.deleteItemByCloud(id);
      } else {
        this.deleteItemByLocal(id);
      }
    },
    async deleteItemByCloud(id) {
      this.statusText = '正在删除...';
      try {
        const url = `${this.supabase.url}/rest/v1/space_items?id=eq.${id}`;
        const response = await fetch(url, {
          method: 'DELETE',
          headers: this.requestHeaders
        });
        if (!response.ok) throw new Error(await response.text());
        await this.loadItemsFromCloud();
      } catch {
        this.statusText = '云端删除失败，请稍后重试';
      }
    },
    deleteItemByLocal(id) {
      const allItems = this.readLocalItems().filter((item) => item.id !== id);
      this.writeLocalItems(allItems);
      this.loadItemsFromLocal();
    },
    openPreview(item) {
      if (!item.imagePath) return;
      this.previewItem = item;
    },
    closePreview() {
      this.previewItem = null;
    },
    toIsoFromDateTimeLocal(value) {
      if (!value) return '';
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? '' : date.toISOString();
    },
    formatDisplayTime(value) {
      if (!value) return '未填写时间';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      const pad = (num) => String(num).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    },
    startParticles() {
      this.stopParticles();
      const canvas = this.$refs.particleCanvas;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const createParticle = (width, height) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.42,
        vy: (Math.random() - 0.5) * 0.42,
        radius: 1.4 + Math.random() * 2.8,
        alpha: 0.25 + Math.random() * 0.45
      });

      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.floor(rect.width * dpr));
        canvas.height = Math.max(1, Math.floor(rect.height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const count = Math.max(42, Math.min(96, Math.round((rect.width * rect.height) / 18000)));
        this.particles = Array.from({ length: count }, () => createParticle(rect.width, rect.height));
      };

      const animate = () => {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < this.particles.length; i += 1) {
          const particle = this.particles[i];
          particle.x += particle.vx;
          particle.y += particle.vy;

          if (particle.x < 0 || particle.x > width) particle.vx *= -1;
          if (particle.y < 0 || particle.y > height) particle.vy *= -1;

          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(37, 111, 230, ${particle.alpha})`;
          ctx.fill();

          for (let j = i + 1; j < this.particles.length; j += 1) {
            const next = this.particles[j];
            const dx = particle.x - next.x;
            const dy = particle.y - next.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 128) {
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(next.x, next.y);
              ctx.strokeStyle = `rgba(29, 95, 209, ${0.14 * (1 - distance / 128)})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }

        this.particleAnimation = requestAnimationFrame(animate);
      };

      resize();
      this.particleResizeHandler = resize;
      window.addEventListener('resize', resize, { passive: true });
      this.particleAnimation = requestAnimationFrame(animate);
    },
    stopParticles() {
      if (this.particleAnimation) {
        cancelAnimationFrame(this.particleAnimation);
        this.particleAnimation = 0;
      }
      if (this.particleResizeHandler) {
        window.removeEventListener('resize', this.particleResizeHandler);
        this.particleResizeHandler = null;
      }
      this.particles = [];
    }
  }
}).mount('#app');
