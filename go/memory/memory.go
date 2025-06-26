package main

import (
	"fmt"
	"runtime"
	"syscall"
)

func checkActualLimits() {
	var rLimit syscall.Rlimit

	fmt.Println("\nActual System Limits:")
	fmt.Println("====================")

	// Check virtual memory limit
	err := syscall.Getrlimit(syscall.RLIMIT_AS, &rLimit)
	if err == nil {
		fmt.Printf("\nVirtual memory (RLIMIT_AS):\n")
		if rLimit.Cur == ^uint64(0) {
			fmt.Printf("  Current limit: unlimited\n")
		} else {
			fmt.Printf("  Current limit: %d bytes (%.2f GB)\n",
				rLimit.Cur, float64(rLimit.Cur)/(1024*1024*1024))
		}
		if rLimit.Max == ^uint64(0) {
			fmt.Printf("  Maximum limit: unlimited\n")
		} else {
			fmt.Printf("  Maximum limit: %d bytes (%.2f GB)\n",
				rLimit.Max, float64(rLimit.Max)/(1024*1024*1024))
		}
	}

	// Check data segment limit
	err = syscall.Getrlimit(syscall.RLIMIT_DATA, &rLimit)
	if err == nil {
		fmt.Printf("\nData segment (RLIMIT_DATA):\n")
		fmt.Printf("  Current limit: %d bytes (%.2f GB)\n",
			rLimit.Cur, float64(rLimit.Cur)/(1024*1024*1024))
	}

	// Let's also see what Go thinks about memory
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	fmt.Printf("\nGo Runtime Memory Stats:\n")
	fmt.Printf("  Sys (total from OS): %.2f MB\n", float64(m.Sys)/(1024*1024))
	fmt.Printf("  HeapSys: %.2f MB\n", float64(m.HeapSys)/(1024*1024))
}

func main() {
	checkActualLimits()
}
