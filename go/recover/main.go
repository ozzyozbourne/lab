package main

import (
	"fmt"
	"time"
)

func main() {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("Recovered:", r)
		}
	}()

	go panic("This is a panic")

	time.Sleep(1 * time.Second) // Wait for the goroutine to finish
}
