import React from 'react'
import { useDarkMode } from '../contexts/DarkModeContext'
import { BsSun, BsMoon } from 'react-icons/bs'

const DarkModeToggle: React.FC = () => {
  const { isDark, toggleDarkMode } = useDarkMode()

  return (
    <button
      onClick={toggleDarkMode}
      className="flex items-center justify-center w-10 h-10 rounded-alvion bg-alvion-neutral-light-80 dark:bg-alvion-neutral-dark-80 hover:bg-alvion-neutral-light-70 dark:hover:bg-alvion-neutral-dark-70 transition-colors duration-200"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <BsSun size={20} color="#F8F9FA" /> : <BsMoon size={20} color="#2D2DF1" />}
    </button>
  )
}

export default DarkModeToggle
