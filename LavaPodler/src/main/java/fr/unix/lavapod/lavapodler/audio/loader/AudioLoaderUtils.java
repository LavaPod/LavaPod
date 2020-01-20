package fr.unix.lavapod.lavapodler.audio.loader;

import com.sedmelluq.discord.lavaplayer.player.AudioPlayerManager;
import com.sedmelluq.discord.lavaplayer.tools.io.MessageInput;
import com.sedmelluq.discord.lavaplayer.tools.io.MessageOutput;
import com.sedmelluq.discord.lavaplayer.track.AudioTrack;
import com.sedmelluq.discord.lavaplayer.track.AudioTrackInfo;
import org.apache.commons.codec.binary.Base64;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

public class AudioLoaderUtils {
    /**
     * This method return a track as json.
     * @param track The trageted track.
     * @return The JsonObject of the track.
     */
    public static JSONObject trackToJson(AudioTrack track) {
        AudioTrackInfo info = track.getInfo();
        return new JSONObject()
                .put("title", info.title)
                .put("author", info.author)
                .put("length", info.length)
                .put("identifier", info.identifier)
                .put("uri", info.uri)
                .put("isStream", info.isStream)
                .put("isSeekable", track.isSeekable())
                .put("position", track.getPosition());
    }

    /**
     * This method translates a load result to json ( for returning )
     * @param result The load result
     * @param audioPlayerManager The fr.unix.lavapod.lavapodler.audio playermanager ( used to decodetrack )
     * @return The JsonObject
     */
    public static JSONObject loadResultToJson(LoadResult result,AudioPlayerManager audioPlayerManager) {
        // The structure of the response
        JSONObject json = new JSONObject();
        JSONObject playlist = new JSONObject();
        JSONArray tracks = new JSONArray();
        // For each track, we need to add to the tracks list
        result.tracks.forEach(track -> {
            // Track info object
            JSONObject object = new JSONObject();
            object.put("info", trackToJson(track));
            try {
                String encoded = toMessage(audioPlayerManager, track);
                // We put the track's base64
                object.put("track", encoded);
                tracks.put(object);
            } catch (IOException e) {}
        });
        // Even if there is no playlist, we put the fields
        playlist
                .put("name", result.playlistName)
                .put("selectedTrack", result.selectedTrack);

        // Add all the objects to the main json
        json
                .put("playlistInfo", playlist)
                .put("loadType", result.loadResultType)
                .put("tracks", tracks);

        if (result.loadResultType == LoadResult.ResultStatus.LOAD_FAILED && result.exception != null) {
            // In case of an exception
            JSONObject exception = new JSONObject();
            exception
                    .put("message", result.exception.getLocalizedMessage())
                    .put("severity", result.exception.severity.toString());
            json.put("exception", exception);
        }
        return json;
    }

    /**
     * Gets an fr.unix.lavapod.lavapodler.audio track from a base64 string.
     * @param audioPlayerManager The fr.unix.lavapod.lavapodler.audio player manager
     * @param message The string
     * @return The fr.unix.lavapod.lavapodler.audio track from the base64
     * @throws IOException
     */
    public static AudioTrack toAudioTrack(AudioPlayerManager audioPlayerManager, String message) throws IOException {
        // Decode the track from the base64
        return audioPlayerManager.decodeTrack(new MessageInput(new ByteArrayInputStream(Base64.decodeBase64(message)))).decodedTrack;
    }

    /**
     * Gets the base64 of an fr.unix.lavapod.lavapodler.audio track
     * @param audioPlayerManager The fr.unix.lavapod.lavapodler.audio player manager
     * @param track The string
     * @return The base64 from the track
     * @throws IOException
     */
    public static String toMessage(AudioPlayerManager audioPlayerManager, AudioTrack track) throws IOException {
        // Encode the track to base64
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        audioPlayerManager.encodeTrack(new MessageOutput(outputStream), track);
        return Base64.encodeBase64String(outputStream.toByteArray());
    }
}
