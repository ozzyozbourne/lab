package main

type MyInterface interface {
	SetName(name string)
	GetName() string
}

type MyStruct struct {
	Name string
}

type MyStructP struct {
	Name string
}

// when is the being acted on the the struct we pass in a copy SetName function
// a := struct.copy
// SetName(a, "name")
func (s MyStruct) SetName(name string) {
	s.Name = name
}

func (s MyStruct) GetName() string {
	return s.Name
}

func (s *MyStructP) SetName(name string) {
	s.Name = name
}

func (s *MyStructP) GetName() string {
	return s.Name
}
