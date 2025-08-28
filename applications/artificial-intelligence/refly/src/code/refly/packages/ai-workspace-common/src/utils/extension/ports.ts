const portStore: { [key: string]: any } = {};
export const getPort = async (name: string) => {
  const { browser } = await import('wxt/browser');
  if (portStore?.[name]) return { isNew: false, port: portStore[name] };

  const port = browser.runtime.connect({
    name,
  });
  portStore[name] = port;

  return { isNew: true, port };
};

export const removePort = (name: string) => {
  const port = portStore?.[name];

  if (port) {
    port.disconnect();
    delete portStore[name];
  }
};
