import client from './client';

export const getReport = (surveyId) => client.get(`/surveys/${surveyId}/report`).then((r) => r.data);
