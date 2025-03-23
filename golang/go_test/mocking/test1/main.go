package main

func main() {
	ch1 := make(chan int)
	ch2 := make(chan int)

	go func() {
		ch1 <- 42 // Blocks because no one is receiving
	}()

	<-ch2 // Main goroutine blocks forever
}
