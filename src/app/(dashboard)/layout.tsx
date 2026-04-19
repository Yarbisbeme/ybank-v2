import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

// Definimos el componente como una constante primero
const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 border-r bg-white z-50">
        <Sidebar />
      </aside>

      <div className="flex-1 lg:ml-64 flex flex-col">
        <Navbar />
        <main className="p-4 md:p-8 lg:p-12 max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

// Exportamos explícitamente al final
export default DashboardLayout;