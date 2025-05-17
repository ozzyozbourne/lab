package basics

import "core:fmt"


pointers :: proc(cat: ^Cat) {
	cat := checker(cat) or_else nil
	fmt.println(cat)
	fmt.printfln("%p", cat)
	cat.age = 1212

}

checker :: proc(cat: ^Cat) -> (^Cat, bool) {
	if cat == nil {
		return cat, false
	} else {
		return cat, true
	}
}
