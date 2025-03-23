package main

import "fmt"

func nillable() {
	// slices
	var nilSlice []int            // this is nill since hence the fat pointer is not init so both len(s)snd cap(s) is also nill here
	emptySlice := make([]int, 10) // this is not nill, but the len(s) is zero and the cap() is not zero

	fmt.Printf("len of nill slice -> %d len of empty slice -> %d\n", len(nilSlice), len(emptySlice))
	fmt.Printf("cap of nill slice -> %d cap of empty slice -> %d\n", cap(nilSlice), cap(emptySlice))

	//maps
	var nilMap map[string]int
	emptyMap := make(map[string]int)
	sizedMap := make(map[string]int, 100)

	fmt.Printf("len of nill map -> %d len of empty map -> %d len of sized map -> %d\n", len(nilMap), len(emptyMap), len(sizedMap))

	//channels
	var nilChan chan int
	unbufferredChan := make(chan int)
	bufferredChan := make(chan int, 5)

	fmt.Printf("nilChan len -> %d unbufferedChan len %d bufferedChan len %d\n", len(nilChan), len(unbufferredChan), len(bufferredChan))
	fmt.Printf("nilChan cap -> %d unbufferedChan cap %d bufferedChan cap %d\n", cap(nilChan), cap(unbufferredChan), cap(bufferredChan))

}
