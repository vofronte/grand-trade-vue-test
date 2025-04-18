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
        :class="{ 'name-search__input--with-clear': showClearButton }"
        placeholder="Введите имя..."
        autocomplete="off"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="shouldShowContainer"
        :aria-controls="suggestionsId"
        :aria-activedescendant="
          highlightedIndex >= 0 ? `${suggestionsId}-item-${highlightedIndex}` : undefined
        "
        @input="handleInput"
        @focus="showSuggestionsList"
        @blur="handleBlur"
        @keydown="handleKeydown"
      />
      <button
        v-if="showClearButton"
        type="button"
        class="name-search__clear-button"
        aria-label="Очистить поиск"
        @click="clearSearch"
      >
        ×
      </button>
    </div>

    <Transition name="fade">
      <div v-if="shouldShowContainer" class="name-search__suggestions-container">
        <ul
          v-if="filteredNames.length > 0"
          :id="suggestionsId"
          ref="suggestionsListRef"
          class="name-search__suggestions-list"
          role="listbox"
        >
          <li
            v-for="(name, index) in filteredNames"
            :id="`${suggestionsId}-item-${index}`"
            :key="name.original"
            :ref="(el) => setSuggestionItemRef(el, index)"
            class="name-search__suggestion-item"
            :class="{ 'name-search__suggestion-item--highlighted': index === highlightedIndex }"
            role="option"
            :aria-selected="index === highlightedIndex"
            @mousedown.prevent="selectName(name.original)"
            @mouseenter="highlightedIndex = index"
            v-html="name.highlighted"
          ></li>
        </ul>
        <div v-else class="name-search__no-results">Ничего не найдено</div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, reactive, onBeforeUpdate } from 'vue'

// --- Types ---
interface NameSearchResult {
  original: string
  highlighted: string
}

interface Props {
  inputId?: string
  names?: string[]
  debounceMs?: number
}

const props = withDefaults(defineProps<Props>(), {
  inputId: () => `name-search-input-${Math.random().toString(36).substring(7)}`,
  names: () => [
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
  debounceMs: 300,
})

const inputRef = ref<HTMLInputElement | null>(null)
const suggestionsListRef = ref<HTMLUListElement | null>(null)
const suggestionItemsRefs = reactive<Record<number, HTMLLIElement | null>>({})

const setSuggestionItemRef = (el: Element | null, index: number) => {
  if (el instanceof HTMLLIElement) {
    suggestionItemsRefs[index] = el
  }
}
onBeforeUpdate(() => {
  for (const key in suggestionItemsRefs) {
    delete suggestionItemsRefs[key]
  }
})

const searchQuery = ref<string>('')
const debouncedQuery = ref<string>('')
const showSuggestions = ref<boolean>(false)
const highlightedIndex = ref<number>(-1)
let debounceTimer: number | undefined

const suggestionsId = computed(() => `${props.inputId}-suggestions`)
const showClearButton = computed(() => searchQuery.value.length > 0)

// Функция для подсветки совпадений
const highlightMatch = (text: string, query: string): string => {
  if (!query) return text
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  return text.replace(regex, '<mark class="name-search__highlight">$1</mark>')
}

const filteredNames = computed<NameSearchResult[]>(() => {
  const query = debouncedQuery.value.trim().toLowerCase()
  if (!query) return []
  return props.names
    .filter((name) => name.toLowerCase().includes(query))
    .map((name) => ({
      original: name,
      highlighted: highlightMatch(name, query),
    }))
})

const hasNoResults = computed(
  () => debouncedQuery.value.trim().length > 0 && filteredNames.value.length === 0,
)
const shouldShowContainer = computed(
  () => showSuggestions.value && (filteredNames.value.length > 0 || hasNoResults.value),
)

watch(filteredNames, () => {
  highlightedIndex.value = -1
})

watch(highlightedIndex, async (newIndex) => {
  if (newIndex >= 0 && showSuggestions.value) {
    await nextTick()
    const itemElement = suggestionItemsRefs[newIndex]
    itemElement?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    })
  }
})

const handleInput = () => {
  showSuggestions.value = true
  clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => {
    debouncedQuery.value = searchQuery.value
  }, props.debounceMs)
}

const selectName = (name: string) => {
  searchQuery.value = name
  debouncedQuery.value = name
  showSuggestions.value = false
  highlightedIndex.value = -1
  inputRef.value?.focus()
  clearTimeout(debounceTimer)
}

const clearSearch = () => {
  searchQuery.value = ''
  debouncedQuery.value = ''
  showSuggestions.value = false
  highlightedIndex.value = -1
  clearTimeout(debounceTimer)
  inputRef.value?.focus()
}

const showSuggestionsList = () => {
  if (searchQuery.value.trim()) {
    debouncedQuery.value = searchQuery.value
    showSuggestions.value = true
  }
}

const handleBlur = () => {
  setTimeout(() => {
    if (!suggestionsListRef.value?.contains(document.activeElement)) {
      showSuggestions.value = false
    }
  }, 150)
}

const handleKeydown = (event: KeyboardEvent) => {
  const listLength = filteredNames.value.length

  if (event.key === 'Escape') {
    if (showSuggestions.value) {
      showSuggestions.value = false
      highlightedIndex.value = -1
      event.preventDefault()
    }
    return
  }

  if (!listLength || !showSuggestions.value) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      highlightedIndex.value = (highlightedIndex.value + 1) % listLength
      break
    case 'ArrowUp':
      event.preventDefault()
      highlightedIndex.value = (highlightedIndex.value - 1 + listLength) % listLength
      break
    case 'Enter':
      event.preventDefault()
      if (highlightedIndex.value >= 0) {
        selectName(filteredNames.value[highlightedIndex.value].original)
      }
      break
    case 'Tab':
      showSuggestions.value = false
      highlightedIndex.value = -1
      break
  }
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

    &--with-clear {
      padding-right: 2.5rem; // Место для кнопки
    }

    &:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }
  }

  &__clear-button {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    padding: 0.25rem 0.5rem;
    font-size: 1.5rem;
    line-height: 1;
    color: #999;
    cursor: pointer;
    transition: color 0.2s ease;

    &:hover,
    &:focus {
      color: #333;
      outline: none;
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

    &:hover,
    &--highlighted {
      background-color: #e9ecef;
    }
  }

  // Стили для подсветки совпадения
  :deep(.name-search__highlight) {
    background-color: transparent;
    font-weight: bold;
    color: #0056b3;
  }

  &__no-results {
    padding: 0.75rem 1rem;
    color: #777;
    font-style: italic;
    text-align: center;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
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
