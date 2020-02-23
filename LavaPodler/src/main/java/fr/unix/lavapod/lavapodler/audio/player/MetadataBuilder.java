package fr.unix.lavapod.lavapodler.audio.player;

public class MetadataBuilder {
    private String guild;
    private String user;
    private String webSocket;

    public String getGuild() {
        return guild;
    }

    public MetadataBuilder setGuild(String guild) {
        this.guild = guild;
        return this;
    }

    public String getUser() {
        return user;
    }

    public MetadataBuilder setUser(String user) {
        this.user = user;
        return this;
    }

    public String getWebSocket() {
        return webSocket;
    }

    public MetadataBuilder setWebSocket(String webSocket) {
        this.webSocket = webSocket;
        return this;
    }
    public Metadata build() {
        return new Metadata(this.guild,this.user, this.webSocket);
    }
}
