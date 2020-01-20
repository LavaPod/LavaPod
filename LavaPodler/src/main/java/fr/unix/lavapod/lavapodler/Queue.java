package fr.unix.lavapod.lavapodler;

import com.rabbitmq.client.*;
import com.sedmelluq.discord.lavaplayer.track.AudioTrack;
import fr.unix.lavapod.lavapodler.audio.loader.AudioLoaderUtils;
import fr.unix.lavapod.lavapodler.config.Config;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import space.npstr.magma.api.MagmaMember;
import space.npstr.magma.api.MagmaServerUpdate;
import sun.reflect.generics.reflectiveObjects.NotImplementedException;

import java.io.IOException;
import java.util.concurrent.TimeoutException;

public class Queue {

    private static final Logger logger = LoggerFactory.getLogger(Queue.class);

    private final Connection connection;
    private final Main main;
    private final Channel receiveChannel;
    private final Channel sendChannel;
    private final Channel rpcChannel;

    public Queue(Config config, Main main) throws IOException, TimeoutException {
        this.main = main;
        logger.info("Connecting to the queue server.");
        // Initialize the RabbitMq client.
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost(config.getHost());
        factory.setUsername(config.getUser());
        factory.setPassword(config.getPassword());
        factory.setVirtualHost("/");
        factory.setPort(config.getPort());
        logger.info("Creating channels.");
        // Create all the connection channels.
        this.connection = factory.newConnection();
        this.receiveChannel = connection.createChannel();
        this.sendChannel = connection.createChannel();
        this.rpcChannel = connection.createChannel();

        // Some rpc settings.
        this.rpcChannel.basicQos(3);
        logger.info("Creating queues.");
        // Register the RPC ( server side )
        this.rpcChannel.queueDeclare("rpc_lavapodler",true,false,false,null);
        this.rpcChannel.basicConsume("rpc_lavapodler", false, (me, message) -> handleRpc(message), (consumerTag -> {}));
        logger.info("Queue loading successfully finished.");
    }


    private void handleRpc(Delivery message) throws IOException {
        // Used to complete the RPC.


        // Get the message from the message's bytes.
        String s = new String(message.getBody());

        JSONObject jsonObject = new JSONObject(s);
        String opCode = jsonObject.getString("call");

        // Called by the RestAPI. Used to load songs from different sources ( eg. Http, YouTube, SoundCloud )
        if (opCode.equalsIgnoreCase("loadTracks")) {
            main.getPlayersManager().audioLoader.loadTracks(jsonObject.getString("identifier"))
                    .thenAccept((track) -> completeDelivery(message, AudioLoaderUtils.loadResultToJson(track, main.getPlayersManager().getPlayerManager()).toString()));
            return;
        }
        // Used to decode a track's hash via the rest api.
        if (opCode.equalsIgnoreCase("decodeTrack")) {
            String track = jsonObject.getString("descriptor");
            AudioTrack track1 = AudioLoaderUtils.toAudioTrack(this.main.getPlayersManager().getPlayerManager(), track);
            completeDelivery(message, AudioLoaderUtils.trackToJson(track1).toString());
            return;
        }
        // Decode an array of tracks.
        if (opCode.equalsIgnoreCase("decodeTracks")) {
            JSONArray requestJSON = jsonObject.getJSONArray("descriptor");
            JSONArray responseJSON = new JSONArray();
            for (int i = 0; i < requestJSON.length(); i++) {
                String track = requestJSON.getString(i);
                AudioTrack audioTrack = AudioLoaderUtils.toAudioTrack(this.main.getPlayersManager().getPlayerManager(), track);
                JSONObject infoJSON = AudioLoaderUtils.trackToJson(audioTrack);
                JSONObject trackJSON = new JSONObject()
                        .put("track", track)
                        .put("info", infoJSON);
                responseJSON.put(trackJSON);
            }
        }
    }

