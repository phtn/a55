'use client'

import { FaqsSec } from '@/components/product/faqs'
import { ProductLoader } from '@/components/product/loader'
import { ProductList } from '@/components/product/product-list'
import { Typewrite } from '@/components/text/typewriter'
import { Button } from '@/components/ui/button'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Input } from '@/components/ui/input'
import { api } from '@/convex/_generated/api'
import { useToggle } from '@/hooks/use-toggle'
import { SearchParamsProvider } from '@/lib/appkit/params-ctx'
import { useFirebaseUser } from '@/lib/firebase/auth'
import { Icon } from '@/lib/icons'
import { useMutation, useQuery } from 'convex/react'
import { SubmitEvent, Suspense, useCallback, useRef, useState } from 'react'
import { AccountBalance } from './account-balance'
import { RecentTxn } from './recent-txn'

const XContent = () => {
  const { user } = useFirebaseUser()
  const accounts = useQuery(api.accounts.q.getAccountsBySub, user?.uid ? { sub: user.uid } : 'skip')
  const account = accounts?.[0] ?? null
  const stakeIds = account?.stakes ?? null
  const stakes = useQuery(api.stakes.q.listStakesById, stakeIds ? { ids: stakeIds } : 'skip')
  const history = useQuery(api.history.q.listByAccountId, account?._id ? { accountId: account._id } : 'skip') ?? null
  const txns = useQuery(api.txns.q.listByAccountId, account?._id ? { accountId: account._id } : 'skip') ?? null
  const updateTitle = useMutation(api.accounts.m.updateTitle)
  const [title, setTitle] = useState('')
  const { on: showProductList, toggle: toggleProductList } = useToggle(false)
  const [error, setError] = useState<Error | null>(null)
  const [isPayModalOpen, setIsPayModalOpen] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const { on: edit, toggle: toggleEdit } = useToggle(false)
  const isStakesLoading = stakes === undefined
  const shouldShowProductList = isPayModalOpen || stakes?.length === 0 || showProductList

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
  }

  const handleEditTitle = useCallback(() => {
    toggleEdit()
    if (titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [toggleEdit])

  const handleSetTitle = useCallback(
    async (e: SubmitEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (!user) return
      const trimmedTitle = title.trim()
      if (!trimmedTitle) {
        return
      }

      try {
        await updateTitle({
          id: account?._id ?? null,
          sub: user.uid,
          title: trimmedTitle
        })
      } catch (e) {
        setError(e as Error)
      } finally {
        toggleEdit()
      }
    },
    [updateTitle, user, setError, title, toggleEdit, account]
  )

  return (
    <div className='max-w-6xl space-y-4 md:space-y-8'>
      <section className='space-y-2'>
        <div className='flex gap-4 items-end lg:justify-between'>
          <div className='max-w-2xl space-y-1 h-16 flex flex-col justify-center w-full px-1'>
            <Eyebrow>Active</Eyebrow>
            <div className='flex items-center space-x-4 group'>
              {edit ? (
                <form onSubmit={handleSetTitle}>
                  <Input
                    autoFocus
                    ref={titleInputRef}
                    defaultValue={title}
                    onChange={handleTitleChange}
                    placeholder={account?.title ?? ''}
                    className='font-poly font-bold text-lg md:text-xl tracking-tight placeholder:opacity-40 border-none rounded-lg max-w-39 bg-transparent focus-visible:ring-0 outline-none -ml-3'
                  />
                </form>
              ) : account?.title ? (
                <Typewrite
                  speed={25}
                  showCursor={false}
                  text={account.title}
                  className='font-poly font-bold text-foreground text-lg md:text-xl tracking-tight w-24'
                />
              ) : (
                <Icon name='spinner-ring' />
              )}

              <Button
                type={title ? 'submit' : 'button'}
                onClick={handleEditTitle}
                variant='ghost'
                size='icon'
                className='group-hover:opacity-100 opacity-0'>
                <Icon name={edit ? (title ? 'check' : 'close') : 'cf-pen'} className='size-4 aspect-square' />
              </Button>

              {error && <p className='text-red-500'>{error.message}</p>}
            </div>
          </div>

          <div className='rounded-sm bg-foreground/8 px-4 py-2 text-right min-w-36'>
            <Eyebrow>Stake Value</Eyebrow>
            <p className='mt-1 font-display font-medium text-foreground text-sm text-right'>$0</p>
          </div>
        </div>
      </section>

      {isStakesLoading && !isPayModalOpen ? (
        <ProductLoader />
      ) : shouldShowProductList ? (
        <ProductList
          accountId={account?._id ?? null}
          isPayModalOpen={isPayModalOpen}
          onPayModalOpenChange={setIsPayModalOpen}
          onClose={toggleProductList}
        />
      ) : (
        <AccountBalance stakes={stakes ?? []} history={history} toggleProductList={toggleProductList} />
      )}

      <div>{isStakesLoading || shouldShowProductList ? <FaqsSec /> : <RecentTxn txns={txns} balance={0} />}</div>
    </div>
  )
}

export const Content = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <SearchParamsProvider>
      <XContent />
    </SearchParamsProvider>
  </Suspense>
)
