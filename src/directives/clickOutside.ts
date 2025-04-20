import type { Directive, DirectiveBinding } from 'vue'

interface ClickOutsideHTMLElement extends HTMLElement {
  _clickOutside?: (event: MouseEvent) => void
}

const clickOutside: Directive<ClickOutsideHTMLElement, (event: MouseEvent) => void> = {
  mounted(el, binding: DirectiveBinding<(event: MouseEvent) => void>) {
    el._clickOutside = (event: MouseEvent) => {
      // Проверяем, что клик был не внутри элемента и не по самому элементу
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value(event) // Вызываем функцию, переданную в директиву
      }
    }
    // Вешаем слушатель на весь документ
    document.addEventListener('mousedown', el._clickOutside)
  },
  unmounted(el: ClickOutsideHTMLElement) {
    // Убираем слушатель при размонтировании
    if (el._clickOutside) {
      document.removeEventListener('mousedown', el._clickOutside)
      delete el._clickOutside // Чистим свойство
    }
  },
}

export default clickOutside
