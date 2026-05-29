const { createApp } = Vue;

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
        imageFile: null
      },
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
      this.loadItems();
    },
    async switchTab(key) {
      this.activeTab = key;
      this.resetForm();
      await this.loadItems();
    },
    pickImage(event) {
      const [file] = event.target.files;
      this.form.imageFile = file || null;
      this.statusText = file ? `已选择图片：${file.name}` : '填写内容后可添加到右侧展示区';
    },
    resetForm() {
      this.form = {
        id: null,
        title: '',
        description: '',
        imageFile: null
      };
      this.statusText = '填写内容后可添加到右侧展示区';
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },
    editItem(item) {
      this.form = {
        id: item.id,
        title: item.title,
        description: item.description,
        imageFile: null
      };
      this.statusText = '正在修改，可重新选择图片覆盖原图片';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    async loadItems() {
      this.statusText = '正在读取内容...';
      try {
        const response = await fetch(`/api/items?category=${encodeURIComponent(this.activeTab)}`);
        if (!response.ok) {
          throw new Error(await response.text());
        }
        this.items = await response.json();
        this.statusText = '内容已加载';
      } catch (error) {
        this.statusText = '读取失败，请检查 Java 服务和 MySQL 连接';
        console.error(error);
      }
    },
    async saveItem() {
      if (!this.form.title) {
        this.statusText = '请先填写标题';
        return;
      }
      const data = new FormData();
      data.append('category', this.activeTab);
      data.append('title', this.form.title);
      data.append('description', this.form.description);
      if (this.form.imageFile) {
        data.append('image', this.form.imageFile);
      }

      const url = this.form.id ? `/api/items?id=${this.form.id}` : '/api/items';
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
        this.statusText = '保存失败，请检查输入和数据库连接';
        console.error(error);
      }
    },
    async deleteItem(id) {
      if (!confirm('确定删除这条内容吗？')) {
        return;
      }
      this.statusText = '正在删除...';
      try {
        const response = await fetch(`/api/items?id=${id}`, { method: 'DELETE' });
        if (!response.ok) {
          throw new Error(await response.text());
        }
        await this.loadItems();
      } catch (error) {
        this.statusText = '删除失败，请稍后再试';
        console.error(error);
      }
    }
  }
}).mount('#app');
