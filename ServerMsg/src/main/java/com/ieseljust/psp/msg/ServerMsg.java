package com.ieseljust.psp.msg;

import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.ArrayList;
/**
 * Classe servidor de missatges: s'encarregarà d'atendre les peticions dels
 * clients.
 */
public class ServerMsg {

    private ArrayList<Missatge> Missatges;
    private ArrayList<String> Usuaris;

    ServerMsg() {
        Missatges = new ArrayList<>();
        Usuaris = new ArrayList<>();
    }

    /**
     * Mètode que escolta les peticions pel port indicat bé com a argument, o per port per defecte
     * @param srvPort port per on escoltar les peticions
     * @throws IOException
     */
    public void listen(int srvPort) throws IOException {
        System.out.println("[ServerMsg] Iniciant el servidor...");
        ServerSocket listener;

        try {
            listener = new ServerSocket(srvPort);
        } catch (IOException e) {
            System.out.println("[ServerMsg] El port " + srvPort + " està ocupat o es inaccessible.");
            return;
        }

        while(true) {
            Socket socket = listener.accept();

            MsgManager manager = new MsgManager(socket, Missatges, Usuaris);
            Thread filManager = new Thread(manager);
            filManager.start();
        }
    }

    public static void main(String[] args) throws IOException {
        int srvPort = 9999;

        if (args.length == 1)
            srvPort = Integer.parseInt(args[0]);

        ServerMsg sm = new ServerMsg();
        sm.listen(srvPort);

    }
}
