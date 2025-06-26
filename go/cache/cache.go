package main

import (
	"fmt"
	"time"
)

// Let's see the effect of cache-friendly vs cache-unfriendly access patterns
func demonstrateCacheEffect() {
	const size = 64 * 1024 * 1024 // 64MB of data
	data := make([]int64, size/8)

	// Initialize our data
	for i := range data {
		data[i] = int64(i)
	}

	// Cache-friendly: Sequential access
	start := time.Now()
	sum := int64(0)
	for i := 0; i < len(data); i++ {
		sum += data[i]
	}
	sequentialTime := time.Since(start)
	fmt.Printf("Sequential access (cache-friendly): %v\n", sequentialTime)

	// Cache-unfriendly: Random access with large strides
	start = time.Now()
	sum = 0
	stride := 1024 // Skip around in memory
	for i := 0; i < len(data); i += stride {
		for j := i; j < len(data); j += len(data) / stride {
			sum += data[j]
		}
	}
	randomTime := time.Since(start)
	fmt.Printf("Strided access (cache-unfriendly): %v\n", randomTime)
	fmt.Printf("Slowdown factor: %.2fx\n", float64(randomTime)/float64(sequentialTime))
}

func main() {
	demonstrateCacheEffect()
}
