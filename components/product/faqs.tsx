import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export function FaqsSec() {
  return (
    <div className='mx-auto w-full max-w-6xl space-y-4 pt-4'>
      <Accordion
        className='-space-y-px w-full rounded-md bg-card shadow dark:bg-card/50'
        collapsible
        defaultValue='item-1'
        type='single'>
        {questions.map((item) => (
          <AccordionItem
            className='relative border-x first:rounded-t-lg first:border-t last:rounded-b-lg last:border-b'
            key={item.id}
            value={item.id}>
            <AccordionTrigger className='font-display text-base px-4 py-4 leading-6 hover:no-underline'>
              {item.title}
            </AccordionTrigger>
            <AccordionContent className='px-4 pb-4 text-muted-foreground'>{item.content}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <div className='h-12' />
    </div>
  )
}

const questions = [
  {
    id: 'what',
    title: 'What is a Stake?',
    content:
      'A Stake is a product bundle that allows you to join the high gain bets. The level of risk you take on is determined by the stake size you choose.'
  },
  {
    id: 'how-buy',
    title: 'How do I pay for it?',
    content:
      'We currently accept native tokens including Bitcoin, Ethereum, and Polygon. USDC, and USDT are also accepted through Ethereum and Polygon Networks. You can pay using your preferred crypto wallet.'
  },
  {
    id: 'how-to',
    title: 'How does it work?',
    content: '.'
  },
  {
    id: 'withdrawal',
    title: 'How do I withdraw my funds?',
    content:
      'You can withdraw your funds from your account at any time. All winnings are posted right away and can be withdrawn to your crypto wallet.'
  }
]
