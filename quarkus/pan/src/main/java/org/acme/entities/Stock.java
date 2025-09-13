package org.acme.entities;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import io.quarkus.hibernate.reactive.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "stocks")
public class Stock extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false, unique = true, length = 10)
    public String symbol;

    @Column(nullable = false, length = 200)
    public String name;

    @Column(nullable = false, length = 100)
    public String sector;

    @Column(name = "starting_price", nullable = false, precision = 12, scale = 4)
    public BigDecimal startingPrice;

    @Column(name = "current_price", precision = 12, scale = 4)
    public BigDecimal currentPrice;

    @Column(nullable = false, precision = 12, scale = 4)
    public BigDecimal volatility;

    @Column(nullable = false)
    public Boolean active = true;

    @Column(name = "market_cap")
    public Long marketCap;

    @Column(name = "shares_outstanding")
    public Long sharesOutstanding;

    @Column(nullable = false, length = 3)
    public String currency = "USD";

    @Column(nullable = false, length = 10)
    public String exchange = "NASDAQ";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    public OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    public OffsetDateTime updatedAt;

}
