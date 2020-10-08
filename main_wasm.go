package main

import (
	"bytes"
	"encoding/json"
	"log"
	"syscall/js"
)

// https://golang.org/pkg/syscall/js/

func main() {
	log.Printf("main: start")
	log.SetOutput(&logger{})
	js.Global().Set("wasmParaseDemo", js.FuncOf(wasmParaseDemo))
	select {}
}

type logger struct{}

func (logger) Write(p []byte) (int, error) {
	js.Global().Call("wasmLogger", string(p))
	return len(p), nil
}

func wasmParaseDemo(this js.Value, args []js.Value) interface{} {
	log.Printf("start")
	if len(args) != 1 {
		log.Printf("args error")
	}
	buf := make([]byte, args[0].Get("byteLength").Int())
	js.CopyBytesToGo(buf, args[0])
	match, err := Parse(bytes.NewReader(buf))
	if err != nil {
		log.Printf("parse error %s", err.Error())
	}
	writer := bytes.NewBufferString("")
	json.NewEncoder(writer).Encode(match)
	log.Printf("end")
	return js.ValueOf(writer.String())
}
