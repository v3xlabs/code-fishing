import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div className="mx-auto w-full max-w-md space-y-4">
    <div className="card">
      <div>
        hello
      </div>
      <button onClick={() => { }} className="button">
        hello
      </button>
    </div>
    <div className="card">
      <div>
        hello
      </div>
      <button onClick={() => { }} className="button">
        hello
      </button>
    </div>
  </div>
}
