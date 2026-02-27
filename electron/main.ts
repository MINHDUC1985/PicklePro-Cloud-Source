import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, '..');

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

import { startServer } from '../server.js'; // Use .js extension or dynamic import for Vite building compatibility

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'), // preload script
      nodeIntegration: true,
      contextIsolation: false,
    },
    width: 1200,
    height: 800,
  });

  // Tắt thanh menu mặc định
  win.setMenuBarVisibility(false);

  // Mở dev tools nếu cần thiết để trace lỗi
  // win.webContents.openDevTools();

  // Load UI from server
  if (!VITE_DEV_SERVER_URL) {
    // Trường hợp Production (Build EXE)
    // Đợi server chạy rồi nhận Port
    startServer(0).then((port) => {
      win?.loadURL(`http://127.0.0.1:${port}`);
    }).catch(e => {
      console.error("Lỗi khởi tạo Server ngầm:", e);
    });
  } else {
    // Trường hợp Development
    setTimeout(() => {
      win?.loadURL(VITE_DEV_SERVER_URL);
    }, 1500);
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.whenReady().then(createWindow);
