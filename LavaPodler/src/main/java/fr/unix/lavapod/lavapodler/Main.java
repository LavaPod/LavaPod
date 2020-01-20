package fr.unix.lavapod.lavapodler;

import fr.unix.lavapod.lavapodler.audio.PlayersManager;
import fr.unix.lavapod.lavapodler.config.Config;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.concurrent.TimeoutException;

public class Main {
    private static final Logger logger = LoggerFactory.getLogger(Main.class);
    private Queue queue;
    private final PlayersManager playersManager;
    public static void main(String[] args) {
        new Main();
    }

    public Main() {
        logger.info("LavaPodler. A Matthieu & UniX's software. Inspired by LavaLink.");
        this.playersManager = new PlayersManager(this);
        new Thread(this::startQueue).start();
    }

    private void startQueue() {
        try {
            if(System.getenv("DOCKER") != null) {
                this.queue = new Queue(Config.loadConfigFromEnv(),this);
                logger.info("Queue loaded from the environment variables.");
                return;
            } else this.queue = new Queue(Config.loadConfig(),this);
            logger.info("Default config loaded. ( Used in development environment )");
            
        } catch (IOException | TimeoutException e) {
            // Kill the instance to avoid disconnected instances.
            e.printStackTrace();
            System.exit(-500);
        }
    }
    PlayersManager getPlayersManager() {
        return playersManager;
    }
}
