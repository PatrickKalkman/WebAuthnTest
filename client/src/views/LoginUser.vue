<template>
  <div>
    <h3>{{ title }}</h3>
    <form v-if="!showTwoFactorPanel" @submit.prevent="login">
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
export default {
  data() {
    return {
      title: 'Login',
      email: '',
      error: '',
      token: '',
    };
  },
  methods: {
    login() {
      this.$store
        .dispatch('login', {
          username: this.email,
        })
        .then(() => {
            this.$router.push({ name: 'dashboard' });
        })
        .catch((err) => {
          this.error = err.response.data.message;
        });
    },
  },
};
</script>