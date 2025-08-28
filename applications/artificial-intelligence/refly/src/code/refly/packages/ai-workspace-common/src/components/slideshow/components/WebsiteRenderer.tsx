import { memo } from 'react';
import { type NodeRelation } from './ArtifactRenderer';

const WebsiteRenderer = memo(
  ({
    node,
    isFullscreen = false,
    isMinimap = false,
  }: {
    node: NodeRelation;
    isFullscreen?: boolean;
    isMinimap?: boolean;
  }) => {
    const url = node.nodeData?.metadata?.url;
    const title = node.nodeData?.title;
    return (
      <div
        className={`h-full bg-white ${!isFullscreen ? 'rounded' : 'w-full'} ${
          isMinimap ? 'p-1' : ''
        }`}
      >
        <div className="h-full w-full overflow-auto p-4">
          <iframe
            key={url}
            src={url}
            title={title || url}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
            allow="fullscreen"
            referrerPolicy="no-referrer"
            loading="lazy"
            onLoad={(e) => {
              try {
                // Try to access iframe content to mute any audio/video elements
                const iframe = e.target as HTMLIFrameElement;
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

                if (iframeDoc) {
                  // Function to handle media elements
                  const handleMediaElement = (element: HTMLMediaElement) => {
                    element.muted = true;
                    element.autoplay = false;
                    element.setAttribute('autoplay', 'false');
                    element.setAttribute('preload', 'none');

                    // Remove any existing event listeners
                    const elementClone = element.cloneNode(true) as HTMLMediaElement;
                    element.parentNode?.replaceChild(elementClone, element);

                    // Prevent play attempts
                    elementClone.addEventListener(
                      'play',
                      (e) => {
                        if (elementClone.muted === false) {
                          elementClone.muted = true;
                          e.preventDefault();
                          elementClone.pause();
                        }
                      },
                      true,
                    );
                  };

                  // Handle existing media elements
                  const mediaElements = iframeDoc.querySelectorAll('video, audio, iframe');
                  for (const element of Array.from(mediaElements)) {
                    if (element instanceof HTMLMediaElement) {
                      handleMediaElement(element);
                    } else if (element instanceof HTMLIFrameElement) {
                      // Handle nested iframes
                      element.setAttribute('allow', 'fullscreen');
                      element.setAttribute('autoplay', 'false');
                    }
                  }

                  // Create observer to handle dynamically added elements
                  const observer = new MutationObserver((mutations) => {
                    for (const mutation of mutations) {
                      for (const node of Array.from(mutation.addedNodes)) {
                        if (node instanceof HTMLElement) {
                          // Handle newly added media elements
                          const newMediaElements = node.querySelectorAll('video, audio, iframe');
                          for (const element of Array.from(newMediaElements)) {
                            if (element instanceof HTMLMediaElement) {
                              handleMediaElement(element);
                            } else if (element instanceof HTMLIFrameElement) {
                              element.setAttribute('allow', 'fullscreen');
                              element.setAttribute('autoplay', 'false');
                            }
                          }

                          // Also check if the node itself is a media element
                          if (node instanceof HTMLMediaElement) {
                            handleMediaElement(node);
                          } else if (node instanceof HTMLIFrameElement) {
                            node.setAttribute('allow', 'fullscreen');
                            node.setAttribute('autoplay', 'false');
                          }
                        }
                      }
                    }
                  });

                  // Start observing
                  observer.observe(iframeDoc.body, {
                    childList: true,
                    subtree: true,
                  });

                  // Add strict CSP
                  const meta = iframeDoc.createElement('meta');
                  meta.setAttribute('http-equiv', 'Content-Security-Policy');
                  meta.setAttribute(
                    'content',
                    "media-src 'none'; autoplay 'none'; camera 'none'; microphone 'none'",
                  );
                  iframeDoc.head?.insertBefore(meta, iframeDoc.head.firstChild);

                  // Add CSS to prevent autoplay and ensure muted state
                  const style = iframeDoc.createElement('style');
                  style.textContent = `
                  video, audio, iframe {
                    autoplay: false !important;
                    muted: true !important;
                  }
                  video[autoplay], audio[autoplay], iframe[autoplay] {
                    autoplay: false !important;
                  }
                  video:not([muted]), audio:not([muted]) {
                    muted: true !important;
                  }
                  /* Bilibili specific */
                  .bilibili-player-video {
                    pointer-events: none !important;
                  }
                  .bilibili-player-video-control {
                    pointer-events: auto !important;
                  }
                `;
                  iframeDoc.head?.appendChild(style);

                  // Clean up observer when iframe is unloaded
                  return () => observer.disconnect();
                }
              } catch {
                // Ignore cross-origin errors
                console.debug('Cannot access iframe content due to same-origin policy');
              }
            }}
          />
        </div>
      </div>
    );
  },
);

export { WebsiteRenderer };
