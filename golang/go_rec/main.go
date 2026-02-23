package main

import (
	"fmt"
	"runtime"
	"unsafe"
)

//go:noinline
func stackAddress() uintptr {
	var x int
	return uintptr(unsafe.Pointer(&x))
}

// Track the max depth and growth without printing inside recursion
// to keep the stack frames clean
var maxGrowth int64
var maxDepth int

//go:noinline
func fib(n int, depth int, initialStack uintptr) int {
	currentStack := stackAddress()

	growth := int64(initialStack) - int64(currentStack)
	if growth < 0 {
		growth = -growth
	}

	// Track maximums — no heap-escaping Printf here
	if growth > maxGrowth {
		maxGrowth = growth
		maxDepth = depth
	}

	if n <= 1 {
		return n
	}

	a := fib(n-1, depth+1, initialStack)
	b := fib(n-2, depth+1, initialStack)
	return a + b
}

// Separate function to print at each step (only for linear descent)
//
//go:noinline
func fibWithPrint(n int, depth int, initialStack uintptr) int {
	currentStack := stackAddress()

	growth := int64(initialStack) - int64(currentStack)
	if growth < 0 {
		growth = -growth
	}

	fmt.Printf("depth=%2d | n=%2d | stack_addr=0x%x | growth=~%5d bytes\n",
		depth, n, currentStack, growth)

	if n <= 1 {
		return n
	}

	// Only recurse on n-1 branch to show linear stack growth
	// (full fib tree would flood the output)
	return fibWithPrint(n-1, depth+1, initialStack)
}

func main() {
	initial := stackAddress()

	fmt.Println("=== Linear descent (n-1 only) to see stack growth clearly ===")
	fmt.Println()
	fibWithPrint(30, 0, initial)

	fmt.Println()
	fmt.Println("=== Full fibonacci to see max stack depth ===")
	fmt.Println()

	var mBefore runtime.MemStats
	runtime.ReadMemStats(&mBefore)
	fmt.Printf("Stack before: %d bytes\n", mBefore.StackInuse)

	maxGrowth = 0
	maxDepth = 0
	result := fib(30, 0, initial)

	var mAfter runtime.MemStats
	runtime.ReadMemStats(&mAfter)

	fmt.Printf("Stack after:  %d bytes\n", mAfter.StackInuse)
	fmt.Printf("Max growth:   %d bytes at depth %d\n", maxGrowth, maxDepth)
	fmt.Printf("fib(30) = %d\n", result)

	// Estimate bytes per stack frame
	if maxDepth > 0 {
		fmt.Printf("~%d bytes per stack frame\n", maxGrowth/int64(maxDepth))
	}
}
