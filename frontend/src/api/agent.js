import api from './index';

export const agentApi = {
    /** Send a full conversation history; returns { reply, model } */
    chat: (messages) =>
        api.post('/agent/chat', { messages }),

    /** Check if the agent is configured */
    status: () =>
        api.get('/agent/status'),
};
