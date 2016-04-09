// https://davidwalsh.name/javascript-debounce-function
export default function debounce(func, wait, immediate) {
  let timeout;
  return function() {
    const context = this, args = arguments;

    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    if (timeout) clearTimeout(timeout);

    const callNow = immediate && !timeout,
          now = new Date().getTime();

    timeout = setTimeout(later, wait);

    if (callNow) func.apply(context, args);

    return now + wait;
  };
}