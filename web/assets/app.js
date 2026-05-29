const { createApp } = Vue;

const STORAGE_KEY = 'luqin-space-items-v1';

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
      useApi: false,
      statusText: '填写内容后可添加到右侧展示区'
    };
  },
  computed: {
    currentTab() {
      return this.tabs.find((tab) => tab.key === this.activeTab) || this.tabs[0];
    }
  },
  methods: {
    enterSpace() {
      this.page = 'space';
      this.detectModeAndLoad();
    },
    async detectModeAndLoad() {
      this.statusText = '正在初始化...';
      this.useApi = await this.tryApiHealth();
      await this.loadItems();
      if (!this.useApi) {
        this.statusText = '当前为静态演示模式：数据保存在当前浏览器';
      }
    },
    async tryApiHealth() {
      try {
        const response = await fetch(`./api/items?category=${encodeURIComponent(this.activeTab)}`, { method: 'GET' });
        return response.ok;
      } catch (error) {
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
      this.statusText = `已选择图片：${file.name}`;
      this.form.imageDataUrl = await this.fileToDataUrl(file);
    },
    fileToDataUrl(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result || '');
        reader.onerror = () => reject(new Error('图片读取失败'));
        reader.readAsDataURL(file);
      });
    },
    resetForm() {
      this.form = {
        id: null,
        title: '',
        description: '',
        imageFile: null,
        imageDataUrl: ''
      };
      this.statusText = this.useApi
        ? '填写内容后可添加到右侧展示区'
        : '静态演示模式：数据保存在当前浏览器';
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
      if (this.useApi) {
        await this.loadItemsFromApi();
      } else {
        this.loadItemsFromLocal();
      }
    },
    async loadItemsFromApi() {
      try {
        const response = await fetch(`./api/items?category=${encodeURIComponent(this.activeTab)}`);
        if (!response.ok) {
          throw new Error(await response.text());
        }
        this.items = await response.json();
        this.statusText = '内容已加载';
      } catch (error) {
        this.useApi = false;
        this.loadItemsFromLocal();
        this.statusText = '接口不可用，已切换到静态演示模式';
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
      } catch (error) {
        return [];
      }
    },
    writeLocalItems(items) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
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
      if (this.useApi) {
        await this.saveItemByApi();
      } else {
        await this.saveItemByLocal();
      }
    },
    async saveItemByApi() {
      const data = new FormData();
      data.append('category', this.activeTab);
      data.append('title', this.form.title);
      data.append('description', this.form.description);
      if (this.form.imageFile) {
        data.append('image', this.form.imageFile);
      }

      const url = this.form.id ? `./api/items?id=${this.form.id}` : './api/items';
      const method = this.form.id ? 'PUT' : 'POST';
      this.statusText = this.form.id ? '正在保存修改...' : '正在添加...';
      try {
        const response = await fetch(url, { method, body: data });
        if (!response.ok) {
          throw new Error(await response.text());
        }
        await this.loadItems();
        this.resetForm();
      } catch (error) {
        this.useApi = false;
        await this.saveItemByLocal();
        this.statusText = '接口不可用，已转为本地保存';
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
        const item = {
          id: Date.now(),
          category: this.activeTab,
          title: this.form.title,
          description: this.form.description,
          imagePath: this.form.imageDataUrl || '',
          createdAt: now,
          updatedAt: now
        };
        allItems.push(item);
      }
      this.writeLocalItems(allItems);
      this.loadItemsFromLocal();
      this.resetForm();
    },
    async deleteItem(id) {
      if (!confirm('确定删除这条内容吗？')) {
        return;
      }
      if (this.useApi) {
        await this.deleteItemByApi(id);
      } else {
        this.deleteItemByLocal(id);
      }
    },
    async deleteItemByApi(id) {
      this.statusText = '正在删除...';
      try {
        const response = await fetch(`./api/items?id=${id}`, { method: 'DELETE' });
        if (!response.ok) {
          throw new Error(await response.text());
        }
        await this.loadItems();
      } catch (error) {
        this.useApi = false;
        this.deleteItemByLocal(id);
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
