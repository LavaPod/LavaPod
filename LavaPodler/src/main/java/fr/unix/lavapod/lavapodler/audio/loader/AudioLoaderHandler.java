package fr.unix.lavapod.lavapodler.audio.loader;

import com.sedmelluq.discord.lavaplayer.player.AudioLoadResultHandler;
import com.sedmelluq.discord.lavaplayer.player.AudioPlayerManager;
import com.sedmelluq.discord.lavaplayer.tools.FriendlyException;
import com.sedmelluq.discord.lavaplayer.track.AudioPlaylist;
import com.sedmelluq.discord.lavaplayer.track.AudioTrack;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Used to handle the song loading and all the events/callback related to it
 */
public class AudioLoaderHandler implements AudioLoadResultHandler {
    /**
     * The default response when no song is found.
     */
    private static final LoadResult NO_MATCHES = new LoadResult(LoadResult.ResultStatus.NO_MATCHES, Collections.emptyList(),
            null, null);

    /**
     * The audioplayermanager related to this track loading
     */
    private final AudioPlayerManager audioPlayerManager;

    /**
     * The load result linked to this track loading
     */
    private final CompletableFuture<LoadResult> loadResult = new CompletableFuture<>();

    /**
     * Is this instance used currently ?
     */
    private final AtomicBoolean used = new AtomicBoolean(false);

    /**
     * This is used to handle a track loading, this is the constructor
     * @param audioPlayerManager The audioplayermanager linked to this.
     */
    AudioLoaderHandler(AudioPlayerManager audioPlayerManager) {
        this.audioPlayerManager = audioPlayerManager;
    }

    /**
     * Tell the player to load a track.
     * @param identifier The identifier of the track.
     * @return A promise returning the load result of the track.
     */
    CompletionStage<LoadResult> load(String identifier) {
        boolean isUsed = this.used.getAndSet(true);
        if (isUsed) {
            throw new IllegalStateException("This loader can only be used once per instance");
        }
        this.audioPlayerManager.loadItem(identifier, this);
        return loadResult;
    }

    /**
     * When an audio track is loaded this function is called.
     * @param audioTrack The audiotrack loaded.
     */
    @Override
    public void trackLoaded(AudioTrack audioTrack) {
        // We add a track to a list.
        List<AudioTrack> result = new ArrayList<>();
        result.add(audioTrack);
        // We call the completion of the loading ( callback ? ) with the TRACK_LOADED status.
        this.loadResult.complete(new LoadResult(LoadResult.ResultStatus.TRACK_LOADED, result, null, null));
    }

    /**
     * When a playlist is loaded, this function is called.
     * @param audioPlaylist The audioplayliad loaded.
     */
    @Override
    public void playlistLoaded(AudioPlaylist audioPlaylist) {
        String playlistName = null;
        Integer selectedTrack = null;
        if (!audioPlaylist.isSearchResult()) {
            playlistName = audioPlaylist.getName();
            selectedTrack = audioPlaylist.getTracks().indexOf(audioPlaylist.getSelectedTrack());
        }

        LoadResult.ResultStatus status = audioPlaylist.isSearchResult() ? LoadResult.ResultStatus.SEARCH_RESULT : LoadResult.ResultStatus.PLAYLIST_LOADED;
        List<AudioTrack> loadedItems = audioPlaylist.getTracks();

        this.loadResult.complete(new LoadResult(status, loadedItems, playlistName, selectedTrack));
    }

    /**
     * Called when a load returns no results.
     */
    @Override
    public void noMatches() {
        this.loadResult.complete(NO_MATCHES);
    }

    /**
     * Called when a load returns an exception
     * @param e The exception
     */
    @Override
    public void loadFailed(FriendlyException e) {
        this.loadResult.complete(new LoadResult(e));
    }

}