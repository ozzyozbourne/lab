package org.acme;

import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import io.smallrye.mutiny.subscription.Cancellable;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.IntStream;

public class MyUni {

    public static void main(String[] args) {
        Uni.createFrom().item("Hello")
                .onItem().transform(i -> i + "Hello")
                .onItem().transform(String::toUpperCase)
                .subscribe().with(item -> System.out.println(">> " + item));

        var uni1 = Uni.createFrom().item("One");
        var uni2 = uni1.onItemOrFailure().transform((a, b) -> {
            System.out.println("a -> " + a + " b -> " + b);
            return "Soul Man";
        });

        uni2.subscribe().with(System.out::println);

        Uni<String> uni = Uni.createFrom().item("hello");

        uni.onItem().transform(item -> item + " mutiny");
        uni.onItem().transform(String::toUpperCase);

        uni.subscribe().with(item -> System.out.println(">> " + item));

        Cancellable sr = Uni.createFrom().item(1).onItem().transform(s -> "hello" + s)
                .invoke(i -> System.out.println(i))
                .onItem().delayIt().by(Duration.ofSeconds(1)).subscribe()
                .with(
                        i -> System.out.println("Success -> " + i),
                        e -> System.out.println("Failed -> " + e)
                );
        sr.cancel();

        AtomicInteger counter = new AtomicInteger();
        var et = Uni.createFrom().item(() -> counter.getAndIncrement());

        et.subscribe().with(System.out::println);
        et.subscribe().with(System.out::println);
        et.subscribe().with(System.out::println);
        et.subscribe().with(System.out::println);

        Multi<Integer> multi = Multi.createFrom().items(() ->
                IntStream.range(counter.getAndIncrement(), counter.get() * 2).boxed());

        Multi<String> someMulti = Multi.createFrom().items("a", "b", "c");
        someMulti
                .onItem()
                .invoke(i -> System.out.println(i))
                .onItem().transform(String::toUpperCase)
                .invoke(i -> System.out.println(i))
                .subscribe().with(
                        System.out::println); // Print A B C

    }
}
