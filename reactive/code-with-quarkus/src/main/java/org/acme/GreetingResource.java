package org.acme;

import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import io.smallrye.mutiny.unchecked.Unchecked;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Path("/hello")
public class GreetingResource {


    @GET
    @Produces(MediaType.TEXT_PLAIN)
    public String hello() {
        return "Hello from Quarkus REST";
    }




    public static void main(String[] args) {
        System.out.println("⚡️ Uni combine");

        var first = Uni.createFrom().item(1);
        var second = Uni.createFrom().item(2);
        var third = Uni.createFrom().item(3);

        Uni.combine()
                .all().unis(first, second, third)
                .asTuple()
                .subscribe().with(System.out::println);

        Uni.combine()
                .all().unis(first, second, third)
                .with((a, b, c) -> a + b + c)
                .subscribe().with(System.out::println);

        Uni.combine()
                .any().of(first, second, third)
                .subscribe().with(System.out::println);
    }
}


