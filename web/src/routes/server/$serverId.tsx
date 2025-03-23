import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/server/$serverId')({
    component: RouteComponent,
})

function RouteComponent() {
    return <div>Hello "/server/$serverId"!</div>
}
