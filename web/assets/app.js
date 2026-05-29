const { createApp } = Vue;

const STORAGE_KEY = 'luqin-space-items-v2';

function getSupabaseConfig() {
  const cfg = window.SUPABASE_CONFIG || {};
  const hasRequired = !!(cfg.url && cfg.anonKey && cfg.bucket);
  const normalizedUrl = String(cfg.url || '')
    .replace(/\/rest\/v1\/?$/, '')
    .replace(/\/$/, '');
  return {
    enabled: hasRequired,
    url: normalizedUrl,
    anonKey: cfg.anonKey || '',
    bucket: cfg.bucket || 'space-images'
  };
}

createApp({
  data() {
    return {
      page: 'home',
      activeTab: 'homework',
      tabs: [
        { key: 'homework', name: '平时作业', title: '平时作业展示', icon: '作' },
        { key: 'award', name: '获奖证明', title: '获奖证明展示', icon: '奖' }
      ],
      items: [],
      form: {
        id: null,
        title: '',
        description: '',
        imageFile: null,
        imageDataUrl: ''
      },
      previewItem: null,
      useCloud: false,
      supabase: getSupabaseConfig(),
      statusText: '填写内容后可添加到右侧展示区'
    };
  },
  computed: {
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
  methods: {
    enterSpace() {
      this.page = 'space';
      this.detectModeAndLoad();
    },
    async detectModeAndLoad() {
      this.statusText = '正在初始化...';
      if (this.supabase.enabled) {
        this.useCloud = await this.tryCloudHealth();
      }
      await this.loadItems();
      if (this.useCloud) {
        this.statusText = '当前为云端模式：所有人都可见';
      } else {
        this.statusText = '当前为本地演示模式：数据保存在当前浏览器';
      }
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
      this.resetForm();
      await this.loadItems();
    },
    async pickImage(event) {
      const [file] = event.target.files;
      this.form.imageFile = file || null;
      this.form.imageDataUrl = '';

      if (!file) {
        this.statusText = '填写内容后可添加到右侧展示区';
        return;
      }

      this.statusText = `正在处理图片：${file.name}`;
      try {
        this.form.imageDataUrl = await this.fileToCompressedDataUrl(file);
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
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0, width, height);
      return canvas.toDataURL('image/jpeg', 0.82);
    },
    dataUrlToBlob(dataUrl) {
      const parts = dataUrl.split(',');
      const mime = parts[0].match(/:(.*?);/)[1];
      const binary = atob(parts[1]);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i += 1) bytes[i] = binary.charCodeAt(i);
      return new Blob([bytes], { type: mime });
    },
    resetForm() {
      this.form = {
        id: null,
        title: '',
        description: '',
        imageFile: null,
        imageDataUrl: ''
      };
      this.statusText = this.useCloud
        ? '当前为云端模式：所有人都可见'
        : '当前为本地演示模式：数据保存在当前浏览器';
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },
    editItem(item) {
      this.form = {
        id: item.id,
        title: item.title,
        description: item.description,
        imageFile: null,
        imageDataUrl: item.imagePath || ''
      };
      this.statusText = '正在修改，可重新选择图片覆盖原图片';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    async loadItems() {
      this.statusText = '正在读取内容...';
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
          order: 'updated_at.desc'
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
        .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
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
      if (!this.form.imageDataUrl) return '';
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;
      const objectPath = `${this.activeTab}/${fileName}`;
      const blob = this.dataUrlToBlob(this.form.imageDataUrl);
      const uploadUrl = `${this.supabase.url}/storage/v1/object/${this.supabase.bucket}/${objectPath}`;
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          ...this.requestHeaders,
          'Content-Type': 'image/jpeg',
          'x-upsert': 'true'
        },
        body: blob
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return `${this.supabase.url}/storage/v1/object/public/${this.supabase.bucket}/${objectPath}`;
    },
    async saveItemByCloud() {
      this.statusText = this.form.id ? '正在保存修改...' : '正在添加...';
      try {
        const now = new Date().toISOString();
        let imagePath = this.form.id ? (this.items.find((x) => x.id === this.form.id)?.imagePath || '') : '';
        if (this.form.imageDataUrl && this.form.imageFile) {
          imagePath = await this.uploadImageToCloud();
        }

        if (this.form.id) {
          const url = `${this.supabase.url}/rest/v1/space_items?id=eq.${this.form.id}`;
          const payload = {
            category: this.activeTab,
            title: this.form.title,
            description: this.form.description,
            image_path: imagePath,
            updated_at: now
          };
          const response = await fetch(url, {
            method: 'PATCH',
            headers: {
              ...this.requestHeaders,
              'Content-Type': 'application/json',
              Prefer: 'return=representation'
            },
            body: JSON.stringify(payload)
          });
          if (!response.ok) throw new Error(await response.text());
        } else {
          const url = `${this.supabase.url}/rest/v1/space_items`;
          const payload = {
            category: this.activeTab,
            title: this.form.title,
            description: this.form.description,
            image_path: imagePath,
            created_at: now,
            updated_at: now
          };
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              ...this.requestHeaders,
              'Content-Type': 'application/json',
              Prefer: 'return=representation'
            },
            body: JSON.stringify(payload)
          });
          if (!response.ok) throw new Error(await response.text());
        }

        await this.loadItemsFromCloud();
        this.resetForm();
      } catch {
        this.statusText = '云端保存失败，请检查 Supabase 配置与策略';
      }
    },
    async saveItemByLocal() {
      const allItems = this.readLocalItems();
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

      if (this.form.id) {
        const target = allItems.find((x) => x.id === this.form.id);
        if (target) {
          target.title = this.form.title;
          target.description = this.form.description;
          target.category = this.activeTab;
          target.updatedAt = now;
          if (this.form.imageDataUrl) {
            target.imagePath = this.form.imageDataUrl;
          }
        }
      } else {
        allItems.push({
          id: Date.now(),
          category: this.activeTab,
          title: this.form.title,
          description: this.form.description,
          imagePath: this.form.imageDataUrl || '',
          createdAt: now,
          updatedAt: now
        });
      }

      const ok = this.writeLocalItems(allItems);
      if (!ok) {
        this.statusText = '保存失败：图片过大，请换更小的图片或删除旧内容后重试';
        return;
      }
      this.loadItemsFromLocal();
      this.resetForm();
    },
    async deleteItem(id) {
      if (!confirm('确定删除这条内容吗？')) {
        return;
      }
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
    }
  }
}).mount('#app');
