'use client'

export const Content = () => {
  return (
    <section className='max-w-6xl space-y-4 md:space-y-8'>
      <div className='rounded-xl border border-border/50 bg-background/70 p-6'>
        <p className='font-display text-xl font-medium tracking-tight'>Users</p>
        <p className='mt-2 max-w-2xl text-sm text-muted-foreground'>
          User-facing admin tools can live here: moderation, access controls, and account inspection.
        </p>
      </div>
    </section>
  )
}
