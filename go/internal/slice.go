package main

import (
	"fmt"
	"unsafe"
)

type Person struct {
	Name      string
	Age       int
	Interests []string
	Scores    map[string]int
}

func main() {
	interests := make([]string, 3, 10)
	interests[0] = "Coding"
	interests[1] = "Reading"

	p := Person{
		Name:      "Alice",
		Age:       30,
		Interests: interests,
		Scores:    map[string]int{"Math": 95, "English": 90},
	}

	fmt.Println("Before:", p.Interests, "Cap:", cap(p.Interests))
	arrayPtr := getBackingArrayPointer(p.Interests)
	modifyAppendInterests(p)
	fmt.Println("After append:", p.Interests)
	fmt.Println("Backing array after append")
	for i := range cap(p.Interests) {
		if i < len(p.Interests) {
			fmt.Printf("[%d]: %s (visible in slice)\n", i, arrayPtr[i])
		} else {
			fmt.Printf("[%d]: %s (beyond length, but in capacity)\n", i, arrayPtr[i])
		}
	}

	fmt.Println("Before:", p.Interests, "Cap:", cap(p.Interests))
	fmt.Printf("now modified using thw array like syntax\n")
	modifyInterests(p)
	fmt.Println("After -> ", p.Interests)
	for i := range cap(p.Interests) {
		if i < len(p.Interests) {
			fmt.Printf("[%d]: %s (visible in slice)\n", i, arrayPtr[i])
		} else {
			fmt.Printf("[%d]: %s (beyond length, but in capacity)\n", i, arrayPtr[i])
		}
	}
}

func modifyAppendInterests(p Person) {
	p.Interests = append(p.Interests, "Swimming")
	fmt.Println("Inside append function, p.Interests:", p.Interests)
}

func modifyInterests(p Person) {
	p.Interests[2] = "on the floor"
}

func getBackingArrayPointer(slice []string) []string {
	if c := cap(slice); c == 0 {
		return nil
	}
	return unsafe.Slice(unsafe.SliceData(slice), cap(slice))
}
