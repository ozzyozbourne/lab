package in.action;

import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import io.smallrye.mutiny.helpers.test.UniAssertSubscriber;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.time.Duration;

@Path("/hello")
public class ExampleResource {

    @GET
    @Produces(MediaType.TEXT_PLAIN)
    public String hello() {
        return "Hello from Quarkus REST";
    }

    public static void main(String[] args) {
        System.out.println("⚡️ Hello world");

        Uni<String> unis = Uni.createFrom().item("Hello, world!");

        unis.subscribe().with(System.out::println);

        Uni<Integer> uni = Uni.createFrom().item(63);

        UniAssertSubscriber<Integer> subscriber = uni
                .subscribe().withSubscriber(UniAssertSubscriber.create());

        subscriber
                .awaitItem()
                .assertItem(63);

        mark();
    }

    static void mark(){
        var uni = Uni.createFrom().item("tester");
        var subs = uni.subscribe().withSubscriber(UniAssertSubscriber.create());
        subs.awaitItem().assertItem("teste");


    }


}
