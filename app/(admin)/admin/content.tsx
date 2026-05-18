'use client'

export const Content = () => {
  return (
    <section className='max-w-6xl space-y-4 md:space-y-8'>
      <div className='rounded-xl border border-border/50 bg-background/70 p-6'>
        <p className='font-display text-xl font-medium tracking-tight'>Admin overview</p>
        <p className='mt-2 max-w-2xl text-sm text-muted-foreground'>
          This is the root admin surface. Keep global admin metrics and shortcuts here.
        </p>
      </div>
    </section>
  )
}
