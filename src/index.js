const { app, BrowserWindow } = require("electron");
// require("electron-reload")(__dirname);

const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      nodeIntegrationInWorker: true,
    },
  });

  win.loadFile(path.join(__dirname, "index.html"));
  win.webContents.openDevTools();
  // win.removeMenu();
}

app.allowRendererProcessReuse = false;

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
