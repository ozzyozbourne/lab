package main

import (
	"bytes"
	"fmt"
	"testing"
)

func TestCountDown(t *testing.T) {
	buffer := &bytes.Buffer{}
	CountDown(buffer, &SpySleeper{})

	got, want := buffer.String(), fmt.Sprintf("3\n2\n1\nGo!")

	if got != want {
		t.Errorf("\ngot %s want %s\n", got, want)
	}
}

type SpySleeper struct {
	Calls int
}

func (s *SpySleeper) Sleep() {
	s.Calls += 1
}
