package fr.unix.lavapod.lavapodler.audio.loader;

import com.sedmelluq.discord.lavaplayer.player.AudioPlayerManager;

import java.util.concurrent.CompletionStage;

/**
 * Used to serialize tracks in base64 ( can be used everywhere )
 */
public class AudioLoader {
    /**
     * Used to load audio from the string and vice-versa.
     */
    private final AudioPlayerManager playerManager;

    /**
     * Constructs an audio loader from a audioplayermanager.
     * @param playerManager An audioplayermanager instance.
     */
    public AudioLoader(AudioPlayerManager playerManager) {
        this.playerManager = playerManager;
    }

    /**
     * Load tracks from an identifier ( a query, a link or other )
     * @param identifier The identifier ( a query, a link or other )
     * @return A LoadResult "promise ?"
     */
    public CompletionStage<LoadResult> loadTracks(String identifier) {
        return new AudioLoaderHandler(playerManager)
                .load(identifier);
    }

}
