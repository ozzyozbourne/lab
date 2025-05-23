package org.acme;

import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import io.vertx.mutiny.core.Vertx;
import io.vertx.mutiny.core.buffer.Buffer;
import jakarta.inject.Inject;


import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

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
    }

    public Uni<String> test(String name, Vertx vertx){
        return vertx.fileSystem().readFile(name)
                .map(Buffer::toString);
    }
}
