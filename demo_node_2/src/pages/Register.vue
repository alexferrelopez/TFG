<template>
  <div class="auth-page">
    <h1>Register</h1>
    <form @submit.prevent="handleSubmit">
      <label>
        Email
        <input v-model="email" type="email" required />
      </label>
      <label>
        Password
        <input v-model="password" type="password" required />
      </label>
      <label>
        Confirm Password
        <input v-model="confirm" type="password" required />
      </label>
      <button type="submit">Create account</button>
    </form>
    <p class="alt-link">
      Already have an account?
      <router-link to="/login">Sign in</router-link>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const email = ref('')
const password = ref('')
const confirm = ref('')

const handleSubmit = () => {
  if (password.value !== confirm.value) {
    alert("Passwords don't match")
    return
  }
  // TODO: replace with Keycloak registration integration
  alert('Stub register — integrate Keycloak later.')
}
</script>

<style scoped>
/* Reuse styles from Login.vue */
.auth-page {
  max-width: 320px;
  margin: 4rem auto;
  padding: 2rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
}
label {
  display: block;
  margin-bottom: 1rem;
}
input {
  width: 100%;
  padding: .5rem;
  margin-top: .25rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
button {
  width: 100%;
  padding: .5rem;
  margin-top: .5rem;
  border: none;
  background: #3b82f6;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
}
.alt-link {
  margin-top: 1rem;
  text-align: center;
}
</style>
