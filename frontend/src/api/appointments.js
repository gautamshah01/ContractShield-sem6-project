/**
 * Lawyer Collaboration API helpers
 */
import api from './index';

export const appointmentsApi = {
    getLawyers: () => api.get('/appointments/lawyers'),
    book: (lawyer_id, msg) => api.post('/appointments/book', { lawyer_id, message: msg }),
    myAppointments: () => api.get('/appointments/my'),
    approve: (id) => api.put(`/appointments/${id}/approve`),
    reject: (id) => api.put(`/appointments/${id}/reject`),
    getMessages: (id) => api.get(`/appointments/${id}/messages`),
    sendMessage: (id, message) => api.post(`/appointments/${id}/messages`, { message }),
    lawyerDashboard: () => api.get('/appointments/lawyer/dashboard'),
    updateProfile: (data) => api.put('/appointments/lawyer/profile', data),
};
