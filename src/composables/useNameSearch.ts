import { ref, computed, watch, type Ref, toRef, readonly, type ComputedRef } from 'vue'

/** Результат поиска имени с оригинальным и подсвеченным вариантами */
export interface NameSearchResult {
  /** Оригинальное имя */
  original: string
  /** Имя с HTML-подсветкой совпадений */
  highlighted: string
}

/** Опции для composable функции useNameSearch */
export interface UseNameSearchOptions {
  /** Реактивная ссылка на массив имен для поиска */
  names: Ref<Readonly<string[]>>
  /** Реактивная ссылка на задержку debounce в мс */
  debounceMs: Ref<number>
  /** Callback, вызываемый при выборе имени */
  onSelect?: (name: string) => void
}

/** Возвращаемое значение composable функции useNameSearch */
export interface UseNameSearchReturn {
  /** Текущий поисковый запрос (для v-model) */
  searchQuery: Ref<string>
  /** Отфильтрованные и подсвеченные имена */
  filteredNames: Readonly<Ref<NameSearchResult[]>>
  /** Флаг: показывать ли контейнер с подсказками (внутреннее состояние) */
  showSuggestions: Ref<boolean>
  /** Флаг: был ли поиск, но результатов нет */
  hasNoResults: Readonly<Ref<boolean>>
  /** Индекс подсвеченного элемента в списке */
  highlightedIndex: Ref<number>
  /** Флаг: должен ли контейнер подсказок быть видимым (включая "нет результатов") */
  shouldShowContainer: ComputedRef<boolean>
  /** Текст для анонса результатов скринридерам */
  accessibilityResultsText: Readonly<Ref<string>>
  /** Обработчик события input для поля ввода */
  handleInput: () => void
  /** Обработчик события keydown для поля ввода */
  handleKeydown: (event: KeyboardEvent) => void
  /** Обработчик события focus для поля ввода */
  handleFocus: () => void
  /** Метод для скрытия подсказок (например, при клике вне) */
  hideSuggestions: () => void
  /** Метод для выбора имени (например, при клике на подсказку) */
  selectName: (name: string) => void
  /** Метод для очистки поля ввода и сброса состояния */
  clearSearch: () => void
}

/**
 * Возвращает правильную форму существительного в зависимости от числа.
 * @param number - Число.
 * @param one - Форма для 1 (например, 'совпадение').
 * @param two - Форма для 2, 3, 4 (например, 'совпадения').
 * @param five - Форма для 0, 5 и более (например, 'совпадений').
 * @returns Правильная форма существительного.
 */
const getNoun = (number: number, one: string, two: string, five: string): string => {
  let n = Math.abs(number)
  n %= 100
  if (n >= 5 && n <= 20) return five
  n %= 10
  if (n === 1) return one
  if (n >= 2 && n <= 4) return two
  return five
}

/**
 * Composable для управления логикой поиска имен с подсказками.
 *
 * @param options - Опции для настройки поиска.
 * @returns Реактивное состояние и методы для управления компонентом поиска.
 */
export function useNameSearch(options: UseNameSearchOptions): UseNameSearchReturn {
  const { onSelect } = options
  const names = toRef(options, 'names')
  const debounceMs = toRef(options, 'debounceMs')

  const searchQuery = ref<string>('')
  const debouncedQuery = ref<string>('')
  const showSuggestions = ref<boolean>(false)
  const highlightedIndex = ref<number>(-1)
  let debounceTimer: number | undefined

  const highlightMatch = (text: string, query: string): string => {
    if (!query) return text
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${escapedQuery})`, 'gi')
    return text.replace(regex, '<mark class="name-search__highlight">$1</mark>')
  }

  const filteredNames = computed<NameSearchResult[]>(() => {
    const query = debouncedQuery.value.trim().toLowerCase()
    if (!query) return []
    return names.value
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

  /** Динамически генерируемый текст для анонса результатов поиска скринридерам. */
  const accessibilityResultsText = computed<string>(() => {
    if (!shouldShowContainer.value || !debouncedQuery.value.trim()) return '' // Показываем только когда контейнер виден и есть запрос
    const count = filteredNames.value.length
    if (count > 0) {
      return `Найдено ${count} ${getNoun(count, 'совпадение', 'совпадения', 'совпадений')}. Используйте стрелки для навигации.`
    } else if (hasNoResults.value) {
      return 'Ничего не найдено.'
    }
    return ''
  })

  watch(filteredNames, () => {
    highlightedIndex.value = -1
  })

  const handleInput = () => {
    showSuggestions.value = true
    clearTimeout(debounceTimer)
    debounceTimer = window.setTimeout(() => {
      debouncedQuery.value = searchQuery.value
    }, debounceMs.value)
  }

  const selectName = (name: string) => {
    searchQuery.value = name
    debouncedQuery.value = name
    showSuggestions.value = false
    highlightedIndex.value = -1
    onSelect?.(name)
    clearTimeout(debounceTimer)
  }

  const hideSuggestions = () => {
    if (showSuggestions.value) {
      showSuggestions.value = false
      highlightedIndex.value = -1
    }
  }

  const clearSearch = () => {
    searchQuery.value = ''
    debouncedQuery.value = ''
    showSuggestions.value = false
    highlightedIndex.value = -1
    clearTimeout(debounceTimer)
  }

  const handleFocus = () => {
    if (searchQuery.value.trim()) {
      debouncedQuery.value = searchQuery.value
      showSuggestions.value = true
    }
  }

  const handleKeydown = (event: KeyboardEvent) => {
    const listLength = filteredNames.value.length

    if (event.key === 'Escape') {
      if (showSuggestions.value) {
        hideSuggestions()
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
        hideSuggestions()
        break
    }
  }

  return {
    searchQuery,
    filteredNames,
    showSuggestions,
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
  }
}
