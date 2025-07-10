package org.acme;

import io.quarkus.websockets.next.OnOpen;
import io.quarkus.websockets.next.OnTextMessage;
import io.quarkus.websockets.next.WebSocket;
import io.smallrye.mutiny.Multi;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.jboss.resteasy.reactive.RestStreamElementType;

@WebSocket(path = "/chatty")
public class GreetingResource {

    private final Chat chat;

    @Inject
    public GreetingResource(Chat chat) {
        this.chat = chat;
    }

    @OnOpen
    public String onOpen() {
        return "Welcome to Miles of Smiles! How can I help you today?";
    }

    @OnTextMessage
    public Multi<String> onTextMessage(String message) {
        return chat.chat(message);
    }

    @POST
    @Produces(MediaType.SERVER_SENT_EVENTS)
    @Consumes(MediaType.TEXT_PLAIN)
    @RestStreamElementType(MediaType.TEXT_PLAIN)
    public Multi<String> hello(String body) {
        return chat.chat(body);
    }
}
