package two

import "core:fmt"

variables :: proc() {
	number: int

	fmt.println(number)

	number = 7

	fmt.println(number)

	yet_another_number := 10

	fmt.println(yet_another_number)

	float_number: f32

	//so if its 0 then it just print
	fmt.println(float_number)

	float_number = 7.2

	fmt.println(float_number)
}
