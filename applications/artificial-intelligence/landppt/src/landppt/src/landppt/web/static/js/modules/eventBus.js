const bus = new EventTarget();

export function emit(eventName, detail) {
    bus.dispatchEvent(new CustomEvent(eventName, { detail }));
}

export function on(eventName, handler) {
    const wrapped = (event) => handler(event.detail);
    bus.addEventListener(eventName, wrapped);
    return () => bus.removeEventListener(eventName, wrapped);
}

export default bus;
