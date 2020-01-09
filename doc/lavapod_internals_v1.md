# LavaPod internal protocol

LavaPod uses two differents protocols.
One used between the orchestrator & the websocket/restapi \
And one used to communicate with the LavaPodia instance.

## Orchestrator <-> WebSocket/RestApi

All the links of this connection is based on a websocket-like payload.
Except everything is based on Rabbitmq.

### **Orchestrator to Websocket payload.**
```json
{
    "sid": <string ( uuid )>,
    "op": <string>,
    "d": <mixed|any> 
}
```
The valid opcodes : 
 - SEND
    ```json
    {
        "sid": <string ( uuid )>,
        "op": <string>,
        "d": {
            "payload": <mixed|any>
        }
    }
    ```
 - CLOSE_UNEXPECTED
    ```json
    {
        "sid": <string ( uuid )>,
        "op": <string>,
        "d": {
            "beforeClosePayload": <mixed|any>
        }
    }
    ```
 - RESUME
    ```json
    {
        "sid": <string ( uuid )>,
        "op": <string>,
        "d": {
            "newSid": <string ( uuid )>
        }
    }
    ```
    