    private void completeDelivery(Delivery message, String object) {
        AMQP.BasicProperties relyProps = new AMQP.BasicProperties.Builder()
                .correlationId(message.getProperties().getCorrelationId())
                .build();
        try {
            this.rpcChannel.basicPublish("", message.getProperties().getReplyTo(), relyProps, object.getBytes());
            this.rpcChannel.basicAck(message.getEnvelope().getDeliveryTag(), false);
            logger.info("Completed delivery {}",relyProps.getClusterId());
        } catch (IOException e) {
            logger.error(String.format("Delivery {} failed",relyProps.getCorrelationId()),e);
        }
    }


    public class WebSocketHandler extends DefaultConsumer {

        private final Queue queue;

        /**
         * Constructs a new instance and records its association to the passed-in channel.
         *
         * @param channel the channel to which this consumer is attached
         */
        public WebSocketHandler(Channel channel, Queue queue) {
            super(channel);
            this.queue = queue;
        }

        /**
         * @param consumerTag
         * @param envelope
         * @param properties
         * @param body
         * @throws IOException
         */
        @Override
        public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
            try {
                String json = new String(body);
                JSONObject jsonObject = new JSONObject(json);
                String op = jsonObject.getString("op");
                if (op.equalsIgnoreCase("play")) {

                    // This payload :
                    // {
                    //  "guildId": <string>,
                    //  "track": <string>,
                    //  "userId": <string>
                    // }
                    queue.main.getPlayersManager().getContextFromGuild(jsonObject.getString("guildId"))
                            .play(AudioLoaderUtils.toAudioTrack(queue.main.getPlayersManager().getPlayerManager(), jsonObject.getString("track")));
                    this.getChannel().basicAck(envelope.getDeliveryTag(), false);
                }
                if (op.equalsIgnoreCase("band")) {
                    // TODO Need to implement this
                    this.getChannel().basicAck(envelope.getDeliveryTag(), false);
                    throw new NotImplementedException();
                }
                if (op.equalsIgnoreCase("volume")) {
                    queue.main.getPlayersManager().getContextFromGuild(jsonObject.getString("guildId")).setVolume(jsonObject.getInt("volume"));
                    this.getChannel().basicAck(envelope.getDeliveryTag(), false);
                }
                if (op.equalsIgnoreCase("seek")) {
                    queue.main.getPlayersManager().getContextFromGuild(jsonObject.getString("guildId")).seekTo(jsonObject.getLong("position"));
                    this.getChannel().basicAck(envelope.getDeliveryTag(), false);
                }
                if (op.equalsIgnoreCase("pause")) {
                    queue.main.getPlayersManager().getContextFromGuild(jsonObject.getString("guildId")).setPause(jsonObject.getBoolean("pause"));
                    this.getChannel().basicAck(envelope.getDeliveryTag(), false);
                }
                if (op.equalsIgnoreCase("stop")) {
                    queue.main.getPlayersManager().getContextFromGuild(jsonObject.getString("guildId")).stop();
                    this.getChannel().basicAck(envelope.getDeliveryTag(), false);
                }
                // This is used to describe an update from the bot.
                if (op.equalsIgnoreCase("voiceUpdate")) {

                    JSONObject event = jsonObject.getJSONObject("event");
                    String guildId = jsonObject.getString("guildId");

                    MagmaServerUpdate update = MagmaServerUpdate.builder()
                            .endpoint(event.getString("endpoint"))
                            .sessionId(jsonObject.getString("sessionId"))
                            .token(event.getString("token")).build();
                    MagmaMember member = MagmaMember.builder()
                            .guildId(guildId)
                            .userId(jsonObject.getString("userId"))
                            .build();
                    queue.main.getPlayersManager().getMagmaApi().provideVoiceServerUpdate(member, update);
                    queue.main.getPlayersManager().getMagmaApi().setSendHandler(member, queue.main.getPlayersManager().getContextFromGuild(guildId));
                }
            } catch (Exception e) {
                e.printStackTrace();
            }

        }
    }
}