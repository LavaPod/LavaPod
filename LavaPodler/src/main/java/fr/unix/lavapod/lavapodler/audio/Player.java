package fr.unix.lavapod.lavapodler.audio;

import com.sedmelluq.discord.lavaplayer.filter.equalizer.Equalizer;
import com.sedmelluq.discord.lavaplayer.filter.equalizer.EqualizerFactory;
import com.sedmelluq.discord.lavaplayer.player.AudioPlayer;
import com.sedmelluq.discord.lavaplayer.player.AudioPlayerManager;
import com.sedmelluq.discord.lavaplayer.player.event.AudioEventAdapter;
import com.sedmelluq.discord.lavaplayer.track.AudioTrack;
import com.sedmelluq.discord.lavaplayer.track.AudioTrackEndReason;
import com.sedmelluq.discord.lavaplayer.track.playback.AudioFrame;
import net.dv8tion.jda.api.audio.AudioSendHandler;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

public class Player extends AudioEventAdapter implements AudioSendHandler {

    private final ScheduledExecutorService schedule;
    private final PlayersManager playersManager;
    private final String playerId;
    private final String channeltoSend;
    private String guild;
    private AudioPlayer player;
    private AudioFrame lastFrame = null;
    private EqualizerFactory equalizerFactory = new EqualizerFactory();
    private static final Logger logger = LoggerFactory.getLogger(Player.class);
    private ScheduledFuture myFuture = null;
    private boolean isEqualizerApplied = false;

    public Player(String guild, AudioPlayerManager playerManager, ScheduledExecutorService scheduledExecutorService,PlayersManager pm,String playerId,String channeltoSend) {
        this.guild = guild;
        this.playerId = playerId;
        this.channeltoSend = channeltoSend;
        this.player = playerManager.createPlayer();
        this.schedule = scheduledExecutorService;
        this.player.addListener(this);
        this.playersManager = pm;
    }

    public void play(AudioTrack track) {
        player.playTrack(track);
    }

    public void stop() {
        player.stopTrack();
    }

    public boolean setPause(boolean paused) {
        player.setPaused(paused);
        return paused;
    }

    public AudioTrack getPlayingTrack() {
        return player.getPlayingTrack();
    }

    public String getGuild() {
        return guild;
    }

    public boolean isPaused() {
        return player.isPaused();
    }

    public boolean isPlaying() {
        return player.getPlayingTrack() != null && !player.isPaused();
    }

    public void seekTo(long position) {
        AudioTrack track = player.getPlayingTrack();
        if (track == null) throw new RuntimeException("Can't seek when not playing anything");
        track.setPosition(position);
    }

    public void setVolume(int volume) {
        player.setVolume(volume);
    }

    public void setBandGain(int band, float gain) {
        equalizerFactory.setGain(band, gain);

        if (gain == 0.0f) {
            if (!isEqualizerApplied) {
                return;
            }

            boolean shouldDisable = true;

            for (int i = 0; i < Equalizer.BAND_COUNT; i++) {
                if (equalizerFactory.getGain(i) != 0.0f) {
                    shouldDisable = false;
                }
            }

            if (shouldDisable) {
                this.player.setFilterFactory(null);
                this.isEqualizerApplied = false;
            }
        } else if (!this.isEqualizerApplied) {
            this.player.setFilterFactory(equalizerFactory);
            this.isEqualizerApplied = true;
        }
    }

    public JSONObject getState() {
        JSONObject json = new JSONObject();
        if (player.getPlayingTrack() != null)
            json.put("position", player.getPlayingTrack().getPosition());
        json.put("time", System.currentTimeMillis());
        return json;
    }


    @Override
    public void onTrackEnd(AudioPlayer player, AudioTrack track, AudioTrackEndReason endReason) {
        myFuture.cancel(false);
    }

    @Override
    public void onTrackStart(AudioPlayer player, AudioTrack track) {
        if (myFuture == null || myFuture.isCancelled()) {
            myFuture = schedule.scheduleAtFixedRate(() -> {
                try {
                    sendUpdate();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }, 0, 5, TimeUnit.SECONDS);
        }
    }

    @Override
    public boolean canProvide() {
        lastFrame = player.provide();
        return lastFrame != null;
    }

    @Override
    public ByteBuffer provide20MsAudio() {
        return ByteBuffer.wrap(lastFrame.getData());
    }

    @Override
    public boolean isOpus() {
        return true;
    }

    private void sendUpdate() throws IOException {
        logger.info(getState()
                .put("player",playerId).toString());
    }
}
