package main

import (
	"log/slog"
)

func main() {
	var a MyInterface = MyStruct{Name: "H.O.O.D"}
	// so what is happenin in this reciever where
	// when i call the function GetName is needs one parameter
	// the struct to action on
	// so this function need not an address to the struct of MyStruct
	// that inplements the interface MyInterface
	// so it can take on both a pointer type and a non pointer type
	// since we are sending a copy anyway
	// make a copy
	// v = copy(a)
	// then call the function
	// GetName(v)
	// so it works with both a pointer type and a non pointer type
	// v = copy(*a)
	// then call the function
	// GetName(v)
	// since in we thing in c
	// for the struct MyStruct we have a function called
	// GetName that expected a copy of the struct
	slog.Info("Value type   ->", "name", a.GetName())

	var b MyInterface = &MyStruct{Name: "JAA"}
	slog.Info("Pointer type ->", "name", b.GetName())

	// this wont work since the complier knows that is the struct MyStructP
	// has two method that take in the pointer of MystructP to satisfy the interface
	// in c its like
	// GetName(*MyStructP)
	// SetName(*MyStructP, *char)
	// so a value type of a reciver wont work here
	// since there are no method to implement the interface
	//var c MyInterface = MyStructP{Name: "Sick in the head"}

	var c MyInterface = &MyStructP{Name: "Sick in the head"}
	slog.Info("Pointer type ->", "name", c.GetName())

}
