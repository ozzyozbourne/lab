package main

import (
	"fmt"
	"sync"
)

var counter = 0
var wg sync.WaitGroup

func incrementCounter() {
	counter++
	wg.Done()
}

// so the wait group is just for waiting for the goroutines to finish

func main() {
	for range 1000 {
		wg.Add(1)
		go incrementCounter()
	}

	wg.Wait()
	fmt.Println(counter)
}
