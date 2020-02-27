package fr.unix.lavapod.lavapodler;

import com.sedmelluq.discord.lavaplayer.track.AudioTrack;
import fr.unix.lavapod.lavapodler.audio.loader.AudioLoaderUtils;
import fr.unix.lavapod.lavapodler.audio.player.Player;
import fr.unix.lavapod.lavapodler.config.Config;
import io.nats.client.*;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import space.npstr.magma.api.MagmaServerUpdate;

import java.io.IOException;

public class Nats implements ConnectionListener {

    private static final Logger logger = LoggerFactory.getLogger(Nats.class);

    private final Connection connection ;
    private final Main main;
    private final Dispatcher dispatcher;
    private final String inbox;

    public Nats(Config config, Main main) throws IOException, InterruptedException {
        this.main = main;
        this.connection = io.nats.client.Nats.connect(new Options.Builder()
                .server(System.getenv("NATS"))
                .connectionListener(this)
                .build());

        this.dispatcher = this.connection.createDispatcher((message) -> {});
        this.dispatcher.subscribe("attribution.lavapodler", "attribution.lavapodler", this::handleAttribution);
        this.inbox = this.connection.createInbox();
        this.dispatcher.subscribe(inbox, this::inbox);
    }

    private void inbox(Message message) {
        JSONObject payload;
        try {
            payload = new JSONObject(new String(message.getData()));
        }catch (Exception e) {
            logger.info("Error from request.");
            return;
        }

        String op = payload.getString("op");

        if(op.equalsIgnoreCase("voiceUpdate")) {
            String guild = payload.getString("guild");
            Player player = this.main.getPlayersManager().getContext(guild);
            if(player != null) {
                player.voiceUpdate(MagmaServerUpdate.builder().endpoint(payload.getString("endpoint")).token(payload.getString("token")).sessionId(payload.getString("session")).build());
            }
        } else if(op.equalsIgnoreCase("play")) {
            String guild = payload.getString("guild");
            String track = payload.getString("track");


            if (payload.has("startTime")) {

            }
            if(payload.has("endTime")) {

            }
            if(payload.has("noReplace")) {

            }
            try {
                AudioTrack t = AudioLoaderUtils.toAudioTrack(this.main.getPlayersManager().getPlayerManager(),track);
                Player player = this.main.getPlayersManager().getContext(guild);
                if(player != null) {
                    player.play(t);
                }
            } catch (IOException e) {
                e.printStackTrace();
            }


        } else if(op.equalsIgnoreCase("stop")){
            String guild = payload.getString("guild");
            Player player = this.main.getPlayersManager().getContext(guild);
            if(player != null) {
                player.stop();
            }
        } else if(op.equalsIgnoreCase("pause")) {
            String guild = payload.getString("guild");
            Boolean pause = payload.getBoolean("pause");
            Player player = this.main.getPlayersManager().getContext(guild);
            if(player != null) {

                player.setPaused(pause);
            }
        } else if(op.equalsIgnoreCase("seek")) {
            String guild = payload.getString("guild");
            long position = payload.getLong("position");
            Player player = this.main.getPlayersManager().getContext(guild);
            if(player != null) {
                player.seek(position);
            }
        } else if(op.equalsIgnoreCase("volume")) {
            String guild = payload.getString("guild");
            int volume = payload.getInt("volume");
            Player player = this.main.getPlayersManager().getContext(guild);
            if(player != null) {
                player.setVolume(volume);
            }
        } else if(op.equalsIgnoreCase("destroy")) {
        }

    }

    private void handleAttribution(Message message) {
        JSONObject payload;
        try {
            payload = new JSONObject(new String(message.getData()));
        }catch (Exception e) {
            logger.info("Error from request.");
            return;
        }

        // Create the player
        Player player =  this.main.getPlayersManager()
                .getContextInit(payload.getString("guild"),payload.getString("user"), payload.getString("inbox"));

        player.voiceUpdate(MagmaServerUpdate.builder().endpoint(payload.getString("endpoint")).sessionId(payload.getString("session")).token(payload.getString("token")).build());

        this.connection.publish(message.getReplyTo(), new JSONObject()
                .put("op", "attributionAck")
                .put("trace", message.getSID())
                .put("host", inbox)
                .toString()
                .getBytes());
    }


    @Override
    public void connectionEvent(Connection conn, Events type) {
        switch (type) {
            case CONNECTED:
                logger.info("Connected to the NATS Server.");
            case CLOSED:
                logger.info("Disconnected from the NATS Server.");
        }
    }


    public void sendUpdate(String payload, String player) {
        this.connection.publish(player, payload.getBytes());
    }
}