<template>
  <div id="app-container">
    <h1>Поиск имен Vue.js</h1>
    <NameSearch @select="handleNameSelect" />
    <div class="info">
      <p>Начните вводить имя (например, "Al", "Бо", "Ма")</p>
      <p>Используйте стрелки ↑/↓ и Enter для навигации.</p>
      <p v-if="selectedName">
        Выбрано имя: <strong>{{ selectedName }}</strong>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import NameSearch from './components/NameSearch.vue'

const selectedName = ref<string | null>(null)

const handleNameSelect = (name: string | null) => {
  console.log('Выбрано имя в App.vue:', name)
  selectedName.value = name
}
</script>

<style lang="scss">
body {
  font-family: sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 0;
  padding: 0;
  background-color: #f4f7f6;
}

#app-container {
  max-width: 600px;
  margin: 40px auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

h1 {
  text-align: center;
  color: #1a3b58;
  margin-bottom: 2rem;
}

.info {
  margin-top: 2rem;
  font-size: 0.9rem;
  color: #555;
  text-align: center;
  line-height: 1.5;
}
</style>
