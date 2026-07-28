import client from './client';

export const listUsers = (params) => client.get('/users', { params }).then((r) => r.data.users);
export const getUser = (id) => client.get(`/users/${id}`).then((r) => r.data.user);
export const createUser = (data) => client.post('/users', data).then((r) => r.data.user);
export const updateUser = (id, data) => client.put(`/users/${id}`, data).then((r) => r.data.user);
export const deleteUser = (id) => client.delete(`/users/${id}`);
export const importUsersCsv = (csv) => client.post('/users/import', { csv }).then((r) => r.data);
