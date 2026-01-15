"use client";

import Lottie from "lottie-react";
import animationData from "../../../public/animations/OnlinePayment.json";

export default function OnlinePaymentAnimation() {
  return (
    <Lottie
      animationData={animationData}
      loop
      autoplay
      className="w-[360px] h-[360px]"
    />
  );
}
