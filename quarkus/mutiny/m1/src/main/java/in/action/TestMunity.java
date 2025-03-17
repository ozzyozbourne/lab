package in.action;

import io.smallrye.mutiny.Uni;

public final class TestMunity {

    public static void main(String... args) {
        final var uni = Uni.createFrom().item("Hello, world!");// use the create from
                                                               // to create the uni
                                                               // and the mutli
                                                               // createFrom
        uni.subscribe().with(System.out::println);
    }
}
