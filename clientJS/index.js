// Carreguem la llibreria electron
// app: Per controlar el cicle de vida de l'aplicació
// BrowserWindow: Per controlar la finestra de l'aplicació
const { app, BrowserWindow } = require("electron");

// Carreguem la llibreria ipcMain per poder comunicar-nos amb el procés
// renderer (els jse la finestra)
const { ipcMain } = require("electron");

// Importem la nostra llibreria de gestió de missatges
const { msgManager } = require("./app/js/msgManager.js");

// Cal crear una referència global a l'objecte finestra, ja que si no,
// l'aplicació es tancaría quan passara el recol·lector de fem.
let mainWindow;

// Dades de connexió
let connexio = {
  username: "JSAnonim",
  server: "127.0.0.1",
  port: 9999,
};

if (process.argv.length >= 3) connexio.username = process.argv[2];
if (process.argv.length >= 4) connexio.server = process.argv[3];
if (process.argv.length >= 5) connexio.port = process.argv[4];

function createWindow() {
  // Crea la finestra del navegador
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true, // protect against prototype pollution
      enableRemoteModule: false, // turn off remote
      preload: __dirname + "/preload.js",
    },
  });

  mainWindow.setMenu(null);

  //I carreguem en ella l'índex de la pàgina
  mainWindow.loadFile("app/index.html");

  // Si volem obrir les devtools en la mateixa finestra, faríem:
  // mainWindow.webContents.openDevTools();

  // I per obrir-les en una finestra a banda: (segons l'ordre en què s'haja indicat debut)
  if (
    (process.argv.length === 3 && process.argv[2] === "debug") || // Sense paràmetres
    (process.argv.length === 4 && process.argv[3] === "debug") || // Indicant nom d'usuari
    (process.argv.length === 5 && process.argv[4] === "debug") || // Indicant nom d'usuari i IP
    (process.argv.length === 6 && process.argv[5] === "debug")
  ) {
    // Indicant també port
    devtools = new BrowserWindow();
    mainWindow.webContents.setDevToolsWebContents(devtools.webContents);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  /* Gestió d'events de la finestra */

  // Detectem l'event de tancar la finestra principal
  mainWindow.on("closed", function () {
    mainWindow = null;
  });
}

/* Gestió d'events de l'aplicació */

// Detectem l'event d'inicialització d'electron
// Quan estiga inicialitzat, podrem accedir a les seues APIs i
// crear la finestra principal.
app.on("ready", function () {
  createWindow();
});

// Quit when all windows are closed.
app.on("window-all-closed", function () {
  msgMan.unregisterUser(connexio.username);

  // Ajustos per a mac

  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// Creem un nou objecte msgManager amb la connexió
msgMan = new msgManager(connexio);

// Registrem l'usuaris
msgMan.registerUser(connexio.username);

// Gestió d'esdeveniments per comunicar-nos amb la finestra

ipcMain.on("MsgManager", (event, args) => {
  switch (args.requestKey) {
    case "sendmsg":
      msgMan.sendMsg(args.data, null);
      break;

    case "getMessages":
      // L'últim missatge a partir del qual ens demanen missatges
      // es troba en data:
      let lastMsg = args.data;
      msgMan.getMessagesFromServer(lastMsg, function (messages) {
        // users ens ve com a una llista de bytes
        // Utilitzarem el mètode .toString per veure-ho com a string.
        mainWindow.webContents.send("MsgManager", {
          requestKey: "getMessages",
          data: messages.toString(),
        });
      });
      break;

    case "getUserList":
      msgMan.getUserListFromServer(function (users) {
        // users ens ve com a una llista de bytes
        // Utilitzarem el mètode .toString per veure-ho com a string.
        mainWindow.webContents.send("MsgManager", {
          requestKey: "getUserList",
          data: users.toString(),
        });
      });
      break;
  }
});
