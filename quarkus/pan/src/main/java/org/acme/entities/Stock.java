package org.acme.entities;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "stocks")
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "eventType")
@JsonSubTypes({
        @JsonSubTypes.Type(value = Payload.TradePay.class, name = "TRADE"),
        @JsonSubTypes.Type(value = Payload.QuotePay.class, name = "QUOTE"),
        @JsonSubTypes.Type(value = Payload.OrderBook.class, name = "ORDER_BOOK"),
        @JsonSubTypes.Type(value = Payload.BarPay.class, name = "BAR"),
        @JsonSubTypes.Type(value = Payload.MarketStatus.class, name = "MARKET_STATUS"),
        @JsonSubTypes.Type(value = Payload.PriceMovement.class, name = "PRICE_MOVEMENT"),
        @JsonSubTypes.Type(value = Payload.CorporateAction.class, name = "CORPORATE_ACTION"),
        @JsonSubTypes.Type(value = Payload.News.class, name = "NEWS"),
        @JsonSubTypes.Type(value = Payload.VolumeSpike.class, name = "VOLUME_SPIKE"),
        @JsonSubTypes.Type(value = Payload.OptionsActivity.class, name = "OPTIONS_ACTIVITY"),
        @JsonSubTypes.Type(value = Payload.TechnicalIndicator.class, name = "TECHNICAL_INDICATOR"),
        @JsonSubTypes.Type(value = Payload.OrderUpdate.class, name = "ORDER_UPDATE"),
        @JsonSubTypes.Type(value = Payload.PositionUpdate.class, name = "POSITION_UPDATE"),
        @JsonSubTypes.Type(value = Payload.AccountUpdate.class, name = "ACCOUNT_UPDATE")
})
public class Stock  {

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

    public Stock() {}

    public Stock(String symbol, String name, String sector, BigDecimal startingPrice, BigDecimal volatility) {
        this.symbol = symbol;
        this.name = name;
        this.sector = sector;
        this.startingPrice = startingPrice;
        this.volatility = volatility;
    }

    @Override
    public String toString() {
        return String.format("Stock{id=%d, symbol='%s', name='%s', currentPrice=%s}",
                id, symbol, name, currentPrice);
    }

}
