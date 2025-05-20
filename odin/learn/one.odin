package basics

import "core:fmt"

main :: proc() {
	fmt.println("Hellop!")
	variables()
	loops(10)
	if_statements(12)

	cat := structs()
	fmt.println(cat)

	_ = pointers(&cat)
	fmt.println(cat)
}
