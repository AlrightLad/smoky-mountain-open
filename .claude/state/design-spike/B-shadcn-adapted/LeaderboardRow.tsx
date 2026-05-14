// Spike B — shadcn/ui adapted to PARBAUGHS tokens (TypeScript/React reference)
//
// This is a REFERENCE FILE for the spike. PARBAUGHS is currently vanilla JS
// and does not consume React. If shadcn-style composition won the spike,
// adopting it would require migrating the dashboard build pipeline to
// React + Tailwind. The HTML/CSS approximation in leaderboard-row.html
// renders the same DOM shape statically.
//
// shadcn primitives consumed: Avatar, Badge, Card. Each follows shadcn's
// "copy the component into your repo" model rather than an npm install.
//
// Tailwind classes here use a PARBAUGHS color extension assumed in
// tailwind.config.js:
//   colors: {
//     'pb-green-900': '#1A2B22', 'pb-green-800': '#243730',
//     'pb-chalk-50': '#F5F1E8', 'pb-chalk-400': '#9C9788',
//     'pb-brass-500': '#C9A961',
//   }

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface LeaderboardEntry {
  rank: number
  initials: string
  name: string
  rounds: number
  badge?: string
  scoreToPar: number
  handicap: number
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry
  isLeader?: boolean
}

export function LeaderboardRow({ entry, isLeader = false }: LeaderboardRowProps) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 px-4 py-3 border-b border-pb-chalk-50/10",
        "transition-colors hover:bg-pb-green-800/60",
        "last:border-b-0",
        isLeader && "bg-gradient-to-r from-pb-brass-500/[0.06] to-transparent"
      )}
    >
      <span
        className={cn(
          "font-mono text-[13px] tabular-nums w-7 text-right text-pb-chalk-400",
          isLeader && "text-pb-brass-500 font-semibold"
        )}
      >
        {entry.rank}
      </span>

      <Avatar className={cn("h-9 w-9 border border-pb-chalk-50/10",
        isLeader && "border-pb-brass-500 ring-2 ring-pb-brass-500/15")}>
        <AvatarFallback className="bg-pb-green-700 text-pb-chalk-100 font-display text-sm">
          {entry.initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium text-pb-chalk-50 truncate leading-tight">
          {entry.name}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-mono text-[11px] uppercase tracking-wide text-pb-chalk-400">
            {entry.rounds} rounds
          </span>
          {entry.badge && (
            <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wide border-pb-chalk-400/20 text-pb-chalk-400">
              {entry.badge}
            </Badge>
          )}
        </div>
      </div>

      <div className="font-mono text-lg font-semibold tabular-nums text-pb-chalk-50 min-w-[48px] text-right">
        {entry.scoreToPar > 0 ? "+" : ""}{entry.scoreToPar}
      </div>
      <div className="font-mono text-[11px] tabular-nums text-pb-chalk-400 min-w-[36px] text-right uppercase tracking-wide">
        {entry.handicap}
      </div>
    </li>
  )
}

export function LeaderboardList({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <ol
      role="list"
      className="bg-pb-green-800 border border-pb-chalk-50/10 rounded-md overflow-hidden"
    >
      {entries.map((entry, i) => (
        <LeaderboardRow key={entry.rank} entry={entry} isLeader={i === 0} />
      ))}
    </ol>
  )
}

// Stand-in usage:
// const entries = [
//   { rank: 1, initials: "ZB", name: "Zach Boogher", rounds: 7, badge: "founding", scoreToPar: 12, handicap: 18.8 },
//   ...
// ]
// <LeaderboardList entries={entries} />
