package main

import (
	"sync"
)

type Object struct {
	Data []byte
}

var pool sync.Pool = sync.Pool{
	New: func() any {
		return &Object{
			Data: make([]byte, 0, 1024),
		}
	},
}
