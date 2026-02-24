import api from './index';

export const discussionApi = {
    // Posts
    listPosts: (params = {}) => api.get('/discussions/posts', { params }),
    createPost: (data) => api.post('/discussions/posts', data),
    getPost: (id) => api.get(`/discussions/posts/${id}`),
    updatePost: (id, data) => api.put(`/discussions/posts/${id}`, data),
    deletePost: (id) => api.delete(`/discussions/posts/${id}`),
    votePost: (id, vote) => api.post(`/discussions/posts/${id}/vote`, { vote }),

    // Comments
    addComment: (postId, content) => api.post(`/discussions/posts/${postId}/comments`, { content }),
    replyComment: (commentId, content) => api.post(`/discussions/comments/${commentId}/reply`, { content }),
    updateComment: (commentId, content) => api.put(`/discussions/comments/${commentId}`, { content }),
    deleteComment: (commentId) => api.delete(`/discussions/comments/${commentId}`),
    voteComment: (commentId, vote) => api.post(`/discussions/comments/${commentId}/vote`, { vote }),
    acceptComment: (commentId) => api.post(`/discussions/comments/${commentId}/accept`),

    // Meta
    getCategories: () => api.get('/discussions/categories'),
};
