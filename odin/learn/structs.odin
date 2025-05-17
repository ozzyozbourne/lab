package basics

import "core:fmt"

Cat :: struct {
	name: string,
	age:  int,
}

structs :: proc() -> Cat {

	cat1: Cat
	cat1.name = "alskdjasd"
	cat1.age = 23

	fmt.println(cat1)
	return cat1
}
