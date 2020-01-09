# LavaLink API v3 Documentation

The LavaLink API v3 is composed of two parts, a REST Api part and a WebSocket part.
We are going to define each part one-by-one.
We are not describing the RoutePlanner system since LavaPod doesn't implement it.


## Rest Api

**ANY** `/loadtracks` \
Return type : `application/json`
Body : Raw Track identifier
```json
{
    "tracks": [
        {
            "info": {
                "title": <string>,
                "author": <string>,
                "length": <long>,
                "identifier": <string>,
                "uri": <string>,
                "isStream": <boolean>,
                "isSeekable": <boolean>,
                "position": <long>
            },
            "track": <string>
        }
    ],
    "playlistInfo": {
        "name": <string|optional>,
        "selectedTrack": <int|optional>
    },
    "loadType": <enum (TRACK_LOADED|PLAYLIST_LOADED|SEARCH_RESULT|NO_MATCHES|LOAD_FAILED)>,
    "exception": {
        "message": <string|optional>,
        "sevirity": <string|optional>
    }
}
```

**ANY** `/decodetrack` \
Return type : `application/json`
Body : Raw Encoded audio track ( return of /loadtracks )
Returned json : 
```json
{
    "title": <string>,
    "author": <string>,
    "length": <long>,
    "identifier": <string>,
    "uri": <string>,
    "isStream": <boolean>,
    "isSeekable": <boolean>,
    "position": <long>
}
```


**ANY** `/decodetracks` \
Return type : `application/json`
Body : `application/json`
Body : Need to fit this json 
```json
[
    "<track identifier>",
    "<track identifier>",
    #...
]
```
Return a list of track ( same as /decodetrack )
