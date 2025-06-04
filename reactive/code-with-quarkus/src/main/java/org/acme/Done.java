package org.acme;

import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import io.smallrye.mutiny.unchecked.Unchecked;
import io.vertx.mutiny.core.Vertx;
import jakarta.inject.Inject;


import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class Done {

    @Inject
    Vertx vertx;

    static void done() throws InterruptedException {
        Uni.createFrom().item(1)
                .onItem().transform(i -> i/0)
                .onItem().delayIt().by(Duration.ofMillis(100))
                .subscribe().with(System.out::println, System.out::println);

        Multi.createFrom().items(1, 2,3,4, 5)
                .onItem().transform( i -> i *2)
                .select().first(3)
                .onFailure().recoverWithItem(0)
                .subscribe().with(System.out::println, System.out::println, () -> System.out.println("completed"));

        AtomicLong ids = new AtomicLong();

        Uni<Long> deferredUni = Uni.createFrom().deferred(() -> Uni.createFrom().item(ids::incrementAndGet));

        for (var i = 0; i < 5; i++) {
            deferredUni.subscribe().with(System.out::println);
        }

        ForkJoinPool forkJoinPool = ForkJoinPool.commonPool();
        CountDownLatch emitterLatch = new CountDownLatch(1);

        Uni<String> uniFromEmitter = Uni.createFrom().emitter(emitter -> {
            forkJoinPool.submit(() -> {
                emitter.complete("Hello");
                emitterLatch.countDown();
            });
        });

        uniFromEmitter.subscribe().with(System.out::println);

        emitterLatch.await();

        Uni<Integer> uniFromEmitterAndState = Uni.createFrom()
                .emitter(AtomicInteger::new, (i, e) -> e.complete(i.addAndGet(10)));

        for (var i = 0; i < 5; i++) {
            uniFromEmitterAndState.subscribe().with(System.out::println);
        }

        Uni.createFrom().optional(Optional.of("Hello"))
                .subscribe().with(System.out::println, failure -> System.out.println(failure.getMessage()));

        Uni.createFrom().converter(i -> Uni.createFrom().item("[" + i + "]"), 10)
                .subscribe().with(System.out::println, failure -> System.out.println(failure.getMessage()));

        Uni.createFrom().nothing()
                .subscribe().with(System.out::println, failure -> System.out.println(failure.getMessage()));

        Uni.createFrom().voidItem()
                .subscribe().with(System.out::println, failure -> System.out.println(failure.getMessage()));

        Uni.createFrom().nullItem()
                .subscribe().with(System.out::println, failure -> System.out.println(failure.getMessage()));

        Uni.createFrom().item(List.of(1, 2, 3, 4, 5))
                .onItem().disjoint()
                .subscribe().with(System.out::println);

        Uni.createFrom().item(List.of(1, 2, 3, 4, 5))
                .subscribe().with(System.out::println);
// Output: [1, 2, 3, 4, 5]

// With disjoint - prints each element separately
        Uni.createFrom().item(List.of(1, 2, 3, 4, 5))
                .onItem().disjoint()
                .subscribe().with(System.out::println);
// Output: 1

        Multi<String> stream = Multi.createFrom().emitter(emitter -> {
            // You now have control! You can emit values whenever you want
            emitter.emit("Hello");
            emitter.emit("World");
            Long s= emitter.requested();
            emitter.complete(); // Signal that we're done
        });

        // -------------------------------------------------------------------------------------------------- //

        System.out.println("----");

        Multi.createFrom().range(10, 15)
                .subscribe().with(System.out::println);

        var randomNumbers = Stream
                .generate(ThreadLocalRandom.current()::nextInt)
                .limit(5)
                .collect(Collectors.toList());

        // -------------------------------------------------------------------------------------------------- //

        System.out.println("----");

        Multi.createFrom().iterable(randomNumbers)
                .subscribe().with(System.out::println);


        // -------------------------------------------------------------------------------------------------- //

        Multi.createFrom().items(1, 2, 3)
                .subscribe().with(
                        subscription -> {
                            System.out.println("Subscription: " + subscription);
                            subscription.request(10);
                        },
                        item -> System.out.println("Item: " + item),
                        failure -> System.out.println("Failure: " + failure.getMessage()),
                        () -> System.out.println("Completed"));

        Multi<Integer> pipeline = Multi.createFrom().items(1, 2, 3, 4, 5)
                // This failure handler is defined first, but what can it catch?
                .onFailure()
                .invoke(err -> System.out.println("Handler A caught: " + err.getMessage()))
                .onFailure().recoverWithItem(99)

                // These operations come AFTER the failure handler
                .onItem().invoke(s -> {}).onItem()
                .transform(Unchecked.function(n -> {
                    System.out.println("Transform 1: " + n);
                    if (n == 3) throw new RuntimeException("Error in transform 1!");
                    return n * 2;
                }))
                .invoke(n -> System.out.println("After transform 1: " + n))

                // This second failure handler comes after the operations above
                .onFailure()
                .invoke(err -> System.out.println("Handler B caught: " + err.getMessage()))
                .onFailure()
                .recoverWithItem(88);

        pipeline.subscribe().with(System.out::println);


        Uni.createFrom().item(123)
                .invoke(n -> System.out.println("n = " + n))
                .call(n -> Uni.createFrom()
                        .voidItem()
                        .invoke(() -> System.out.println("call(" + n + ")")))
                .eventually(() -> System.out.println("eventually()"))
                .subscribe().with(System.out::println);
    }


    public static void demonstrateEventLoopBehavior() throws InterruptedException {
        System.out.println("Thread: " + Thread.currentThread().getName());
        Multi.createFrom().items(1, 2, 3)
                .onItem()
                .transform(n -> {
                    System.out.println("Sync transform on thread: " +
                            Thread.currentThread().getName() + " for item: " + n);
                    return n * 2;
                })
                .onItem()
                .invoke(n -> System.out.println("Sync invoke: " + n))
                .onItem()
                .transformToUniAndConcatenate(n -> {
                    System.out.println("Creating async operation for: " + n);
                    return Uni.createFrom().item(n)
                            .onItem().delayIt().by(Duration.ofMillis(100))
                            .onItem().invoke(x ->
                                    System.out.println("Async completed on thread: " +
                                            Thread.currentThread().getName() + " for item: " + x));
                })
                .onItem()
                .invoke(n -> System.out.println("Back in pipeline: " + n))
                .subscribe().with(
                        item -> System.out.println("Subscriber got: " + item),
                        error -> System.out.println("Error: " + error)
                );
        System.out.println("Main method continues!");
        Thread.sleep(500);
        System.out.println("Main method over!");
    }

}
