import { createStore } from 'vuex';
//import axios from 'axios';
import utils from '../utils/utils.js';

// const apiClient = axios.create({
//   baseURL: 'http://localhost:8081/api/',
//   withCredentials: false,
//   headers: {
//     Accept: 'application/json',
//     'Content-Type': 'application/json',
//   },
// });

export default createStore({
  state: {
    user: null,
    customers: [],
    credentialsChallenge: null,
  },
  mutations: {
    SET_USER_DATA(state, userData) {
      state.credentialsChallenge = utils.encodeCredentialsRequest(userData);
    },
    UPDATE_USER_DATA(state, userData) {
      //state.credentialsChallenge = utils.encodeCredentialsRequest(userData);
      localStorage.removeItem('user');
    },
    CLEAR_USER_DATA() {
      localStorage.removeItem('user');
    },
    SET_LOGIN_DATA(state, userData) {

    },
    SET_CUSTOMERS(state, customerData) {
      state.customers = customerData;
    },
  },
  actions: {
    async startRegistration({ commit }, credentials) {
      const response = await fetch('/api/user/register', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      const responseJson = await response.json();
      if (responseJson.status !== 'ok')
        throw new Error(
          `Server responed with error. The message is: ${responseJson.message}`
        );
      commit('SET_USER_DATA', responseJson);
    },
    async completeRegistration({ commit }, credentials) {
      const response = await fetch('/api/user/register', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      const responseJson = await response.json();
      if (responseJson.status !== 'ok')
        throw new Error(
          `Server responed with error. The message is: ${responseJson.message}`
        );
      commit('UPDATE_USER_DATA', responseJson);
    },
    async login({ commit }, credentials) {
      const response = await fetch('/api/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      const responseJson = await response.json();
      if (responseJson.status !== 'ok')
        throw new Error(
          `Server responed with error. The message is: ${responseJson.message}`
        );
      commit('SET_LOGIN_DATA', responseJson);
    },
    logout({ commit }) {
      commit('CLEAR_USER_DATA');
    },
    getCustomers({ commit }) {
      // return apiClient.get('/customer').then(({ data }) => {
      //   commit('SET_CUSTOMERS', data);
      // });
    },
  },
  getters: {
    loggedIn(state) {
      return !!state.user;
    },
    credentialsChallenge(state) {
      return state.credentialsChallenge;
    },
  },
  modules: {},
});
