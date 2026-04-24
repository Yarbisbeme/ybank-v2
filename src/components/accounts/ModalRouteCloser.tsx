"use client";
import { useRouter, usePathname } from "next/navigation";
import AccountFormWrapper from "./AccountFormWrapper";

export default function ModalRouteCloser({ initialData, institutionsData }: any) {
  const router = useRouter();
  const pathname = usePathname();

  const handleClose = () => {
    // Al hacer push al pathname limpio, desaparecen los ?newAccount=true
    router.push(pathname, { scroll: false });
  };

  return (
    <AccountFormWrapper 
      initialData={initialData} 
      institutions={institutionsData} 
      onSuccess={handleClose} 
    />
  );
}