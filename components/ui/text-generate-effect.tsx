// components/ui/text-generate-effect.tsx
"use client";
import { useEffect } from "react";
import { motion, stagger, useAnimate } from "framer-motion";
import { cn } from "@/lib/utils";

interface TextGenerateEffectProps {
  words: string;
  className?: string;
  textSize?: string;
  textWeight?: string;
  textColor?: string;
}

export const TextGenerateEffect = ({
  words,
  className,
  textSize = "text-lg", // default to text-lg
  textWeight = "font-normal", // default to font-normal
  textColor = "text-gray-500", // default to text-gray-500
}: TextGenerateEffectProps) => {
  const [scope, animate] = useAnimate();
  let wordsArray = words.split(" ");

  useEffect(() => {
    animate(
      "span",
      {
        opacity: 1,
      },
      {
        duration: 2,
        delay: stagger(0.2),
      }
    );
  }, [scope.current]);

  const renderWords = () => {
    return (
      <motion.div ref={scope}>
        {wordsArray.map((word, idx) => (
          <motion.span
            key={word + idx}
            className={`opacity-0 ${textColor} ${textSize} ${textWeight}`}
          >
            {word}{" "}
          </motion.span>
        ))}
      </motion.div>
    );
  };

  return <div className={cn(className)}>{renderWords()}</div>;
};
