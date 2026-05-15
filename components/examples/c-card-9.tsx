import { Badge } from '@/components/reui/badge'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight02Icon, NotificationIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

export function CardPattern() {
  return (
    <Card className='w-full max-w-xs p-0'>
      <CardContent className='flex flex-col gap-5 p-0'>
        <div className='relative h-48 w-full overflow-hidden'>
          <Image src='/icons/69.svg' alt='16:9' fill className='object-cover' />
        </div>

        <div className='flex flex-col items-center gap-4 p-6 pt-0'>
          <Badge variant='outline'>
            <HugeiconsIcon icon={NotificationIcon} strokeWidth={2} aria-hidden='true' />
            Trending
          </Badge>

          <p className='text-foreground text-center text-sm'>
            Making your design process faster and easier. Design tools for your team.
          </p>

          <Button className='w-fit'>
            Get Started
            <HugeiconsIcon icon={ArrowRight02Icon} strokeWidth={2} aria-hidden='true' />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
