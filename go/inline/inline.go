// to check the inline and escape analysis run go build -gcflags="-m=2" .
package main

import "fmt"

// Simple function - will be inlined
func double(x int) int {
	return x * 2
}

// Complex function - won't be inlined
//
//go:noinline
func complexCalc(x int) int {
	for range 10 {
		x += 1
	}
	return x
}

func main() {
	a := double(5)      // This call will be inlined
	b := complexCalc(5) // This call won't be inlined
	fmt.Println(a, b)
}
