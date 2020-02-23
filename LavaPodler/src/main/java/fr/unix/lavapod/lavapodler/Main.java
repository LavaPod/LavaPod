package fr.unix.lavapod.lavapodler;

import fr.unix.lavapod.lavapodler.audio.PlayersManager;
import fr.unix.lavapod.lavapodler.config.Config;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;

public class Main {
    private static final Logger logger = LoggerFactory.getLogger(Main.class);
    private Nats queue;
    private final PlayersManager playersManager;
    public static void main(String[] args) throws IOException, InterruptedException {
        new Main();
    }

    public Main() throws IOException, InterruptedException {
        logger.info("LavaPodler. A Matthieu & UniX's software. Inspired by LavaLink.");
        this.playersManager = new PlayersManager(this);
        this.queue = new Nats(new Config(), this);
    }

    private void startQueue() {

    }
    PlayersManager getPlayersManager() {
        return playersManager;
    }

    public Nats getNats() {
        return queue;
    }
}
