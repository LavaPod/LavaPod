package fr.unix.lavapod.lavapodler.audio;

import com.github.shredder121.asyncaudio.jda.AsyncPacketProviderFactory;
import com.sedmelluq.discord.lavaplayer.jdaudp.NativeAudioSendFactory;
import com.sedmelluq.discord.lavaplayer.player.AudioPlayerManager;
import com.sedmelluq.discord.lavaplayer.player.DefaultAudioPlayerManager;
import com.sedmelluq.discord.lavaplayer.source.bandcamp.BandcampAudioSourceManager;
import com.sedmelluq.discord.lavaplayer.source.beam.BeamAudioSourceManager;
import com.sedmelluq.discord.lavaplayer.source.soundcloud.*;
import com.sedmelluq.discord.lavaplayer.source.twitch.TwitchStreamAudioSourceManager;
import com.sedmelluq.discord.lavaplayer.source.vimeo.VimeoAudioSourceManager;
import com.sedmelluq.discord.lavaplayer.source.youtube.YoutubeAudioSourceManager;
import fr.unix.lavapod.lavapodler.Main;
import fr.unix.lavapod.lavapodler.audio.loader.AudioLoader;
import net.dv8tion.jda.api.audio.factory.IAudioSendFactory;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import space.npstr.magma.MagmaFactory;
import space.npstr.magma.api.MagmaApi;
import space.npstr.magma.api.Member;
import space.npstr.magma.api.event.MagmaEvent;

import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

public class PlayersManager {
    private static final Logger logger = LoggerFactory.getLogger(PlayersManager.class);
    private final Map<String,Player> contextMap = new HashMap<>();
    private final AudioPlayerManager playerManager = BuildPlayerManager();
    private final Main main;
    private final MagmaApi magma;
    private Map<Integer,IAudioSendFactory> factory = new HashMap<>();
    private Map<String,Integer> facD = new HashMap<>();

    /**
     * Initialize a send factory
     * @return The factory created.
     */
    public IAudioSendFactory InitFactory() {
        logger.info("Creating a factory.");
        return AsyncPacketProviderFactory.adapt(new NativeAudioSendFactory(50));
    }

    /**
     * Used to load audio tracks.
     */
    public final AudioLoader audioLoader = new AudioLoader(playerManager);
    /**
     * Used to schedule the updates send to the client.
     */
    private final ScheduledExecutorService executor;

    /**
     * The the single magma api of this player.
     * @return The magma api.
     */
    public MagmaApi getMagmaApi() {
        return magma;
    }

    /**
     * This is used as factory provider for lavapod.
     * TODO Need to made the factory provider select a specific factory instance for each guild/userid player.
     * @param member
     * @return
     */
    private IAudioSendFactory magmaApiProvider(Member member) {
        return factory.computeIfAbsent(ComputeFactoryFromMember(member),(e) -> InitFactory());
    }

    private Integer ComputeFactoryFromMember(Member m) {
        return facD.computeIfAbsent(m.getGuildId()+m.getUserId(),(member) -> new Random().nextInt(10));
    }

    public Main getMain() {
        return main;
    }

    private static AudioPlayerManager BuildPlayerManager() {
        AudioPlayerManager p = new DefaultAudioPlayerManager();
        p.enableGcMonitoring();
        YoutubeAudioSourceManager youtube = new YoutubeAudioSourceManager(true);
        youtube.setPlaylistPageCount(1);
        p.registerSourceManager(youtube);
        DefaultSoundCloudDataReader dataReader = new DefaultSoundCloudDataReader();
        DefaultSoundCloudHtmlDataLoader htmlDataLoader = new DefaultSoundCloudHtmlDataLoader();
        DefaultSoundCloudFormatHandler formatHandler = new DefaultSoundCloudFormatHandler();
        p.registerSourceManager(new SoundCloudAudioSourceManager(
                true,
                dataReader,
                htmlDataLoader,
                formatHandler,
                new DefaultSoundCloudPlaylistLoader(htmlDataLoader, dataReader, formatHandler)
        ));
        p.registerSourceManager(new BandcampAudioSourceManager());
        p.registerSourceManager(new TwitchStreamAudioSourceManager());
        p.registerSourceManager(new VimeoAudioSourceManager());
        p.registerSourceManager(new BeamAudioSourceManager());
        return p;
    }

    public PlayersManager(Main main) {
        this.magma = MagmaFactory.of(this::magmaApiProvider);
        this.main = main;
        executor = Executors.newScheduledThreadPool(1);
        getMagmaApi().getEventStream().subscribe(this::event);
    }
    private void event(MagmaEvent e) {
        System.out.println(e.getClass().getName());
    }


    public Player getContextFromGuild(String guild) {
        return this.createContext(guild,new JSONObject());
    }


    public Player createContext(String guild, JSONObject data) {
        return contextMap.computeIfAbsent(guild, this::createContextReal);
    }

    private Player createContextReal(String s) {
        logger.info("Creating a context.");
        return new Player(s,this.playerManager,this.executor,this,"","");
    }

    public AudioPlayerManager getPlayerManager() {
        return playerManager;
    }
}
