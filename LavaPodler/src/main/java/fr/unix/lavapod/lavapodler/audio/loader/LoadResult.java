package fr.unix.lavapod.lavapodler.audio.loader;

import com.sedmelluq.discord.lavaplayer.tools.FriendlyException;
import com.sedmelluq.discord.lavaplayer.track.AudioTrack;

import java.util.Collections;
import java.util.List;

/**
 * Represents a result from lavalink
 */
public class LoadResult {
    public ResultStatus loadResultType;
    public List<AudioTrack> tracks;
    public String playlistName;
    public Integer selectedTrack;
    public FriendlyException exception;

    public LoadResult(ResultStatus loadResultType, List<AudioTrack> tracks,
                       String playlistName,  Integer selectedTrack) {

        this.loadResultType = loadResultType;
        this.tracks = Collections.unmodifiableList(tracks);
        this.playlistName = playlistName;
        this.selectedTrack = selectedTrack;
        this.exception = null;
    }

    public LoadResult(FriendlyException exception) {
        this.loadResultType = ResultStatus.LOAD_FAILED;
        this.tracks = Collections.emptyList();
        this.playlistName = null;
        this.selectedTrack = null;
        this.exception = exception;
    }
    public enum ResultStatus {
        TRACK_LOADED,
        PLAYLIST_LOADED,
        SEARCH_RESULT,
        NO_MATCHES,
        LOAD_FAILED
    }
}

