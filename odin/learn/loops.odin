package basics

import "core:fmt"

loops :: proc(n: i32) -> i32 {
	fmt.println(n)
	for i in 0 ..< 5 {
		fmt.println(i)
	}

	for i := 0; i < 5; i += 1 {
		fmt.println(i)
	}

	return 0
}
