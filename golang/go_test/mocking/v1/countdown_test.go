package main

import (
	"bytes"
	"testing"
)

func TestCountDown(t *testing.T) {
	buffer := &bytes.Buffer{}

	Countdown(buffer)

	got, want := buffer.String(), `3
	2
	1
	Go!`

	if got != want {
		t.Errorf("got %s want %s\n", got, want)
	}
}
