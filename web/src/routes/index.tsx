// import { CodeListOrder } from '@/components/CodeListOrder'
// import { PartyProgress } from '@/components/PartyProgress'
// import { ServerFinder } from '@/components/ServerFinder'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div className="mx-auto w-full max-w-4xl flex flex-wrap gap-4 pt-8">
    <div className="card flex-1 flex flex-col gap-1">
      <h1 className="">Let&apos;s fish some base codes!</h1>
      <p className="text-secondary">Code raiding is the age-old process of endlessly trying codes on your enemies base until you find one that works.</p>
      <h2 className="text-accent pt-4">How-to Code Raid:</h2>
      <p className="text-secondary">
        Code raiding generally involves three steps:
      </p>
      <ul>
        <li>
          - Place bags
        </li>
        <li>
          - Try codes
        </li>
        <li>
          - Profit
        </li>
      </ul>
      <h2 className="text-accent pt-4">Let&apos;s go!</h2>
      <p className="text-secondary">Use this site to coordinate with ur group. And profit efficiently.</p>
    </div>
    <div className="flex h-fit gap-4 flex-col">
      <div className="card flex-1 flex flex-col gap-1">
        <h2>Create a party</h2>
        <p className="text-secondary">Start a code raid</p>
        <button className="button">Create</button>
      </div>
      <div className="card flex-1 flex flex-col gap-1">
        <h2>Join a party</h2>
        <p className="text-secondary">Enter party code to join a party.</p>
        <div className="flex gap-2">
          <input type="text" placeholder="Party code" className="input" />
          <button className="button grow h-full">Join</button>
        </div>
      </div>
    </div>
    {/* <CodeListOrder /> */}
    {/* <PartyProgress /> */}
    {/* <ServerFinder /> */}
  </div>
}
