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
        @input="handleInput"
        @focus="showSuggestions = true"
        @blur="handleBlur"
      />
    </div>

    <Transition name="fade">
      <div
        v-if="showSuggestions && filteredNames.length > 0"
        class="name-search__suggestions-container"
      >
        <ul
          id="suggestions-list"
          ref="suggestionsListRef"
          class="name-search__suggestions-list"
          role="listbox"
        >
          <li
            v-for="(name, index) in filteredNames"
            :id="`suggestion-${index}`"
            :key="name"
            ref="suggestionItemsRef"
            class="name-search__suggestion-item"
            role="option"
            @mousedown.prevent="selectName(name)"
          >
            {{ name }}
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  inputId?: string
  names?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  inputId: () => `name-search-input-${Math.random().toString(36).substring(7)}`,
  names: () => [
    // Список имен по умолчанию
    'Alice',
    'Bob',
    'Charlie',
    'David',
    'Eve',
    'Alex',
    'Grace',
    'Heidi',
    'Ivan',
    'Judy',
    'Алина',
    'Борис',
    'Виктор',
    'Галина',
    'Дмитрий',
    'Елена',
    'Жанна',
    'Игорь',
    'Ксения',
    'Леонид',
    'Мария',
    'Николай',
    'Ольга',
    'Петр',
    'Светлана',
    'Татьяна',
    'Ульяна',
    'Федор',
    'Эдуард',
    'Юлия',
    'Ярослав',
  ],
})

const inputRef = ref<HTMLInputElement | null>(null)
const suggestionsListRef = ref<HTMLUListElement | null>(null)
const suggestionItemsRef = ref<HTMLLIElement[]>([])

const searchQuery = ref<string>('')
const showSuggestions = ref<boolean>(false)

const filteredNames = computed<string[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) {
    return [] // Не показываем ничего, если запрос пустой
  }
  return props.names.filter((name) => name.toLowerCase().includes(query))
})

// Скрываем список, если результат фильтрации пуст (кроме случая пустого запроса)
watch(filteredNames, (newVal, oldVal) => {
  if (searchQuery.value.trim() && newVal.length === 0) {
    // Пока просто скрываем
  } else if (newVal.length > 0) {
    showSuggestions.value = true
  }
})

const handleInput = () => {
  // Показываем при вводе, если есть результаты
  if (filteredNames.value.length > 0) {
    showSuggestions.value = true
  }
}

const selectName = (name: string) => {
  searchQuery.value = name
  showSuggestions.value = false
  inputRef.value?.focus()
}

const handleBlur = () => {
  setTimeout(() => {
    showSuggestions.value = false
  }, 150)
}
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

  &__suggestions-container {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background-color: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    max-height: 250px;
    overflow-y: auto;
    z-index: 10;
  }

  &__suggestions-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  &__suggestion-item {
    padding: 0.75rem 1rem;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      // Пока только hover
      background-color: #f0f0f0;
    }
  }
}

// --- Анимация ---
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease; // Упрощенная анимация пока
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 600px) {
  .name-search {
    max-width: 100%;
  }
}
</style>
