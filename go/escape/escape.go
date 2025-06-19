package main

import "fmt"

// Example 1: Variable stays on stack
func stackExample() int {
	x := 42 // x doesn't escape - stays on stack
	y := x * 2
	return y // returning a copy of the value
}

// Example 2: Variable escapes to heap
func heapExample() *int {
	x := 42   // x escapes to heap!
	return &x // returning a pointer to x
}

// Example 3: Escape through assignment
func escapeDemo() {
	local := 100
	fmt.Println(local) // local escapes because fmt.Println
	// stores it somewhere that outlives this function
}

func main() {
	a := stackExample() // 'a' gets a value
	b := heapExample()  // 'b' gets a pointer to heap memory
	fmt.Println(a, *b)
}
