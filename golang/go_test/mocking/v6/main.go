package main

import (
	"fmt"
	"io"
	"iter"
	"os"
	"time"
)

type Sleeper interface {
	Sleep()
}

type ConfigurableSleeper struct {
	duration time.Duration
	sleep    func(time.Duration)
}

func (c *ConfigurableSleeper) Sleep() {
	c.sleep(c.duration)
}

func CountDown(out io.Writer, sleeper Sleeper) {
	for i := range countDownFrom(3) {
		fmt.Fprintf(out, "%d\n", i)
		sleeper.Sleep()
	}
	fmt.Fprintf(out, "Go!")
}

func countDownFrom(from int) iter.Seq2[int, int] {
	return func(yield func(int, int) bool) {
		for i := from; i > 0; i-- {
			if !yield(i, i) {
				return
			}
		}
	}
}

func main() {
	sleeper := &ConfigurableSleeper{1 * time.Second, time.Sleep}
	CountDown(os.Stdout, sleeper)
	go func() {
		_ = 1 + 1
	}()
}
