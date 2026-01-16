export const qs = (selector, scope = document) => scope.querySelector(selector);
export const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

export function createFragment(nodes = []) {
    const fragment = document.createDocumentFragment();
    nodes.forEach(node => fragment.appendChild(node));
    return fragment;
}

export function debounce(fn, delay = 200) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

export function formatBytes(bytes) {
    if (!bytes && bytes !== 0) return '-';
    const units = ['B', 'KB', 'MB', 'GB'];
    const base = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, base);
    return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[base]}`;
}

export function toggleElement(el, show) {
    if (!el) return;
    el.style.display = show ? '' : 'none';
}
