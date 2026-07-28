import client from './client';

export const listSurveys = (params) => client.get('/surveys', { params }).then((r) => r.data.surveys);
export const getSurvey = (id) => client.get(`/surveys/${id}`).then((r) => r.data);
export const createSurvey = (data) => client.post('/surveys', data).then((r) => r.data.survey);
export const updateSurvey = (id, data) => client.put(`/surveys/${id}`, data).then((r) => r.data.survey);
export const deleteSurvey = (id) => client.delete(`/surveys/${id}`);
export const publishSurvey = (id) => client.post(`/surveys/${id}/publish`).then((r) => r.data.survey);
export const closeSurvey = (id) => client.post(`/surveys/${id}/close`).then((r) => r.data.survey);

export const createQuestion = (surveyId, data) =>
  client.post(`/surveys/${surveyId}/questions`, data).then((r) => r.data.question);
export const updateQuestion = (id, data) => client.put(`/questions/${id}`, data).then((r) => r.data.question);
export const deleteQuestion = (id) => client.delete(`/questions/${id}`);

export const getResponseStatus = (surveyId) => client.get(`/surveys/${surveyId}/responses/me`).then((r) => r.data);
export const submitResponse = (surveyId, answers) =>
  client.post(`/surveys/${surveyId}/responses`, { answers }).then((r) => r.data);
