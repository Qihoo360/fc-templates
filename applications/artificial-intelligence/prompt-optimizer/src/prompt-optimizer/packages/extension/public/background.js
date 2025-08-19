chrome.action.onClicked.addListener(() => {
  const url = chrome.runtime.getURL('index.html');
  chrome.tabs.create({ url });
}); 