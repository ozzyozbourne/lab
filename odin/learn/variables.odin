package basics

import "core:fmt"

variables :: proc() {
	number: int
	fmt.println(number)

	number = 7
	fmt.println(number)

	another_number: int = 10
	fmt.println(another_number)

	yet_another_number := 42
	fmt.println(yet_another_number)

	fmt.printfln("%.2f", 7.123123)

	test_type := 123.123
	fmt.println(typeid_of(type_of(test_type)))

}
