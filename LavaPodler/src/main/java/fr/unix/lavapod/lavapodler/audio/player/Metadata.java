package fr.unix.lavapod.lavapodler.audio.player;

public class Metadata {

    private String guild;
    private String user;
    private String webSocket;

    public String getGuild() {
        return guild;
    }

    public String getUser() {
        return user;
    }

    public String getWebSocket() {
        return webSocket;
    }

    Metadata(String guild, String user, String webSocket) {
        this.guild = guild;
        this.user = user;
        this.webSocket = webSocket;
    }
}

