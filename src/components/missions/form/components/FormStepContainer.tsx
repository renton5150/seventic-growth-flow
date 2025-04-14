
import React from "react";
import { motion } from "framer-motion";

interface FormStepContainerProps {
  children: React.ReactNode;
  isActive: boolean;
}

// Animation variants
const formVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

export function FormStepContainer({ children, isActive }: FormStepContainerProps) {
  if (!isActive) return null;
  
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={formVariants}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {children}
    </motion.div>
  );
}
