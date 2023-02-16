import { createStore } from 'vuex';
import utils from '../utils/utils.js';

export default createStore({
  state: {
    user: null,
    customers: [],
    credentialsChallenge: null,
    assertChallenge: null,
    verifySucceeded: false,
    token: '',
  },
  mutations: {
    SET_USER_DATA(state, userData) {
      state.credentialsChallenge = utils.encodeCredentialsRequest(userData);
    },
    UPDATE_USER_DATA(state, userData) {
      localStorage.removeItem('user');
    },
    CLEAR_USER_DATA() {
      localStorage.removeItem('user');
    },
    SET_LOGIN_DATA(state, userData) {
      state.assertChallenge = utils.encodeAssetRequest(userData);
    },
    SET_LOGIN_ERROR(state, userData) {
      state.loginError = userData;
    },
    SET_LOGIN_VERIFY_DATA(state, userData) {
      state.verifySucceeded = true;
      state.token = userData.token;
    },
    SET_CUSTOMERS(state, customerData) {
      state.customers = customerData;
    },
    SET_CUSTOMERS_ERROR(state, customerData) {
      state.customersError = customerData;
    }
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
        commit('SET_LOGIN_ERROR', responseJson.message)
      else 
        commit('SET_LOGIN_DATA', responseJson);
    },
    async verifyLogin({ commit }, credentials) {
      const response = await fetch('/api/login/verify', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      const responseJson = await response.json();
      if (responseJson.status !== 'ok')
        commit('SET_LOGIN_ERROR', responseJson.message)
      else 
        commit('SET_LOGIN_VERIFY_DATA', responseJson);
    },
    logout({ commit }) {
      commit('CLEAR_USER_DATA');
    },
    async getCustomers({ commit }) {
      try {
        const response = await fetch('/api/customers', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + this.state.token,
          },
        });
        if (response.status === 200) {
          const responseJson = await response.json();
          commit('SET_CUSTOMERS', responseJson);      
        } else 
          commit('SET_CUSTOMERS_ERROR', response.statusText);
      } catch (error) {
        console.log(error);
      }
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
