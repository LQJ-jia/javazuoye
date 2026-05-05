<template>
  <div class="note-manager">
    <div class="sidebar">
      <h2 class="sidebar-title">分类管理</h2>
      <div 
        class="sidebar-item" 
        :class="{ active: currentCategory === 'homework' }"
        @click="switchCategory('homework')"
      >
        <span class="icon">📚</span>
        <span>平时作业</span>
      </div>
      <div 
        class="sidebar-item" 
        :class="{ active: currentCategory === 'awards' }"
        @click="switchCategory('awards')"
      >
        <span class="icon">🏆</span>
        <span>获奖情况</span>
      </div>
    </div>

    <div class="main-content">
      <div class="header">
        <h1>{{ currentCategoryName }}</h1>
        <button class="add-btn" @click="openAddModal">
          <span>+ 添加</span>
        </button>
      </div>

      <div class="notes-grid" v-if="currentNotes.length > 0">
        <div class="note-card" v-for="note in currentNotes" :key="note.id">
          <div class="note-header">
            <h3>{{ note.title }}</h3>
            <div class="note-actions">
              <button class="edit-btn" @click="openEditModal(note)">编辑</button>
              <button class="delete-btn" @click="deleteNote(note.id)">删除</button>
            </div>
          </div>
          <p class="note-content">{{ note.content }}</p>
          <div class="note-photos" v-if="note.photos && note.photos.length > 0">
            <div class="photo-item" v-for="(photo, idx) in note.photos" :key="idx">
              <img :src="photo" alt="照片" @click="viewPhoto(photo)" />
              <button class="remove-photo-btn" @click="removePhoto(note.id, idx)">×</button>
            </div>
          </div>
          <div class="note-date">{{ formatDate(note.createdAt) }}</div>
        </div>
      </div>

      <div class="empty-state" v-else>
        <div class="empty-icon">{{ currentCategory === 'homework' ? '�' : '🏆' }}</div>
        <p>还没有{{ currentCategoryName }}，点击上方按钮添加第一个吧！</p>
      </div>
    </div>

    <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ isEditing ? '编辑' : '添加' }}{{ currentCategoryName }}</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>标题</label>
            <input type="text" v-model="currentNote.title" placeholder="请输入标题" />
          </div>
          <div class="form-group">
            <label>内容</label>
            <textarea v-model="currentNote.content" placeholder="请输入内容" rows="5"></textarea>
          </div>
          <div class="form-group">
            <label>照片</label>
            <div class="photo-upload-area">
              <div class="photo-preview" v-if="currentNote.photos && currentNote.photos.length > 0">
                <div class="preview-item" v-for="(photo, idx) in currentNote.photos" :key="idx">
                  <img :src="photo" alt="预览" />
                  <button class="remove-preview-btn" @click="removePreviewPhoto(idx)">×</button>
                </div>
              </div>
              <label class="upload-btn">
                <input type="file" accept="image/*" multiple @change="handlePhotoUpload" />
                <span>📷 上传照片</span>
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeModal">取消</button>
          <button class="save-btn" @click="saveNote">保存</button>
        </div>
      </div>
    </div>

    <div class="photo-viewer" v-if="showPhotoViewer" @click="closePhotoViewer">
      <img :src="viewingPhoto" alt="查看大图" />
      <button class="close-viewer-btn" @click="closePhotoViewer">×</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const currentCategory = ref('homework')
const homeworkNotes = ref([])
const awardsNotes = ref([])
const showModal = ref(false)
const isEditing = ref(false)
const currentNote = ref({
  id: null,
  title: '',
  content: '',
  photos: [],
  createdAt: null
})
const showPhotoViewer = ref(false)
const viewingPhoto = ref('')

const currentCategoryName = computed(() => {
  return currentCategory.value === 'homework' ? '平时作业' : '获奖情况'
})

const currentNotes = computed(() => {
  return currentCategory.value === 'homework' ? homeworkNotes.value : awardsNotes.value
})

const loadNotes = () => {
  const savedHomework = localStorage.getItem('homeworkNotes')
  const savedAwards = localStorage.getItem('awardsNotes')
  if (savedHomework) {
    homeworkNotes.value = JSON.parse(savedHomework)
  }
  if (savedAwards) {
    awardsNotes.value = JSON.parse(savedAwards)
  }
}

const saveNotesToStorage = () => {
  localStorage.setItem('homeworkNotes', JSON.stringify(homeworkNotes.value))
  localStorage.setItem('awardsNotes', JSON.stringify(awardsNotes.value))
}

const switchCategory = (category) => {
  currentCategory.value = category
}

const openAddModal = () => {
  isEditing.value = false
  currentNote.value = {
    id: null,
    title: '',
    content: '',
    photos: [],
    createdAt: null
  }
  showModal.value = true
}

