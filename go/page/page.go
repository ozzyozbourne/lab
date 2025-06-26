package main

import (
	"fmt"
	"os"
)

func main() {
	pageSize := os.Getpagesize()
	fmt.Printf("System Page size: %d bytes (%d KB)\n", pageSize, pageSize/1024)

}
