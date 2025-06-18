package main

import (
	"sync"
)

type Element[T any] struct {
	next, prev *Element[T]
	list       *List[T]
	Value      T
}

type List[T any] struct {
	root Element[T]
	len  int
	pool *sync.Pool
}

func main() {
}

func NewPool[T any]() *sync.Pool {
	return &sync.Pool{New: func() any { return &Element[T]{} }}
}
