package org.acme;

import io.smallrye.common.annotation.RunOnVirtualThread;
import io.smallrye.mutiny.Multi;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.jboss.resteasy.reactive.RestStreamElementType;

@Path("/chatty")
public class GreetingResource {

    private final MyLlama myLlama;

    @Inject
    public GreetingResource(MyLlama myLlama) {
        this.myLlama = myLlama;
    }

    @POST
    @Produces(MediaType.SERVER_SENT_EVENTS)  // Changed to SSE
    @Consumes(MediaType.TEXT_PLAIN)
    @RestStreamElementType(MediaType.TEXT_PLAIN)  // Type of each streamed element
    public Multi<String> hello(String body) {  // Return Multi<String> instead
        return this.myLlama.chat(body);  // Assuming you have a streaming method
    }
}
