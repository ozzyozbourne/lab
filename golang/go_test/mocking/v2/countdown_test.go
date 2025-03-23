package main

import (
	"bytes"
	"fmt"
	"testing"
)

func TestCountDown(t *testing.T) {
	buffer := &bytes.Buffer{}
	Countdown(buffer)

	got, want := buffer.String(), fmt.Sprintf("3\n2\n1\nGo!")

	if got != want {
		t.Errorf("\ngot %s want %s\n", got, want)
	}
}
