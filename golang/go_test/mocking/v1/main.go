package main

import (
	"fmt"
	"io"
	"os"
)

func Countdown(out io.Writer) {
	fmt.Fprintf(out, "3\n")
}

func main() {
	Countdown(os.Stdout)
}
