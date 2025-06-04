package main

import (
	"context"
	"errors"
	"fmt"
	"time"
)

func doWorkWithCancellation(ctx context.Context) (res int, err error) {
	resultChan := make(chan int)
	go func() {
		resultChan <- 1
	}()

	// so this is a streaming channel that is stopped when the context expires
	// similar to flow or multi in project reactor and mutiny in java
	for {
		select {
		case res = <-resultChan:
			return
		case <-ctx.Done():
			return res, ctx.Err()

		}
	}
}

type StoppableWorker struct {
	stop   chan struct{}
	timout time.Duration
}

func (w *StoppableWorker) DoWork(ctx context.Context) error {
	workComplete := make(chan struct{})
	go func() {
		time.Sleep(10 * time.Second)
		close(workComplete)
	}()

	select {
	case <-workComplete:
		return nil
	case <-ctx.Done():
		return errors.New("cancelled by time out")
	case <-time.After(w.timout):
		return errors.New("Worker timedout")
	case <-w.stop:
		return errors.New("Manually Stopped")
	}
}

func complexPipeline(ctx context.Context, input <-chan int) <-chan int {
	transform := make(chan int)
	go func() {
		for {
			select {
			case <-ctx.Done():
				close(transform)
			case val := <-input:
				transform <- val + 10
			}
		}
	}()

	enrich := make(chan int)
	go func() {
		for {
			select {
			case <-ctx.Done():
				close(enrich)
			case val := <-transform:
				enrich <- val + 20
			}
		}
	}()

	result := make(chan int)
	go func() {
		for {
			select {
			case <-ctx.Done():
				close(enrich)
			case val := <-enrich:
				result <- val + 30
			}
		}
	}()
	return result
}

func main() {
	ch := make(chan StoppableWorker)
	close(ch)

	// Reading from a closed channel returns immediately!
	value, ok := <-ch
	fmt.Printf("Value: %+v, OK: %v\n", value, ok) // Output: Value: 0, OK: false
}
