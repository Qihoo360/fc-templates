"use strict";(self.webpackChunk_refly_web=self.webpackChunk_refly_web||[]).push([["7686"],{5242:function(e,t,l){l.r(t),l.d(t,{WebsiteRenderer:()=>o});var a=l(31549);let o=(0,l(44194).memo)(e=>{var t,l,o;let{node:r,isFullscreen:n=!1,isMinimap:i=!1}=e,u=null==(l=r.nodeData)||null==(t=l.metadata)?void 0:t.url,s=null==(o=r.nodeData)?void 0:o.title;return(0,a.jsx)("div",{className:`h-full bg-white ${!n?"rounded":"w-full"} ${i?"p-1":""}`,children:(0,a.jsx)("div",{className:"h-full w-full overflow-auto p-4",children:(0,a.jsx)("iframe",{src:u,title:s||u,className:"w-full h-full border-0",sandbox:"allow-scripts allow-same-origin allow-forms allow-popups allow-presentation",allow:"fullscreen",referrerPolicy:"no-referrer",loading:"lazy",onLoad:e=>{try{var t,l,a;let o=e.target,r=o.contentDocument||(null==(t=o.contentWindow)?void 0:t.document);if(r){let e=e=>{var t;e.muted=!0,e.autoplay=!1,e.setAttribute("autoplay","false"),e.setAttribute("preload","none");let l=e.cloneNode(!0);null==(t=e.parentNode)||t.replaceChild(l,e),l.addEventListener("play",e=>{!1===l.muted&&(l.muted=!0,e.preventDefault(),l.pause())},!0)},t=r.querySelectorAll("video, audio, iframe");for(let l of Array.from(t))l instanceof HTMLMediaElement?e(l):l instanceof HTMLIFrameElement&&(l.setAttribute("allow","fullscreen"),l.setAttribute("autoplay","false"));let o=new MutationObserver(t=>{for(let l of t)for(let t of Array.from(l.addedNodes))if(t instanceof HTMLElement){let l=t.querySelectorAll("video, audio, iframe");for(let t of Array.from(l))t instanceof HTMLMediaElement?e(t):t instanceof HTMLIFrameElement&&(t.setAttribute("allow","fullscreen"),t.setAttribute("autoplay","false"));t instanceof HTMLMediaElement?e(t):t instanceof HTMLIFrameElement&&(t.setAttribute("allow","fullscreen"),t.setAttribute("autoplay","false"))}});o.observe(r.body,{childList:!0,subtree:!0});let n=r.createElement("meta");n.setAttribute("http-equiv","Content-Security-Policy"),n.setAttribute("content","media-src 'none'; autoplay 'none'; camera 'none'; microphone 'none'"),null==(l=r.head)||l.insertBefore(n,r.head.firstChild);let i=r.createElement("style");return i.textContent=`
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
                `,null==(a=r.head)||a.appendChild(i),()=>o.disconnect()}}catch{}}},u)})})})}}]);
//# sourceMappingURL=7686.a895a20e.js.map