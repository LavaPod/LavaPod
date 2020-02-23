package fr.unix.lavapod.lavapodler.audio.player;

import com.sedmelluq.discord.lavaplayer.player.AudioPlayer;
import com.sedmelluq.discord.lavaplayer.player.event.AudioEventAdapter;
import com.sedmelluq.discord.lavaplayer.tools.FriendlyException;
import com.sedmelluq.discord.lavaplayer.track.AudioTrack;
import com.sedmelluq.discord.lavaplayer.track.AudioTrackEndReason;
import fr.unix.lavapod.lavapodler.audio.loader.AudioLoaderUtils;
import org.json.JSONObject;

import java.io.IOException;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

public class EventHandler extends AudioEventAdapter {

    private final Player player;
    private ScheduledFuture myFuture = null;
    private final ScheduledExecutorService scheduler;


    public EventHandler(ScheduledExecutorService executorService, Player player) {
        scheduler = executorService;
        this.player = player;
    }

    @Override
    public void onTrackEnd(AudioPlayer player, AudioTrack track, AudioTrackEndReason endReason) {
        JSONObject out = new JSONObject();
        out.put("op", "event");
        out.put("type", "TrackEndEvent");
        out.put("user", this.player.getMetadata().getUser());
        out.put("guildId", this.player.getMetadata().getGuild());
        try {
            out.put("track", AudioLoaderUtils.toMessage(this.player.getManager().getPlayerManager(), track));
        } catch (IOException e) {
            out.put("track", JSONObject.NULL);
        }

        out.put("reason", endReason.toString());

        this.player.getManager().getNats().sendUpdate(out.toString(), this.player.getMetadata().getWebSocket());

        myFuture.cancel(false);
    }

    @Override
    public void onTrackException(AudioPlayer player, AudioTrack track, FriendlyException exception) {
        JSONObject out = new JSONObject();
        out.put("op", "event");
        out.put("type", "TrackExceptionEvent");
        out.put("guildId", this.player.getMetadata().getGuild());
        out.put("user", this.player.getMetadata().getUser());
        try {
            out.put("track", AudioLoaderUtils.toMessage(this.player.getManager().getPlayerManager(), track));
        } catch (IOException e) {
            out.put("track", JSONObject.NULL);
        }

        out.put("error", exception.getMessage());
        this.player.getManager().getNats().sendUpdate(out.toString(), this.player.getMetadata().getWebSocket());
        super.onTrackException(player, track, exception);
    }

    @Override
    public void onTrackStuck(AudioPlayer player, AudioTrack track, long thresholdMs) {
        JSONObject out = new JSONObject();
        out.put("op", "event");
        out.put("type", "TrackStuckEvent");
        out.put("guildId", this.player.getMetadata());
        out.put("user", this.player.getMetadata().getUser());
        try {
            out.put("track", AudioLoaderUtils.toMessage(this.player.getManager().getPlayerManager(), track));
        } catch (IOException e) {
            out.put("track", JSONObject.NULL);
        }

        out.put("thresholdMs", thresholdMs);

        this.player.getManager().getNats().sendUpdate(out.toString(), this.player.getMetadata().getWebSocket());
        this.player.sendStatusUpdate();
    }

    @Override
    public void onTrackStart(AudioPlayer player, AudioTrack track) {
        if (myFuture == null || myFuture.isCancelled()) {
            myFuture = scheduler.scheduleAtFixedRate(this.player::sendStatusUpdate, 0, 5, TimeUnit.SECONDS);
        }
    }
}
