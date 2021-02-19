package com.ieseljust.psp.msg;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.*;
import java.net.Socket;
import java.util.ArrayList;

/**
 * Classe per atendre les peticions a través de threads
 * @author Artur Badenes Puig
 */
class MsgManager implements Runnable {
    private final Socket mySocket;
    private final ArrayList<Missatge> missatges;
    private final ArrayList<String> usuaris;

    /**
     * Constructor de la classe. S'inicia amb un socket i una llista de missatges.
     * @param socket socker per on comuniquem.
     * @param Msgs llista de missatges del server.
     * @param users llista de usuaris del server.
     */
    MsgManager(Socket socket, ArrayList<Missatge> Msgs, ArrayList<String> users) {
        // Aquesta llista de missatges només podrà ser modificada
        // per un fil en la seua secció crítica
        mySocket = socket; // Socket pel qual s'atén la petició
        missatges = Msgs; // Llista de missatges (objecte compartit)
        usuaris = users; // Llista d'usuaris (objecte compartit)
    }

    /**
     * Mètode que retorna un objecte JSON amb un JSONArray amb la llista de missatges
     * @param lastMsg index a partir del qual retornem els missatges
     * @return La llista de missatges amb format:
     * {"lastMsg": index_ultim_missatge, "missatges": [{llista_de_missatges}] }
     */
    JSONObject getMessagesFrom(int lastMsg) {
        JSONObject infoMissatgesJson = new JSONObject();
        JSONArray llistaMissatges = new JSONArray();

        for (int i = lastMsg; i < missatges.size(); i++) {
            llistaMissatges.put(missatges.get(i).getAsJson());
        }
        infoMissatgesJson.put("lastMsg", missatges.size());
        infoMissatgesJson.put("missatges", llistaMissatges);
        // System.out.println("[artur] " + infoMissatgesJson.toString());

        return infoMissatgesJson;
    }

    /**
     * Afegirà l'usuari indicat a la llista d'usuaris
     * @param missatge un JSON amb el format: {"command": "register", "user": NomUsuariActual}
     * @return Si tot va bé, retorna un missatge d'estat Ok: {"status", "ok"}
     */
    JSONObject registerUser(JSONObject missatge) {
        this.usuaris.add(missatge.getString("user"));
        return new JSONObject().put("status", "ok");
    }

    /**
     * Elimina l'usuari indicat  de la llista d'usuaris
     *
     * @param Usuari usuari a eliminar
     * @return Si tot va bé, retorna un missatge d'estat Ok: {"status", "ok"}
     */
    JSONObject unregisterUser(JSONObject Usuari) {
        String user = Usuari.getString("user");

        for (int i = 0; i < this.usuaris.size(); i++)
            if (this.usuaris.get(i).equals(user)) {
                this.usuaris.remove(i);
                return new JSONObject().put("status", "ok");
            }
        return null;
    }

    /**
     * Retorna un objecte JSON amb un JSONArray amb la llista d'usuaris connectats.
     *
     * @return Retorna un objecte JSON amb un JSONArray amb la llista d'usuaris connectats en format json
     */
    JSONObject getUserList() {
        JSONObject llistaUsuaris = new JSONObject();
        JSONArray llistaJson = new JSONArray(this.usuaris);
        llistaUsuaris.put("UserList", llistaJson);

        return llistaUsuaris;
    }

    /**
     * Afegim el missatge d'usuari a la llista de missatges
     *
     * @param MissatgeRebut JSON amb la forma {"userName": "Nom_de_l'usuari", "text":"Text_del_missatge"};
     * @return Si tot va bé, retorna un missatge d'estat Ok: {"status", "ok"}
     */
    JSONObject addMessage(JSONObject MissatgeRebut) {
        String usuari = MissatgeRebut.getString("user");
        String text = MissatgeRebut.getString("text");
        Missatge missatge = new Missatge(usuari, text);
        synchronized (this.missatges) {
            this.missatges.add(missatge);
        }


        return new JSONObject().put("status", "ok");
    }

    /**
     * Aquest mètode és el que s'encarregarà d'atendre cada petició i generar la resposta adequada.
     */
    @Override
    public void run() {
        try {
            // 1. Llegirem les línies a través de l'InputStream del socket amb què s'ha
            // obert la connexió (només s'ens passarà una línia per petició).
            InputStream is = mySocket.getInputStream();
            OutputStream os = mySocket.getOutputStream();

            InputStreamReader isr = new InputStreamReader(is);
            OutputStreamWriter osw = new OutputStreamWriter(os);

            BufferedReader bufferedReader = new BufferedReader(isr);
            PrintWriter printWriter = new PrintWriter(osw);

            // Una vegada tinguem la línia llegida, caldrà convertir-la a objecte JSON
            JSONObject missatgeRebut = new JSONObject(bufferedReader.readLine());

            // Obtenim l'ordre (camp "command") del JSON per tal d'obtindre què ens demana el client
            String command = missatgeRebut.getString("command");

            JSONObject resposta = null;
            switch (command) {
                case "register":
                    resposta = registerUser(missatgeRebut);
                    break;
                case "unregister":
                    resposta = unregisterUser(missatgeRebut);
                    break;
                case "getUserList":
                    resposta = getUserList();
                    break;
                case "add":
                    resposta = addMessage(missatgeRebut);
                    break;
                case "getMsgs":
                    resposta = getMessagesFrom(missatgeRebut.getInt("lastMsg"));
                    break;
                default:
                    System.out.println("[MsgManager] No es reconeix el missatge");
                    break;
            }
            // Cada petició haurà de generar la resposta corresponent, en format JSON, i
            // enviar-la, codificada en un string al client a través del socket.

            if (resposta != null) {
                printWriter.write(resposta.toString());
            } else {
                printWriter.write("[MsgManager] Error de conexio al enviar la resposta!");
            }
            printWriter.flush();
            printWriter.close();
            bufferedReader.close();
            osw.close();
            os.close();
            isr.close();
            is.close();

        } catch (Exception e) {
            System.out.println("[MsgManager] Error: " + e.getMessage() );
            e.printStackTrace();
        }

    }
}