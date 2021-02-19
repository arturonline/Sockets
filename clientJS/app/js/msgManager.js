const net = require("net");

class msgManager {
  constructor(connexio) {
    this.connexio = connexio;
  }
  /**
   * Métode suggerit per enviar de forma genérica missatges
   * al servidor
   * @param {*} dataJSON El misstge en format JSON
   * @param {*} callbackMsg El callback que s'haurà d'invocar si cal gestionar una resposta.
   */
  sendToServer(dataJSON, callbackMsg) {
    var client = net.connect(
      { port: this.connexio.port, host: this.connexio.server },
      () => {
        client.write(dataJSON +'\r\n');
      }
    );

    client.on("data", function (data) {
      if(callbackMsg == null) {
        return;
      }
      callbackMsg(data);
      client.end;
    });
  }

  /**
   * Envia un missatge de l'usuari al xat:
   * @param {*} message { "command": "add", "userName": self.connexio.username, "text": message };
   */
  sendMsg(message) {
    let msg = {
      command: "add",
      user: this.connexio.username,
      text: message,
    };

    this.sendToServer(JSON.stringify(msg));
  }

  /**
   * Obté la llista de missatges del servidor envian
   * missatge en format { "command": "getMsgs", "lastMsg": index };
   * @param {*} index el index del ultim missatge
   * @param {*} callback funcio que dira que fer quant es tinguen els resultats
   */
  getMessagesFromServer(index, callback) {
    let msg = {
      command: "getMsgs",
      lastMsg: index,
    };
    this.sendToServer(JSON.stringify(msg), callback);
  }

  /**
   * Obté la llista d'usuaris del servidor
   * { "command": "getUserList" };
   * @param {*} callback
   */
  getUserListFromServer(callback) {
    let msg = {
      command: "getUserList",
    };
    this.sendToServer(JSON.stringify(msg), callback);
  }

  /**
   * Registra l'usuari al xat
   * { "command": "register", "user": user };
   * @param {*} user usuari que registrarem
   */
  registerUser(user) {
    let msg = {
      command: "register",
      user: user,
    };
    this.sendToServer(JSON.stringify(msg));
  }

  /**
   * Borra l'usuari al xat
   * { "command": "unregister", "user": user };
   * @param {*} user usuari que borrarem
   */
  unregisterUser(user) {
    let msg = {
      command: "unregister",
      user: user,
    };
    this.sendToServer(JSON.stringify(msg));
  }
}

module.exports.msgManager = msgManager;
