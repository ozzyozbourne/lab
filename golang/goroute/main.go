package main

import "sync"

func someWork(wg *sync.WaitGroup) <-chan int {
	ch := make(chan int)
	go func() {
		defer wg.Done()
		ch <- 1
	}()
	return ch
}

func main() {
	wg := &sync.WaitGroup{}
	wg.Add(1)
	someWork(wg)
	wg.Wait()
}
