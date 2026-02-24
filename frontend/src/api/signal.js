import api from './index';

export const signalApi = {
    postOffer: (apptId, sdp) => api.post(`/signal/${apptId}/offer`, { sdp }),
    getOffer: (apptId) => api.get(`/signal/${apptId}/offer`),
    postAnswer: (apptId, sdp) => api.post(`/signal/${apptId}/answer`, { sdp }),
    getAnswer: (apptId) => api.get(`/signal/${apptId}/answer`),
    postIce: (apptId, role, candidate) => api.post(`/signal/${apptId}/ice`, { role, candidate }),
    getIce: (apptId, role) => api.get(`/signal/${apptId}/ice?role=${role}`),
    endSession: (apptId) => api.delete(`/signal/${apptId}`),
};
