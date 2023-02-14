<template>
  <div>
    <h3>Register user</h3>
    <form @submit.prevent="register">
      <label for="name"> Name: </label>
      <input v-model="name" type="name" name="name" value />
      <label for="email"> Email: </label>
      <input v-model="email" type="email" name="email" value />
      <button type="submit" name="button">Register</button>
      <p>{{ error }}</p>
      <router-link to="/login"> Already have an account? Login. </router-link>
    </form>
  </div>
</template>

<script>
import utils from '../utils/utils.js';

export default {
  data() {
    return {
      email: '',
      error: '',
    };   
  },
  computed: {
    challenge () {
      return this.$store.state.credentialsChallenge;
    }
  },
  methods: {
    async register() {
      await this.$store.dispatch('startRegistration', {username: this.email, name: this.name });
      const credentialInfo = await navigator.credentials.create({ publicKey: {...this.challenge}});
      const encodedCredentialInfo = utils.encodeCredentialInfoRequest(credentialInfo);
      await this.$store.dispatch('completeRegistration', encodedCredentialInfo);
    },
  },
};
</script>