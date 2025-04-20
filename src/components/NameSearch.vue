<template>
  <div class="name-search" ref="searchContainerRef" v-click-outside="handleClickOutside">
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
        :aria-owns="suggestionsId"
        :aria-activedescendant="
          highlightedIndex >= 0 ? `${suggestionsId}-item-${highlightedIndex}` : undefined
        "
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
      />
      <button
        v-if="showClearButton"
        type="button"
        class="name-search__clear-button"
        aria-label="Очистить поиск"
        @click="clearSearchAndFocus"
      >
        ×
      </button>
    </div>

    <div aria-live="polite" role="status" class="visually-hidden">
      {{ accessibilityResultsText }}
    </div>

    <Transition name="fade">
      <div
        v-if="shouldShowContainer"
        class="name-search__suggestions-container"
        ref="suggestionsContainerRef"
      >
        <ul
          v-if="filteredNames.length > 0"
          :id="suggestionsId"
          ref="suggestionsListRef"
          class="name-search__suggestions-list"
          role="listbox"
          :aria-label="`Подсказки по именам для ${searchQuery}`"
        >
          <li
            v-for="(name, index) in filteredNames"
            :id="`${suggestionsId}-item-${index}`"
            :key="name.original"
            :ref="(el) => setSuggestionItemRef(el as HTMLElement, index)"
            class="name-search__suggestion-item"
            :class="{ 'name-search__suggestion-item--highlighted': index === highlightedIndex }"
            role="option"
            :aria-selected="index === highlightedIndex"
            @mousedown.prevent="selectNameAndFocus(name.original)"
            @mouseenter="highlightedIndex = index"
            v-html="name.highlighted"
          ></li>
        </ul>
        <div v-else-if="hasNoResults" class="name-search__no-results">Ничего не найдено</div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, reactive, onBeforeUpdate, toRef } from 'vue'
import { useNameSearch } from '@/composables/useNameSearch'
import vClickOutside from '@/directives/clickOutside'

// Props и Emits
interface Props {
  /**
   * Уникальный идентификатор для элемента input.
   * Используется для связи с label и атрибутами ARIA.
   * @default Генерируется случайный ID
   */
  inputId?: string
  /**
   * Массив имен для поиска.
   * @default Предопределенный список имен
   */
  names?: string[]
  /**
   * Задержка debounce в миллисекундах перед выполнением поиска.
   * @default 300
   */
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

const emit = defineEmits<{
  /**
   * Событие генерируется при выборе имени из списка подсказок.
   * @param e Имя события ('select')
   * @param name Выбранное имя (string)
   */
  (e: 'select', name: string): void
}>()

// Refs
const searchContainerRef = ref<HTMLDivElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const suggestionsContainerRef = ref<HTMLDivElement | null>(null)
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

// Composables
const {
  searchQuery,
  filteredNames,
  hasNoResults,
  highlightedIndex,
  shouldShowContainer,
  accessibilityResultsText,
  handleInput,
  handleKeydown,
  handleFocus,
  hideSuggestions,
  selectName,
  clearSearch,
} = useNameSearch({
  names: toRef(props, 'names'),
  debounceMs: toRef(props, 'debounceMs'),
  onSelect: (name: string) => {
    emit('select', name)
  },
})

// Computed
const suggestionsId = computed(() => `${props.inputId}-suggestions`)
const showClearButton = computed(() => searchQuery.value.length > 0)

// Методы
const focusInput = () => {
  inputRef.value?.focus()
}

const clearSearchAndFocus = () => {
  clearSearch()
  focusInput()
}

const selectNameAndFocus = (name: string) => {
  selectName(name)
  focusInput()
}

const handleClickOutside = () => {
  hideSuggestions()
}

const handleBlur = () => {
  setTimeout(() => {
    if (!searchContainerRef.value?.contains(document.activeElement)) {
      hideSuggestions()
    }
  }, 50)
}

// Watchers
watch(highlightedIndex, async (newIndex) => {
  // Прокручиваем только если контейнер видим
  if (newIndex >= 0 && shouldShowContainer.value) {
    await nextTick()
    const itemElement = suggestionItemsRefs[newIndex]
    itemElement?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    })
  }
})
</script>

<style lang="scss" scoped>
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

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
      padding-right: 2.5rem;
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

  // Подсветка совпадения
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
