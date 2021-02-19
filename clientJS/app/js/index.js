class UI {
  constructor() {
    this.lastMsg = 0;
  }

  sendMessage(missatge) {
    let self = this;
    window.api.send("MsgManager", { requestKey: "sendmsg", data: missatge });
  }

  addEventsListeners() {
    let self = this;
    // Funció que enllaça els events de la interfície amb els seus manejadors
    document.querySelector("#send").addEventListener("click", function () {
      let missatge = document.querySelector("#missatge").value;
      self.sendMessage(missatge);
      document.querySelector("#missatge").value = "";
    });

    document
      .querySelector("#missatge")
      .addEventListener("keydown", function (event) {
        // Funció per  detectar quan es prem "intro" en escriure un missatge
        if (event.keyCode == 13) {
          let missatge = document.querySelector("#missatge").value;
          self.sendMessage(missatge);
          document.querySelector("#missatge").value = "";
        }
      });

    // Temporitzador per obtindre els missatges del servidor perìòdicament

    setInterval(function () {
      window.api.send("MsgManager", {
        requestKey: "getMessages",
        data: self.lastMsg,
      });
    }, 100);

    // Temporitzadors per obtindre els usuaris periòdicament

    setInterval(function () {
      // Enviem la petició al main
      window.api.send("MsgManager", { requestKey: "getUserList", data: "" });
    }, 500);
  }

  manageRequestResponses() {
    self = this;
    window.api.receive("MsgManager", (response) => {
      let data = response.data;
      let JsonMsg = JSON.parse(data.toString());

      switch (response.requestKey) {
        case "getMessages":
          self.lastMsg = JsonMsg.lastMsg;

          for (let index in JsonMsg.missatges) {
            let msg = document.createElement("div");
            msg.className = "message";
            let msguserName = document.createElement("b");
            msguserName.innerHTML = JsonMsg.missatges[index].userName + ": ";
            let text = document.createElement("span");
            text.innerHTML = JsonMsg.missatges[index].text;
            msg.append(msguserName);
            msg.append(text);

            document.querySelector("#llistaMissatges").append(msg);
          }
          break;

        case "getUserList":
          document.querySelector("#llistaUsuaris").innerHTML = "";

          for (let index in JsonMsg.UserList) {
            let usrDiv = document.createElement("div");
            usrDiv.innerHTML = JsonMsg.UserList[index];

            document.querySelector("#llistaUsuaris").append(usrDiv);
          }
          break;
      }
    });
  } // manageRequestResponses
}

window.onload = function () {
  // Esdeveniment que es dispara en tindre el HTML carregat
  // una vegada carregat, inicialitzem tots els objectes de l'aplicació
  let WebUI = new UI();

  // I afegim els gestors dels esdeveniments
  WebUI.addEventsListeners();

  // Gestió de les respostes IPC entre aplicació i finestra
  WebUI.manageRequestResponses();
};
