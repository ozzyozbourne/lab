package basics

import "core:fmt"

Error :: enum {
	None,
}

pointers :: proc(cat: ^Cat) -> Error {
	checker(cat) or_return
	fmt.println(cat)
	fmt.printfln("%p", cat)
	cat.age = 1212
	return nil
}

checker :: proc(cat: ^Cat) -> Error {
	if cat == nil {
		return .None
	}
	return nil
}
