package main

import (
	"fmt"
	"sync"
)

var counter = 0
var wg sync.WaitGroup
var mutex sync.Mutex

// this example as waitgroup as a barrier for all the go routines to hit the counter,
// and a mutex lock for the shared protected resource
func incrementCounter() {
	mutex.Lock()
	counter++
	mutex.Unlock()
	wg.Done()
}

func main() {
	for range 1000 {
		wg.Add(1)
		go incrementCounter()
	}

	wg.Wait()
	fmt.Println(counter)
}
