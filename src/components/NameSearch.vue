<template>
  <div class="name-search">
    <label :for="inputId" class="name-search__label">Поиск имени:</label>
    <div class="name-search__input-wrapper">
      <input
        :id="inputId"
        ref="inputRef"
        v-model="searchQuery"
        type="text"
        class="name-search__input"
        placeholder="Введите имя..."
        autocomplete="off"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  inputId?: string
}

const props = withDefaults(defineProps<Props>(), {
  inputId: () => `name-search-input-${Math.random().toString(36).substring(7)}`,
})

const inputRef = ref<HTMLInputElement | null>(null)
const searchQuery = ref<string>('') // Временно
</script>

<style lang="scss" scoped>
.name-search {
  position: relative;
  width: 100%;
  max-width: 400px;
  font-family: sans-serif;

  &__label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: #333;
  }

  &__input-wrapper {
    position: relative;
  }

  &__input {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;

    &:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }
  }
}

@media (max-width: 600px) {
  .name-search {
    max-width: 100%;
  }
}
</style>
