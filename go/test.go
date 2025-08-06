package main

import (
	"log"
)

func main() {
	log.Printf("%s\n", "Hello seamen!")
	log.Printf("%s %d\n", "Push it ->", two(one)(10))
}

func one(a int) int {
	return a * a
}

func two(b func(int) int) func(int) int {
	return func(a int) int {
		log.Printf("%s %d\n", "In the night!", a)
		log.Printf("%s %d\n", "And the value is ->", b(a))
		return a * a * a
	}
}
