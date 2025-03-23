package main

import (
	"log"
	"net/http"
)

func home(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("hello from snippetbox"))
}

func snippetView(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("Display a specific snippet...."))
}

func snippetCreate(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("Display a form for creating a new snippet..."))
}

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/", home)
	mux.HandleFunc("/snippet/view", snippetView)
	mux.HandleFunc("/snippet/create", snippetCreate)

	mux.HandleFunc("/static/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Subtree match handler"))
	})

	mux.HandleFunc("/static/css/style.css", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Exact match handler"))
	})

	log.Printf("Starting the server on :4000\n")

	err := http.ListenAndServe(":4000", mux)
	log.Fatal(err)
}
