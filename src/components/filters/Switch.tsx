import { cn } from "@/lib/utils";
import { motion } from 'framer-motion'

export const Switch = ({ checked, onChange, disabled }: { checked: boolean, onChange: () => void, disabled?: boolean }) => (
  <button
    type="button"
    onClick={onChange}
    disabled={disabled}
    className={cn(
      "w-11 h-6 rounded-full p-1 transition-all duration-300 ease-in-out flex items-center",
      checked ? "bg-primary" : "bg-border",
      disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
    )}
  >
    <motion.div
      animate={{ x: checked ? 20 : 0 }}
      className="w-4 h-4 bg-white rounded-full shadow-sm"
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
    />
  </button>
)