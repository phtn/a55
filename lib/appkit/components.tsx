import { AnimatedNumber } from '@/components/animated-number'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'
import { ChangeEvent, ReactNode, Ref, useId } from 'react'

interface TitleProps {
  id: string
  children?: ReactNode
}
export const Title = ({ id, children }: TitleProps) => {
  return (
    <label
      htmlFor={id}
      className='text-xs tracking-wide md:tracking-wide uppercase font-exo font-bold italic opacity-70 mb-2 mx-3 select-none'>
      {children}
    </label>
  )
}

interface USDValueProps {
  value: number
}

export const USDValue = ({ value }: USDValueProps) => {
  if (!Number.isFinite(value) || value <= 0) {
    return null
  }

  return (
    <div className='md:text-sm mt-2 flex items-center'>
      <span className='text-xl font-sans font-bold text-white/60 mr-2'>≈</span>
      <span className='text-sm font-okxs opacity-90'>
        <span className='text-sm font-okxs font-light mx-px opacity-70'>$</span>
        <AnimatedNumber value={value} precision={2} stiffness={100} mass={0.1} damping={120} />
        {/*{value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*/}
      </span>
    </div>
  )
}

interface AddressInputFieldProps {
  label: string
  isValid: boolean | null
  value: string
  inputRef: Ref<HTMLInputElement>
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  pasteFn: VoidFunction
}
export const AddressInputField = ({ label, isValid, value, inputRef, onChange, pasteFn }: AddressInputFieldProps) => {
  const id = useId()
  return (
    <div className='mb-7'>
      <Title id={id}>{label}</Title>
      <div className='relative group mt-2'>
        <div
          className={`absolute inset-0 rounded-xl blur-md transition-opacity duration-300 ${
            isValid === true
              ? 'bg-linear-to-r from-emerald-500/5 to-emerald-400/5'
              : isValid === false
                ? 'bg-red-500/20 opacity-100'
                : 'opacity-0'
          }`}
        />
        <div
          className={`relative flex items-center md:gap-0 gap-0 p-1 md:p-3 rounded-xl bg-white/5 border transition-colors ${
            isValid === true
              ? 'border-emerald-400/50'
              : isValid === false
                ? 'border-red-500/50'
                : 'border-white/10 group-hover:border-white/20'
          }`}>
          <input
            type='text'
            id={id}
            value={value}
            spellCheck='false'
            placeholder='0x...'
            ref={inputRef}
            onChange={onChange}
            className='flex-1 p-2 bg-transparent text-white font-brk text-xs md:text-sm placeholder-white/30 outline-none'
          />
          {isValid !== null && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              {isValid ? (
                <Icon name='arrow-right' className='size-4 text-emerald-400' />
              ) : (
                <Icon name='bet69' className='size-4 text-red-400' />
              )}
            </motion.div>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={pasteFn}
            className='p-2 rounded-lg bg-white/0 hover:bg-white/5 transition-colors'>
            <Icon name='clipboard' className='size-5 text-white/60' />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
interface GlowDividerProps {
  className?: string
  position?: 'left' | 'center' | 'right'
}

export const GlowDivider = ({ position }: GlowDividerProps) => (
  <motion.div
    initial={{ x: -100 }}
    animate={{ x: position === 'left' ? -100 : position === 'right' ? 100 : 0 }}
    transition={{ ease: 'easeInOut' }}
    className={cn('relative h-px translate-y-0 mx-6', {
      'left-0': position === 'left',
      'right-0': position === 'right',
      'mx-auto': position === 'center'
    })}>
    <div className='absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent' />
    <div className='absolute inset-0 bg-linear-to-r from-transparent via-indigo-400/40 to-transparent blur-[3px]' />
  </motion.div>
)
