import api from './axiosInstance'

/** Every call resolves to the API envelope: { success, message, data } */
const call = (p) => p.then((r) => r.data)

export const PublicAPI = {
  site: () => call(api.get('/site')),
  contact: (body) => call(api.post('/contact', body)),
}

export const AuthAPI = {
  login: (username, password) => call(api.post('/auth/login', { username, password })),
  me: () => call(api.get('/auth/me')),
  logout: () => call(api.post('/auth/logout')),
  profile: (body) => call(api.put('/auth/profile', body)),
  password: (body) => call(api.put('/auth/password', body)),
}

export const AdminAPI = {
  dashboard: () => call(api.get('/admin/dashboard')),

  sections: {
    all: () => call(api.get('/admin/sections')),
    get: (key) => call(api.get(`/admin/sections/${key}`)),
    save: (key, body) => call(api.put(`/admin/sections/${key}`, body)),
  },

  collection: {
    list: (r) => call(api.get(`/admin/collections/${r}`)),
    create: (r, body) => call(api.post(`/admin/collections/${r}`, body)),
    update: (r, id, body) => call(api.put(`/admin/collections/${r}/${id}`, body)),
    duplicate: (r, id) => call(api.post(`/admin/collections/${r}/${id}/duplicate`)),
    remove: (r, id) => call(api.delete(`/admin/collections/${r}/${id}`)),
    reorder: (r, ids) => call(api.put(`/admin/collections/${r}/reorder`, { ids })),
  },

  mail: {
    get: () => call(api.get('/admin/mail')),
    save: (body) => call(api.put('/admin/mail', body)),
    test: (to) => call(api.post('/admin/mail/test', to ? { to } : {})),
  },

  media: {
    list: (params) => call(api.get('/admin/media', { params })),
    get: (id) => call(api.get(`/admin/media/${id}`)),
    upload: (files, folder, onProgress) => {
      const fd = new FormData()
      Array.from(files).forEach((f) => fd.append('files[]', f))
      fd.append('folder', folder || 'general')
      return call(api.post('/admin/media', fd, {
        onUploadProgress: (e) => onProgress?.(e.total ? Math.round((e.loaded / e.total) * 100) : 0),
      }))
    },
    update: (id, body) => call(api.put(`/admin/media/${id}`, body)),
    remove: (id, force = false) => call(api.delete(`/admin/media/${id}`, { params: force ? { force: 1 } : {} })),
  },

  enquiries: {
    list: (params) => call(api.get('/admin/enquiries', { params })),
    update: (id, body) => call(api.put(`/admin/enquiries/${id}`, body)),
    remove: (id) => call(api.delete(`/admin/enquiries/${id}`)),
    exportCsv: () => api.get('/admin/enquiries/export', { responseType: 'blob' }),
  },
}
