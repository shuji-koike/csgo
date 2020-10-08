import React from "react"
import { DemoPlayer } from "./demo/DemoPlayer"

export const Sandbox: React.FC = () => {
  const [match, setMatch] = React.useState<Match | null>(null)
  const [output, setOutput] = React.useState([])
  function parseDemo(file?: File) {
    if (!file) return
    const worker = new Worker("/static/worker.js")
    worker.postMessage(["wasmParaseDemo", file])
    worker.onmessage = function ({ data: [cmd, ...args] }) {
      switch (cmd) {
        case "wasmParaseDemo":
          setMatch(args[0])
          worker.terminate()
          break
        case "wasmLogger":
          setOutput(output.concat(args))
          break
      }
    }
  }
  return match ? (
    <DemoPlayer match={match} tick={0} />
  ) : (
    <main>
      <h1>CSGO Demo 2D Analyzer</h1>
      <p>Please click the button below and select a dem file.</p>
      <input
        type="file"
        accept=".dem"
        onChange={e => parseDemo(e.currentTarget.files?.[0])}
      />
      <small>
        <p>Parse will start automatically and may take up to few minutes.</p>
        <p>Only Google Chrome is supported!</p>
      </small>
      <pre>{output.join("\n")}</pre>
    </main>
  )
}
