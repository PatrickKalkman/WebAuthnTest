<template>
  <div>
    <h3>{{ title }}</h3>
    <form @submit.prevent="login">
      <label for="email"> Email: </label>
      <input v-model="email" type="email" name="email" value />
      <button type="submit" name="button">Login</button>
      <p>{{ error }}</p>
      <router-link to="/register">
        Don't have an account? Register.
      </router-link>
    </form>
  </div>
</template>

<script>
import utils from '../utils/utils.js';

export default {
  data() {
    return {
      title: 'Login',
      email: '',
      error: '',
      token: '',
    };
  },
  computed: {
    assertChallenge () {
      return this.$store.state.assertChallenge;
    },
    loginError () {
      return this.$store.state.loginError;
    },
  },
  methods: {
    async login() {
      await this.$store.dispatch('login', { username: this.email });
      if (this.loginError) {
        this.error = this.loginError;
        return;
      }
      const credentialInfo = await navigator.credentials.get({publicKey: {...this.assertChallenge}});
      const encodedCredentialInfo = utils.encodeCredentialInfoRequest(credentialInfo);
      await this.$store.dispatch('verifyLogin', encodedCredentialInfo);
    },
  },
};
</script>
