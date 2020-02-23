package fr.unix.lavapod.lavapodler.audio.player;

import com.sedmelluq.discord.lavaplayer.filter.equalizer.Equalizer;
import com.sedmelluq.discord.lavaplayer.filter.equalizer.EqualizerFactory;
import com.sedmelluq.discord.lavaplayer.player.AudioPlayer;
import com.sedmelluq.discord.lavaplayer.player.AudioPlayerManager;
import com.sedmelluq.discord.lavaplayer.player.DefaultAudioPlayer;
import com.sedmelluq.discord.lavaplayer.player.event.AudioEventAdapter;
import com.sedmelluq.discord.lavaplayer.track.AudioTrack;
import com.sedmelluq.discord.lavaplayer.track.AudioTrackEndReason;
import com.sedmelluq.discord.lavaplayer.track.playback.AudioFrame;
import fr.unix.lavapod.lavapodler.audio.PlayersManager;
import net.dv8tion.jda.api.audio.AudioSendHandler;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import space.npstr.magma.api.MagmaMember;
import space.npstr.magma.api.MagmaServerUpdate;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

public class Player {

    private static final Logger logger = LoggerFactory.getLogger(Player.class);

    private final PlayersManager manager;
    private final SendHandler sendHandler;
    private final EventHandler eventHandler;
    private final AudioPlayer player;
    private final MagmaMember member;
    private final Metadata metadata;


    public Player(AudioPlayer player, ScheduledExecutorService scheduler, Metadata metadata, PlayersManager manager) {

        this.sendHandler = new SendHandler(player);
        this.eventHandler = new EventHandler(scheduler, this);

        this.player = player;

        this.member = MagmaMember.builder()
                .userId(metadata.getUser())
                .guildId(metadata.getGuild())
                .build();

        this.manager = manager;
        this.metadata = metadata;
        this.player.addListener(eventHandler);
        this.manager
                .getMagmaApi()
                .setSendHandler(member, sendHandler);
    }

    public void voiceUpdate(MagmaServerUpdate update) {
        this.manager
                .getMagmaApi()
                .provideVoiceServerUpdate(member, update);
    }

    public void sendStatusUpdate() {
        String json = new JSONObject()
                .put("op", "playerUpdate")
                .put("user", this.metadata.getUser())

                .put("state",new JSONObject()
                    .put("position",this.player.getPlayingTrack().getPosition())
                    .put("time", System.currentTimeMillis())).toString();

        this.manager.getNats()
                .sendUpdate(json, this.metadata.getWebSocket());
    }

    public void play(AudioTrack track) {
        player.playTrack(track);
    }

    public void stop() {
        player.stopTrack();
    }

    public void setPaused(Boolean pause) {
        player.setPaused(pause);
    }

    public void seek(long position) {
        player.getPlayingTrack().setPosition(position);
    }

    public void setVolume(int volume) {
        player.setVolume(volume);
    }

    public PlayersManager getManager() {
        return manager;
    }

    public Metadata getMetadata() {
        return metadata;
    }
}
