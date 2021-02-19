package com.ieseljust.psp.msg;

import org.json.JSONObject;

/**
 *
 * @author Artur Badenes Puig
 */
public class Missatge {
    private String userName;
    private String text;

    public Missatge() {

    }

    public Missatge(String userName, String text) {
        this.userName = userName;
        this.text = text;
    }

    public void setuserName(String userName) {
        this.userName = userName;
    }

    public void setText(String text) {
        this.text = text;
    }

    public JSONObject getAsJson() {
        JSONObject missatge = new JSONObject();
        missatge.put("userName", this.userName);
        missatge.put("text", this.text);

        return missatge;
    }

    public String getText() {
        return this.userName + ":" + this.text;
    }

}
