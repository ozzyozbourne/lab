package org.acme.controllers;

import jakarta.enterprise.context.ApplicationScoped;
import org.acme.entities.Stock;

@ApplicationScoped
class Gen {


    public void get(){
        final var stock = new Stock();
    }
}
