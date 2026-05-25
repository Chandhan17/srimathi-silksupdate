import { motion as Motion } from 'framer-motion'

export default function SectionReveal({ children, delay = 0 }) {
  return (
    <Motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    >
      {children}
    </Motion.div>
  )
}
