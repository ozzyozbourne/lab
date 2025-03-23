package main

import (
	"fmt"
	"math/rand"
)

type Player interface {
	KickBall() int
	Name() string
	modify()
}

type CR7 struct {
	name    string
	stamina int
	power   int
	SUI     int
}

type Messi struct {
	name    string
	stamina int
	power   int
	SUI     int
}

type FootballPlayer struct {
	name    string
	stamina int
	power   int
}

// when we dont have a pointer reciever then dont the
// actual value and the pointer value can call the function
// this doesnt have a pointer reciever
func (f *CR7) KickBall() int {
	return f.stamina + f.power + f.SUI
}

// so can be called by both by a actual value or a pointer to the value
func (f CR7) Name() string {
	return f.name
}

func (f CR7) modify() {
	f.name = "Cristinao Rolando"
}

func (f *Messi) KickBall() int {
	return f.stamina + f.power + f.SUI
}

func (f *Messi) Name() string {
	return f.name
}

func (f *Messi) modify() {}

func (f *FootballPlayer) KickBall() int {
	return f.stamina + f.power
}

func (f *FootballPlayer) Name() string {
	return f.name
}

func (f *FootballPlayer) modify() {}

func main() {
	cr7 := CR7{
		name:    "CR7",
		stamina: 10,
		power:   10,
		SUI:     10,
	}

	team := make([]Player, 11)

	for i := 0; i < len(team)-2; i++ {
		team[i] = &FootballPlayer{
			name:    "unkown",
			stamina: rand.Intn(10),
			power:   rand.Intn(10),
		}
	}

	// can send here an actual value or pointer the struct value both will work
	// since we are an array of interface of type player so
	// in the interfaces in golang doesnt care the about the underlaying type
	// whether it is an an actual value or a pointer to the actual value
	team[len(team)-1] = &cr7

	team[len(team)-2] = &Messi{
		name:    "Messi",
		stamina: 10,
		power:   10,
		SUI:     10,
	}

	for _, t := range team {
		fmt.Printf("%s is kicking the ball %d\n", t.Name(), t.KickBall())
	}

	// call by using a pointer reciever so name should be modified for team[10]
	team[10].modify()

	fmt.Printf("value of the cr variable      -> %+v\n", cr7)
	fmt.Printf("value of the team cr variable -> %+v\n", team[10])

	nillable()
}
