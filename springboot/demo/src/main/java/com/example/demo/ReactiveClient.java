package com.example.demo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("reactive")
class ReactiveClient {

    private static final Logger log = LoggerFactory.getLogger(ReactiveClient.class);
    private final WebClient webClient = WebClient.builder()
            .baseUrl("")
            .build();

    @GetMapping
    Flux<Product> getProducts(){
        return this.webClient.get()
                .uri("")
                .retrieve()
                .bodyToFlux(Product.class)
                .doOnNext(p -> log.info("{}", p));
    }
}
