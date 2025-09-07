package org.acme;

import io.smallrye.mutiny.Multi;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

@Path("/chatty")
public class GreetingResource {

    private final GenJoke gk;
    private final Critic ct;

    @Inject
    public GreetingResource(GenJoke gk, Critic ct) {
        this.gk = gk;
        this.ct = ct;
    }

    @POST
    @Produces(MediaType.SERVER_SENT_EVENTS)
    public Multi<String> hello(String body) {
       return gk.chat(body).collect().asList()
               .map(ck -> String.join("", ck))
               .invoke(joke -> System.out.println("generated joke " + joke))

               .onItem().transformToMulti(ct::chat)
               .collect().asList()
               .map(ck -> String.join("", ck))
               .invoke(criticism -> System.out.println("Criticism: " + criticism))

               .onItem().transformToMulti(ct::chat)
               .collect().asList()
               .map(chunks -> String.join("", chunks))
               .invoke(finalResult -> System.out.println("Criticism: " + finalResult))

               .onItem().transformToMulti(ct::chat);

    }
}
