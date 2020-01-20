package fr.unix.lavapod.lavapodler.config;

/**
 * The config of this lavapodler
 */
public class Config {
    private String host = "localhost"; // Localhost by default ( development environment )
    private int port = 5672; // -1 Means the RabbitMQ default port.

    private String user = "guest"; // Guest by default ( development environment )
    private String password = "guest"; // guest by default ( development environment )

    public Config(String host, int port, String user, String password) {
        this.host = host;
        this.port = port;
        this.user = user;
        this.password = password;
    }
    public Config() {}

    public String getHost() {
        return host;
    }

    public int getPort() {
        return port;
    }

    public String getUser() {
        return user;
    }

    public String getPassword() {
        return password;
    }
    public static Config loadConfig() {
        return new Config();
    }
    public static Config loadConfigFromEnv() {
        return new Config(System.getenv("LAVA_HOST"),Integer.parseInt(System.getenv("LAVA_PORT")),System.getenv("LAVA_USER"),System.getenv("LAVA_PASSWORD"));
    }
}
