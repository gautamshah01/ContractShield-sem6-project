import api from './index';

export const adminApi = {
    stats: () => api.get('/admin/stats'),
    lawyers: () => api.get('/admin/lawyers'),
    approveLawyer: (id) => api.put(`/admin/lawyers/${id}/approve`),
    rejectLawyer: (id) => api.put(`/admin/lawyers/${id}/reject`),
    clients: () => api.get('/admin/clients'),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
};
