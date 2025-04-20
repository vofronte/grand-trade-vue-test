import { ref, computed, watch, type Ref, toRef, readonly } from 'vue'

// Типы
export interface NameSearchResult {
  original: string
  highlighted: string
}

export interface UseNameSearchOptions {
  names: Ref<Readonly<string[]>>
  debounceMs: Ref<number>
  onSelect?: (name: string) => void
}

export interface UseNameSearchReturn {
  searchQuery: Ref<string>
  filteredNames: Readonly<Ref<NameSearchResult[]>>
  showSuggestions: Readonly<Ref<boolean>>
  hasNoResults: Readonly<Ref<boolean>>
  highlightedIndex: Ref<number>
  shouldShowContainer: Readonly<Ref<boolean>>
  accessibilityResultsText: Readonly<Ref<string>>
  handleInput: () => void
  handleKeydown: (event: KeyboardEvent) => void
  handleFocus: () => void
  hideSuggestions: () => void
  selectName: (name: string) => void
  clearSearch: () => void
}

// Утилита для склонения
const getNoun = (number: number, one: string, two: string, five: string): string => {
  let n = Math.abs(number)
  n %= 100
  if (n >= 5 && n <= 20) return five
  n %= 10
  if (n === 1) return one
  if (n >= 2 && n <= 4) return two
  return five
}

export function useNameSearch(options: UseNameSearchOptions) {
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

  // Текст для скринридера
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
    // onSelect?.('')
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
    filteredNames: readonly(filteredNames),
    showSuggestions: readonly(showSuggestions),
    hasNoResults: readonly(hasNoResults),
    highlightedIndex,
    shouldShowContainer: readonly(shouldShowContainer),
    accessibilityResultsText: readonly(accessibilityResultsText),
    handleInput,
    handleKeydown,
    handleFocus,
    hideSuggestions,
    selectName,
    clearSearch,
  }
}
