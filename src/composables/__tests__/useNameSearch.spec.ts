import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useNameSearch } from '../useNameSearch'

// Мокаем таймеры для debounce
vi.useFakeTimers()

describe('useNameSearch', () => {
  const names = ref(['Alice', 'Bob', 'Alex', 'Алина', 'Борис'])
  const debounceMs = ref(0)
  let composableResult: ReturnType<typeof useNameSearch>
  const onSelectMock = vi.fn()

  beforeEach(() => {
    // Сброс перед каждым тестом
    onSelectMock.mockClear()
    // Пересоздаем composable для независимости
    composableResult = useNameSearch({
      names,
      debounceMs,
      onSelect: onSelectMock,
    })
    // Сбрасываем состояние
    composableResult.searchQuery.value = ''
    composableResult.hideSuggestions()
    vi.clearAllTimers()
  })

  it('filters names based on searchQuery (case-insensitive)', async () => {
    composableResult.searchQuery.value = 'al'
    composableResult.handleInput()
    await vi.advanceTimersByTimeAsync(debounceMs.value + 1) // Пропускаем debounce

    expect(composableResult.filteredNames.value.length).toBe(2)
    expect(composableResult.filteredNames.value[0].original).toBe('Alice')
    expect(composableResult.filteredNames.value[1].original).toBe('Alex')
    expect(composableResult.shouldShowContainer.value).toBe(true) // Контейнер должен быть виден
  })

  it('shows no results message correctly', async () => {
    composableResult.searchQuery.value = 'xyz'
    composableResult.handleInput()
    await vi.advanceTimersByTimeAsync(debounceMs.value + 1)

    expect(composableResult.filteredNames.value.length).toBe(0)
    expect(composableResult.hasNoResults.value).toBe(true)
    expect(composableResult.shouldShowContainer.value).toBe(true) // Контейнер виден для "No results"
  })

  it('selects a name and calls onSelect callback', async () => {
    composableResult.searchQuery.value = 'Бор'
    composableResult.handleInput()
    await vi.advanceTimersByTimeAsync(debounceMs.value + 1)

    expect(composableResult.filteredNames.value.length).toBe(1)

    // Выбираем имя напрямую через метод
    composableResult.selectName('Борис')

    expect(composableResult.searchQuery.value).toBe('Борис') // Поле обновилось
    expect(composableResult.shouldShowContainer.value).toBe(false) // Список скрылся
    expect(onSelectMock).toHaveBeenCalledTimes(1)
    expect(onSelectMock).toHaveBeenCalledWith('Борис')
  })

  it('clears search query and state', async () => {
    composableResult.searchQuery.value = 'al'
    composableResult.handleInput()
    await vi.advanceTimersByTimeAsync(debounceMs.value + 1)
    expect(composableResult.shouldShowContainer.value).toBe(true)

    composableResult.clearSearch()

    expect(composableResult.searchQuery.value).toBe('')
    expect(composableResult.filteredNames.value.length).toBe(0)
    expect(composableResult.shouldShowContainer.value).toBe(false)
    expect(composableResult.highlightedIndex.value).toBe(-1)
  })

  it('handles ArrowDown keydown for highlighting', async () => {
    composableResult.searchQuery.value = 'al'
    composableResult.handleInput()
    await vi.advanceTimersByTimeAsync(debounceMs.value + 1) // ['Alice', 'Alex']
    composableResult.showSuggestions.value = true // Имитируем видимость списка

    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
    composableResult.handleKeydown(event)
    expect(composableResult.highlightedIndex.value).toBe(0) // Alice

    composableResult.handleKeydown(event)
    expect(composableResult.highlightedIndex.value).toBe(1) // Alex

    composableResult.handleKeydown(event)
    expect(composableResult.highlightedIndex.value).toBe(0) // Зацикливание
  })

  it('handles Enter keydown to select highlighted item', async () => {
    composableResult.searchQuery.value = 'al'
    composableResult.handleInput()
    await vi.advanceTimersByTimeAsync(debounceMs.value + 1) // ['Alice', 'Alex']
    composableResult.showSuggestions.value = true // Имитируем видимость

    // Выбираем второй элемент (Alex)
    composableResult.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    composableResult.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(composableResult.highlightedIndex.value).toBe(1)

    // Нажимаем Enter
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
    const preventDefaultSpy = vi.spyOn(enterEvent, 'preventDefault')
    composableResult.handleKeydown(enterEvent)

    expect(preventDefaultSpy).toHaveBeenCalled()
    expect(onSelectMock).toHaveBeenCalledWith('Alex')
    expect(composableResult.shouldShowContainer.value).toBe(false) // Список должен скрыться
  })

  it('hides suggestions on Escape keydown', async () => {
    composableResult.searchQuery.value = 'al'
    composableResult.handleInput()
    await vi.advanceTimersByTimeAsync(debounceMs.value + 1)
    composableResult.showSuggestions.value = true // Имитируем видимость
    expect(composableResult.shouldShowContainer.value).toBe(true)

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
    const preventDefaultSpy = vi.spyOn(escapeEvent, 'preventDefault')
    composableResult.handleKeydown(escapeEvent)

    expect(preventDefaultSpy).toHaveBeenCalled()
    expect(composableResult.shouldShowContainer.value).toBe(false)
    expect(composableResult.highlightedIndex.value).toBe(-1)
  })
})
