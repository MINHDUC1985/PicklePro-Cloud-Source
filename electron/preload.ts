// import { ipcRenderer } from 'electron';

// Bạn có thể expose API ra cho renderer qua `contextBridge` ở đây nếu set `contextIsolation: true` ở main.ts
window.addEventListener('DOMContentLoaded', () => {
    console.log('Preload script loaded.');
});
