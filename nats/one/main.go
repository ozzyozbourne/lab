package main

import (
	"log"
	"time"

	"github.com/nats-io/nats.go"
)

func main() {
	nc, err := nats.Connect("http://localhost:4222")
	if err != nil {
		log.Fatalf("unable to connec to the nats -> %v\n", err)
	}
	defer nc.Drain()

	nc.Publish("greet.joe", []byte("hello"))

	sub, err := nc.SubscribeSync("greet.*")
	if err != nil {
		log.Fatalf("Unbable to subscribe to greet* %v\n", err)
	}

	msg, err := sub.NextMsg(10 * time.Millisecond)
	if err != nil {
		log.Printf("didnt reciceve any message after 10 seconds of wait no 1 -> %v\n", err)
	}

	log.Printf("Subscribed after a publish\n")
	log.Printf("Is Msg is nil? %t\n", msg == nil)

	nc.Publish("greet.joe", []byte("Hello"))
	nc.Publish("greet.pam", []byte("Hello"))

	msg, err = sub.NextMsg(10 * time.Millisecond)
	if err != nil {
		log.Fatalf("didnt reciceve any message after 10 seconds of wait no 2 -> %v\n", err)
	}
	log.Printf("Msg data: %q on subject %q\n", string(msg.Data), msg.Subject)

	msg, err = sub.NextMsg(10 * time.Millisecond)
	if err != nil {
		log.Fatalf("didnt reciceve any message after 10 seconds of wait no 3 -> %v\n", err)
	}
	log.Printf("Msg data: %q on subject %q\n", string(msg.Data), msg.Subject)

	nc.Publish("greet.bob", []byte("GoodBye!"))

	msg, err = sub.NextMsg(10 * time.Millisecond)
	if err != nil {
		log.Fatalf("didnt reciceve any message after 10 seconds of wait no 4 -> %v\n", err)
	}
	log.Printf("Msg data: %q on subject %q\n", string(msg.Data), msg.Subject)
}