const openEditModal = (note) => {
  isEditing.value = true
  currentNote.value = { ...note, photos: [...note.photos] }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const handlePhotoUpload = (e) => {
  const files = Array.from(e.target.files)
  files.forEach(file => {
    const reader = new FileReader()
    reader.onload = (event) => {
      if (!currentNote.value.photos) {
        currentNote.value.photos = []
      }
      currentNote.value.photos.push(event.target.result)
    }
    reader.readAsDataURL(file)
  })
  e.target.value = ''
}

const removePreviewPhoto = (idx) => {
  currentNote.value.photos.splice(idx, 1)
}

const saveNote = () => {
  if (!currentNote.value.title.trim()) {
    alert('请输入标题')
    return
  }

  const notes = currentNotes.value

  if (isEditing.value) {
    const index = notes.findIndex(n => n.id === currentNote.value.id)
    if (index !== -1) {
      notes[index] = { ...currentNote.value }
    }
  } else {
    currentNote.value.id = Date.now()
    currentNote.value.createdAt = new Date().toISOString()
    notes.unshift({ ...currentNote.value })
  }

  if (currentCategory.value === 'homework') {
    homeworkNotes.value = [...notes]
  } else {
    awardsNotes.value = [...notes]
  }

  saveNotesToStorage()
  closeModal()
}

const deleteNote = (id) => {
  if (confirm('确定要删除这条记录吗？')) {
    if (currentCategory.value === 'homework') {
      homeworkNotes.value = homeworkNotes.value.filter(n => n.id !== id)
    } else {
      awardsNotes.value = awardsNotes.value.filter(n => n.id !== id)
    }
    saveNotesToStorage()
  }
}

const removePhoto = (noteId, photoIdx) => {
  if (confirm('确定要删除这张照片吗？')) {
    const notes = currentCategory.value === 'homework' ? homeworkNotes.value : awardsNotes.value
    const note = notes.find(n => n.id === noteId)
    if (note) {
      note.photos.splice(photoIdx, 1)
      saveNotesToStorage()
    }
  }
}

const viewPhoto = (photo) => {
  viewingPhoto.value = photo
  showPhotoViewer.value = true
}

const closePhotoViewer = () => {
  showPhotoViewer.value = false
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadNotes()
})
</script>

<style scoped>
.note-manager {
  display: flex;
  min-height: calc(100vh - 100px);
}

.sidebar {
  width: 240px;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  border-right: 1px solid #e2e8f0;
  padding: 24px 0;
  flex-shrink: 0;
}

.sidebar-title {
  font-size: 18px;
  color: #1e293b;
  margin: 0 0 20px 24px;
  font-weight: 600;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 16px;
  color: #475569;
  border-left: 3px solid transparent;
}

.sidebar-item:hover {
  background: #e2e8f0;
  color: #2563eb;
}

.sidebar-item.active {
  background: #dbeafe;
  color: #2563eb;
  border-left-color: #2563eb;
  font-weight: 500;
}

.sidebar-item .icon {
  font-size: 20px;
}

.main-content {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.header h1 {
  margin: 0;
  color: #1e293b;
  font-size: 28px;
  border: none;
  padding: 0;
}

.add-btn {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 24px;
}

.note-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.note-card:hover {
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.12);
  transform: translateY(-4px);
  border-color: #93c5fd;
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.note-header h3 {
  margin: 0;
  color: #1e293b;
  font-size: 20px;
  flex: 1;
}

.note-actions {
  display: flex;
  gap: 8px;
}

.edit-btn {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.edit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.delete-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.delete-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.note-content {
  color: #475569;
  line-height: 1.8;
  margin-bottom: 20px;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 15px;
}

.note-photos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.photo-item {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.photo-item:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-photo-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.photo-item:hover .remove-photo-btn {
  opacity: 1;
}

.note-date {
  color: #94a3b8;
  font-size: 14px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.empty-state {
  text-align: center;
  padding: 100px 20px;
  color: #64748b;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 24px;
}

.empty-state p {
  font-size: 16px;
  margin: 0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  margin: 0;
  color: #1e293b;
  font-size: 22px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 32px;
  cursor: pointer;
  color: #64748b;
  padding: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s;
}

.close-btn:hover {
  color: #1e293b;
}

.modal-body {
  padding: 28px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 10px;
  color: #475569;
  font-weight: 600;
  font-size: 15px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  box-sizing: border-box;
  transition: all 0.3s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.photo-upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  background: #fafafa;
}

.photo-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.preview-item {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: 10px;
  overflow: hidden;
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-preview-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-btn {
  display: inline-block;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  padding: 14px 32px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
}

.upload-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
}

.upload-btn input {
  display: none;
}

.modal-footer {
  padding: 20px 28px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 14px;
}

.cancel-btn {
  background: #f1f5f9;
  color: #475569;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.3s;
}

.cancel-btn:hover {
  background: #e2e8f0;
}

.save-btn {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.3s;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
}

.photo-viewer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.photo-viewer img {
  max-width: 95%;
  max-height: 95%;
  object-fit: contain;
  border-radius: 8px;
}

.close-viewer-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 28px;
  line-height: 1;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
}

.close-viewer-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}
</style>
