<template>
  <div>
    <h3>Register user</h3>
    <form @submit.prevent="register">
      <label for="name"> Name: </label>
      <input v-model="name" type="email" name="name" value />

      <label for="email"> Email: </label>
      <input v-model="email" type="email" name="email" value />

      <button type="submit" name="button">Register</button>
      <p>{{ error }}</p>
      <router-link to="/login"> Already have an account? Login. </router-link>
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      email: '',
      error: '',
    };
  },
  methods: {
    register() {
      this.$store
        .dispatch('register', {
          name: this.name,
          email: this.email,
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