package main

import (
	"log"
	"sync"
	"time"
)

type Task interface {
	Process()
}

type EmailTask struct {
	Email       string
	Subject     string
	MessageBody string
}

func (t *EmailTask) Process() {
	log.Printf("Sending email to %s\n", t.Email)
	time.Sleep(2 * time.Second)
}

type ImageProcessingTask struct {
	ImageUrl string
}

func (i *ImageProcessingTask) Process() {
	log.Printf("Processing Image %s\n", i.ImageUrl)
	time.Sleep(5 * time.Second)
}

type WorkerPool struct {
	Tasks       []Task
	concurrency int
	tChan       chan Task
	wg          sync.WaitGroup
}

func (wp *WorkerPool) worker() {
	for task := range wp.tChan {
		task.Process()
		wp.wg.Done()
	}
}

func (wp *WorkerPool) Run() {
	wp.tChan = make(chan Task, len(wp.Tasks))

	wp.wg.Add(len(wp.Tasks))
	for range len(wp.Tasks) {
		go wp.worker()
	}

	for _, task := range wp.Tasks {
		wp.tChan <- task
	}
	close(wp.tChan)
	wp.wg.Wait()
}
